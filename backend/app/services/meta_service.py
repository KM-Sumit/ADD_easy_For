"""
Meta Marketing API service.
Handles OAuth flow and campaign management.
SECURITY: Access tokens are NEVER logged or returned to the frontend.
"""

import httpx
import secrets
import logging
from typing import Optional, List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

# In-memory state store for OAuth CSRF protection (short-lived, MVP-level)
# In production, use Redis with TTL
_oauth_states: Dict[str, int] = {}  # state -> user_id

META_GRAPH_URL = f"https://graph.facebook.com/{settings.META_API_VERSION}"
META_DIALOG_URL = "https://www.facebook.com/dialog/oauth"
META_TOKEN_URL = f"https://graph.facebook.com/{settings.META_API_VERSION}/oauth/access_token"

REQUIRED_SCOPES = [
    "ads_management",
    "ads_read",
    "instagram_business_basic",  # instagram_basic is deprecated; use instagram_business_basic for Meta Business Login
    "pages_show_list",
    "business_management",
]


def is_configured() -> bool:
    """Check if Meta credentials are configured."""
    return bool(settings.META_APP_ID and settings.META_APP_SECRET)


def generate_oauth_url(user_id: int) -> str:
    """Generate a Meta OAuth authorization URL with CSRF state."""
    if not is_configured():
        raise ValueError("Meta App ID and Secret are not configured.")

    state = secrets.token_urlsafe(32)
    _oauth_states[state] = user_id

    params = {
        "client_id": settings.META_APP_ID,
        "redirect_uri": settings.META_REDIRECT_URI,
        "scope": ",".join(REQUIRED_SCOPES),
        "response_type": "code",
        "state": state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{META_DIALOG_URL}?{query}"


def validate_and_consume_state(state: str) -> Optional[int]:
    """Validate OAuth state parameter and return associated user_id. One-time use."""
    user_id = _oauth_states.pop(state, None)
    return user_id


async def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """Exchange OAuth authorization code for an access token."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            META_TOKEN_URL,
            params={
                "client_id": settings.META_APP_ID,
                "client_secret": settings.META_APP_SECRET,
                "redirect_uri": settings.META_REDIRECT_URI,
                "code": code,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def get_long_lived_token(short_token: str) -> Dict[str, Any]:
    """Exchange a short-lived token for a long-lived token (60 days)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{META_GRAPH_URL}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.META_APP_ID,
                "client_secret": settings.META_APP_SECRET,
                "fb_exchange_token": short_token,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def get_ad_accounts(access_token: str) -> List[Dict[str, Any]]:
    """Fetch ad accounts accessible with the given token."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{META_GRAPH_URL}/me/adaccounts",
            params={
                "fields": "id,name,account_status,currency,account_id",
                "access_token": access_token,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])


async def get_instagram_accounts(access_token: str) -> List[Dict[str, Any]]:
    """Fetch Instagram business accounts linked to this Meta user."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{META_GRAPH_URL}/me/accounts",
            params={
                "fields": "id,name,instagram_business_account",
                "access_token": access_token,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        pages = data.get("data", [])
        ig_accounts = []
        for page in pages:
            ig = page.get("instagram_business_account")
            if ig:
                ig_accounts.append({"page_id": page["id"], "page_name": page.get("name"), **ig})
        return ig_accounts


def _objective_to_meta(goal: str) -> str:
    """Map app campaign goal to Meta API objective."""
    mapping = {
        "sales": "OUTCOME_SALES",
        "leads": "OUTCOME_LEADS",
        "website_traffic": "OUTCOME_TRAFFIC",
    }
    return mapping.get(goal.lower(), "OUTCOME_TRAFFIC")


def _country_to_geo(country: str) -> List[Dict]:
    """Simple country name → Meta geo targeting format."""
    country_codes = {
        "india": "IN", "united states": "US", "usa": "US",
        "united kingdom": "GB", "uk": "GB", "canada": "CA",
        "australia": "AU", "germany": "DE", "france": "FR",
    }
    code = country_codes.get(country.lower(), country.upper()[:2])
    return [{"country_code": code}]


async def create_full_campaign(
    access_token: str,
    ad_account_id: str,
    campaign_data: Dict[str, Any],
    product: Any,
) -> Dict[str, str]:
    """
    Create a complete Instagram campaign via Meta Marketing API.
    Steps: Campaign → Ad Set → Ad Creative → Ad
    Returns dict with external IDs.
    """
    account_ref = f"act_{ad_account_id.replace('act_', '')}"
    objective = _objective_to_meta(campaign_data.get("objective", "website_traffic"))
    budget_cents = int(float(campaign_data.get("daily_budget", 500)) * 100)

    async with httpx.AsyncClient() as client:
        # ── 1. Create Campaign ──────────────────────────────────────────────
        camp_resp = await client.post(
            f"{META_GRAPH_URL}/{account_ref}/campaigns",
            params={"access_token": access_token},
            json={
                "name": campaign_data.get("campaign_name", f"InstaPilot - {product.name}"),
                "objective": objective,
                "status": "PAUSED",
                "special_ad_categories": [],
            },
            timeout=30,
        )
        camp_resp.raise_for_status()
        campaign_id = camp_resp.json()["id"]

        # ── 2. Create Ad Set ────────────────────────────────────────────────
        targeting = {
            "geo_locations": {
                "countries": [c["country_code"] for c in _country_to_geo(campaign_data.get("target_country", "IN"))],
            },
            "age_min": campaign_data.get("age_min", 18),
            "age_max": campaign_data.get("age_max", 65),
            "publisher_platforms": ["instagram"],
            "instagram_positions": ["stream", "story", "reels"],
        }

        if campaign_data.get("interests"):
            # Interests require IDs from Meta's targeting search; pass raw for now
            pass

        adset_resp = await client.post(
            f"{META_GRAPH_URL}/{account_ref}/adsets",
            params={"access_token": access_token},
            json={
                "name": f"Ad Set - {product.name}",
                "campaign_id": campaign_id,
                "daily_budget": budget_cents,
                "billing_event": "IMPRESSIONS",
                "optimization_goal": "REACH" if objective == "OUTCOME_TRAFFIC" else "CONVERSIONS",
                "targeting": targeting,
                "status": "PAUSED",
                "destination_type": "WEBSITE",
            },
            timeout=30,
        )
        adset_resp.raise_for_status()
        adset_id = adset_resp.json()["id"]

        # ── 3. Create Ad Creative ───────────────────────────────────────────
        ad_copy = campaign_data.get("ad_copy", {})
        creative_payload = {
            "name": f"Creative - {product.name}",
            "object_story_spec": {
                "page_id": campaign_data.get("page_id", ""),
                "instagram_actor_id": campaign_data.get("instagram_account_id", ""),
                "link_data": {
                    "link": product.url or "https://example.com",
                    "message": ad_copy.get("primary_text", product.description or ""),
                    "name": ad_copy.get("headline", product.name),
                    "description": ad_copy.get("description", ""),
                    "call_to_action": {
                        "type": _cta_to_meta(ad_copy.get("cta", "LEARN_MORE")),
                        "value": {"link": product.url or "https://example.com"},
                    },
                },
            },
        }
        if product.image_url:
            creative_payload["object_story_spec"]["link_data"]["picture"] = product.image_url

        creative_resp = await client.post(
            f"{META_GRAPH_URL}/{account_ref}/adcreatives",
            params={"access_token": access_token},
            json=creative_payload,
            timeout=30,
        )
        creative_resp.raise_for_status()
        creative_id = creative_resp.json()["id"]

        # ── 4. Create Ad ────────────────────────────────────────────────────
        ad_resp = await client.post(
            f"{META_GRAPH_URL}/{account_ref}/ads",
            params={"access_token": access_token},
            json={
                "name": f"Ad - {product.name}",
                "adset_id": adset_id,
                "creative": {"creative_id": creative_id},
                "status": "PAUSED",
            },
            timeout=30,
        )
        ad_resp.raise_for_status()
        ad_id = ad_resp.json()["id"]

    return {
        "campaign_id": campaign_id,
        "adset_id": adset_id,
        "creative_id": creative_id,
        "ad_id": ad_id,
    }


def _cta_to_meta(cta: str) -> str:
    mapping = {
        "shop now": "SHOP_NOW",
        "learn more": "LEARN_MORE",
        "sign up": "SIGN_UP",
        "contact us": "CONTACT_US",
        "book now": "BOOK_TRAVEL",
        "get offer": "GET_OFFER",
        "buy now": "SHOP_NOW",
    }
    return mapping.get(cta.lower(), "LEARN_MORE")


async def get_campaign_insights(access_token: str, campaign_id: str) -> Dict[str, Any]:
    """Fetch campaign performance metrics from Meta."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{META_GRAPH_URL}/{campaign_id}/insights",
            params={
                "fields": "impressions,reach,clicks,spend,ctr,actions",
                "access_token": access_token,
                "date_preset": "lifetime",
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        rows = data.get("data", [])
        if rows:
            row = rows[0]
            conversions = 0
            for action in row.get("actions", []):
                if action.get("action_type") in ("purchase", "lead", "complete_registration"):
                    conversions += int(action.get("value", 0))
            return {
                "impressions": int(row.get("impressions", 0)),
                "reach": int(row.get("reach", 0)),
                "clicks": int(row.get("clicks", 0)),
                "spend": float(row.get("spend", 0)),
                "ctr": float(row.get("ctr", 0)),
                "conversions": conversions,
            }
        return {"impressions": 0, "reach": 0, "clicks": 0, "spend": 0.0, "ctr": 0.0, "conversions": 0}
