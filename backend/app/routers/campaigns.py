import json
import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.campaign import Campaign
from app.models.campaign_metrics import CampaignMetrics
from app.models.connected_account import ConnectedAccount
from app.models.product import Product
from app.models.user import User
from app.schemas.campaign import (
    AIPlanResponse,
    AIAnalysisResponse,
    CampaignLaunchRequest,
    CampaignPlanRequest,
    CampaignResponse,
    MetricsResponse,
)
from app.core.auth import get_current_user
from app.services import ai_service, meta_service
from app.services.encryption import decrypt_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.post("/plan", response_model=AIPlanResponse)
async def plan_campaign(
    payload: CampaignPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Use AI to generate a campaign plan for the given product."""
    product = (
        db.query(Product)
        .filter(Product.id == payload.product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    product_dict = {
        "name": product.name,
        "url": product.url,
        "description": product.description,
        "price": product.price,
        "image_url": product.image_url,
    }
    request_dict = {
        "target_country": payload.target_country,
        "target_cities": payload.target_cities,
        "daily_budget": payload.daily_budget,
        "campaign_goal": payload.campaign_goal,
    }

    plan = await ai_service.generate_campaign_plan(product_dict, request_dict)
    return AIPlanResponse(**plan)


@router.post("/launch", response_model=CampaignResponse, status_code=201)
async def launch_campaign(
    payload: CampaignLaunchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Launch an Instagram campaign via the Meta Marketing API.
    Uses the stored encrypted access token — never asks for credentials again.
    """
    product = (
        db.query(Product)
        .filter(Product.id == payload.product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    connected = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == current_user.id)
        .first()
    )

    campaign_data = {
        "campaign_name": payload.campaign_name,
        "objective": payload.objective,
        "daily_budget": payload.daily_budget,
        "target_country": payload.target_country,
        "age_min": payload.ai_plan.get("audience", {}).get("age_min", 18),
        "age_max": payload.ai_plan.get("audience", {}).get("age_max", 65),
        "ad_copy": payload.ai_plan.get("ad_copy", {}),
        "page_id": "",
        "instagram_account_id": connected.instagram_account_id if connected else "",
    }

    # ── DEMO MODE ───────────────────────────────────────────────────────────
    if not meta_service.is_configured() or not connected or not connected.platform_account_id:
        demo_campaign = Campaign(
            user_id=current_user.id,
            connected_account_id=connected.id if connected else None,
            product_id=product.id,
            platform="instagram",
            external_campaign_id=f"DEMO_CAMP_{current_user.id}_{product.id}",
            external_adset_id=f"DEMO_ADSET_{current_user.id}_{product.id}",
            external_ad_id=f"DEMO_AD_{current_user.id}_{product.id}",
            name=payload.campaign_name,
            objective=payload.objective,
            daily_budget=payload.daily_budget,
            status="DEMO",
            ai_plan=json.dumps(payload.ai_plan),
        )
        db.add(demo_campaign)
        db.commit()
        db.refresh(demo_campaign)
        return demo_campaign

    # ── REAL META API MODE ──────────────────────────────────────────────────
    try:
        access_token = decrypt_token(connected.encrypted_access_token)
        ad_account_id = connected.platform_account_id

        result = await meta_service.create_full_campaign(
            access_token=access_token,
            ad_account_id=ad_account_id,
            campaign_data=campaign_data,
            product=product,
        )

        campaign = Campaign(
            user_id=current_user.id,
            connected_account_id=connected.id,
            product_id=product.id,
            platform="instagram",
            external_campaign_id=result["campaign_id"],
            external_adset_id=result["adset_id"],
            external_ad_id=result["ad_id"],
            name=payload.campaign_name,
            objective=payload.objective,
            daily_budget=payload.daily_budget,
            status="PAUSED",
            ai_plan=json.dumps(payload.ai_plan),
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        return campaign

    except Exception as e:
        logger.error(f"Campaign launch failed: {e}")
        raise HTTPException(status_code=502, detail=f"Campaign launch failed: {str(e)}")


@router.get("", response_model=List[CampaignResponse])
def list_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all campaigns for the current user."""
    return (
        db.query(Campaign)
        .filter(Campaign.user_id == current_user.id)
        .order_by(Campaign.created_at.desc())
        .all()
    )


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific campaign by ID."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    return campaign


@router.get("/{campaign_id}/metrics", response_model=List[MetricsResponse])
async def get_metrics(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get metrics for a campaign. Fetches live data from Meta if available."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    connected = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == current_user.id)
        .first()
    )

    # Attempt live metrics fetch from Meta
    if (
        connected
        and campaign.external_campaign_id
        and not campaign.external_campaign_id.startswith("DEMO_")
        and meta_service.is_configured()
    ):
        try:
            token = decrypt_token(connected.encrypted_access_token)
            live = await meta_service.get_campaign_insights(token, campaign.external_campaign_id)
            metrics = CampaignMetrics(campaign_id=campaign_id, **live)
            db.add(metrics)
            db.commit()
            db.refresh(metrics)
            return [metrics]
        except Exception as e:
            logger.warning(f"Live metrics fetch failed: {e}")

    # Return stored metrics
    return (
        db.query(CampaignMetrics)
        .filter(CampaignMetrics.campaign_id == campaign_id)
        .order_by(CampaignMetrics.recorded_at.desc())
        .limit(10)
        .all()
    )


@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pause a campaign."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    campaign.status = "PAUSED"
    db.commit()
    return {"message": "Campaign paused.", "status": "PAUSED"}


@router.post("/{campaign_id}/resume")
async def resume_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resume (activate) a campaign."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    campaign.status = "ACTIVE"
    db.commit()
    return {"message": "Campaign resumed.", "status": "ACTIVE"}


@router.post("/{campaign_id}/ai-analysis", response_model=AIAnalysisResponse)
async def ai_analysis(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate AI optimization suggestions for a campaign.
    This is read-only — AI provides recommendations only, no automatic changes.
    """
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    latest_metrics = (
        db.query(CampaignMetrics)
        .filter(CampaignMetrics.campaign_id == campaign_id)
        .order_by(CampaignMetrics.recorded_at.desc())
        .first()
    )

    campaign_dict = {
        "name": campaign.name,
        "objective": campaign.objective,
        "daily_budget": campaign.daily_budget,
        "status": campaign.status,
    }
    metrics_dict = {}
    if latest_metrics:
        metrics_dict = {
            "impressions": latest_metrics.impressions,
            "reach": latest_metrics.reach,
            "clicks": latest_metrics.clicks,
            "spend": latest_metrics.spend,
            "ctr": latest_metrics.ctr,
            "conversions": latest_metrics.conversions,
        }

    suggestions = await ai_service.analyze_campaign_performance(campaign_dict, metrics_dict)
    return AIAnalysisResponse(
        suggestions=suggestions,
        is_demo=not bool(meta_service.is_configured()),
    )
