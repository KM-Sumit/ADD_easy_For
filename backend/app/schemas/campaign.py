from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class CampaignPlanRequest(BaseModel):
    product_id: int
    target_country: str
    target_cities: Optional[str] = None
    daily_budget: float
    campaign_goal: str  # sales | leads | website_traffic


class AudienceSuggestion(BaseModel):
    age_min: int
    age_max: int
    location: str
    interests: List[str]
    description: str


class AdCopy(BaseModel):
    primary_text: str
    headline: str
    cta: str
    description: str


class CreativeConcept(BaseModel):
    image_concept: str
    hook: str
    visual_structure: str
    text_overlay: str


class CampaignSettings(BaseModel):
    objective: str
    recommended_daily_budget: float
    suggested_duration_days: int
    placement: str
    notes: str


class AIPlanResponse(BaseModel):
    audience: AudienceSuggestion
    ad_copy: AdCopy
    creative_concept: CreativeConcept
    campaign_settings: CampaignSettings
    is_demo: bool = False


class CampaignLaunchRequest(BaseModel):
    product_id: int
    ai_plan: Dict[str, Any]
    campaign_name: str
    target_country: str
    daily_budget: float
    objective: str


class CampaignResponse(BaseModel):
    id: int
    user_id: int
    product_id: Optional[int]
    platform: str
    external_campaign_id: Optional[str]
    external_adset_id: Optional[str]
    external_ad_id: Optional[str]
    name: str
    objective: Optional[str]
    daily_budget: Optional[float]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MetricsResponse(BaseModel):
    id: int
    campaign_id: int
    impressions: int
    reach: int
    clicks: int
    spend: float
    ctr: float
    conversions: int
    recorded_at: datetime

    model_config = {"from_attributes": True}


class AIAnalysisResponse(BaseModel):
    suggestions: List[str]
    is_demo: bool = False
