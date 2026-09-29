"""
AI Service — modular campaign planning using OpenAI.
To swap OpenAI for another provider, only this file needs to change.
"""

import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

# ── Demo responses (used when OpenAI key is not configured) ────────────────


DEMO_CAMPAIGN_PLAN = {
    "audience": {
        "age_min": 18,
        "age_max": 35,
        "location": "India",
        "interests": ["Online Shopping", "Fashion", "Lifestyle", "Technology"],
        "description": "Young urban adults aged 18–35 who are active on Instagram and interested in lifestyle products. Likely to engage with visually appealing content.",
    },
    "ad_copy": {
        "primary_text": "✨ Discover the product everyone's talking about! Premium quality, unbeatable price. Shop now and get exclusive deals.",
        "headline": "Limited Time Offer — Shop Now!",
        "cta": "Shop Now",
        "description": "High-quality products delivered to your door. Free shipping on orders above ₹499.",
    },
    "creative_concept": {
        "image_concept": "Clean product shot on a white or gradient background with the product prominently centered. Use lifestyle imagery if available.",
        "hook": "Start with the product benefit, not the product itself. Lead with the transformation or outcome.",
        "visual_structure": "Product image (top 60%), headline overlay (bottom), brand logo in corner. High contrast text.",
        "text_overlay": "Overlay the price or offer text in bold on the lower third of the image.",
    },
    "campaign_settings": {
        "objective": "OUTCOME_SALES",
        "recommended_daily_budget": 500.0,
        "suggested_duration_days": 14,
        "placement": "Instagram Feed, Stories, Reels",
        "notes": "Start with ₹500/day for 3 days to test creative performance. Scale budget on best-performing ad set.",
    },
    "is_demo": True,
}

DEMO_ANALYSIS = [
    "📊 Your CTR is below the Instagram benchmark of 1.5%. Consider testing a new headline with a stronger value proposition.",
    "💰 Spend is increasing but conversions are flat. Pause low-performing ad sets and reallocate budget to top performers.",
    "🎨 Try a carousel ad format — it typically generates 3x more engagement than single image ads for product campaigns.",
    "🎯 Narrow your audience targeting — try adding interest-based layers (e.g., 'Online Shopping + Fashion') to improve relevance score.",
    "⏰ Your ads perform best between 7 PM–10 PM IST. Consider adjusting your ad schedule to concentrate spend in this window.",
]


def _build_planning_prompt(product: Dict[str, Any], request: Dict[str, Any]) -> str:
    return f"""You are an expert Instagram advertising strategist. Generate a comprehensive, Meta policy-compliant Instagram ad campaign plan.

PRODUCT INFORMATION:
- Name: {product.get('name')}
- URL: {product.get('url', 'Not provided')}
- Description: {product.get('description', 'Not provided')}
- Price: ₹{product.get('price', 'Not specified')}

CAMPAIGN PARAMETERS:
- Target Country: {request.get('target_country')}
- Target Cities: {request.get('target_cities', 'All cities')}
- Daily Budget: ₹{request.get('daily_budget')}
- Campaign Goal: {request.get('campaign_goal')}

Return ONLY a valid JSON object with this exact structure:
{{
  "audience": {{
    "age_min": <integer 18-65>,
    "age_max": <integer 18-65>,
    "location": "<string>",
    "interests": ["<interest1>", "<interest2>", "<interest3>", "<interest4>", "<interest5>"],
    "description": "<2-3 sentence audience description>"
  }},
  "ad_copy": {{
    "primary_text": "<compelling Instagram ad primary text, 125 chars max>",
    "headline": "<punchy headline, 40 chars max>",
    "cta": "<one of: Shop Now, Learn More, Sign Up, Contact Us, Book Now, Get Offer>",
    "description": "<link description, 30 chars max>"
  }},
  "creative_concept": {{
    "image_concept": "<detailed description of ideal image/visual>",
    "hook": "<opening hook strategy>",
    "visual_structure": "<layout and composition description>",
    "text_overlay": "<text overlay suggestion>"
  }},
  "campaign_settings": {{
    "objective": "<one of: OUTCOME_SALES, OUTCOME_LEADS, OUTCOME_TRAFFIC>",
    "recommended_daily_budget": <float>,
    "suggested_duration_days": <integer>,
    "placement": "<Instagram placements>",
    "notes": "<2-3 actionable tips for campaign success>"
  }}
}}

Ensure all recommendations comply with Meta Advertising Policies. Do not suggest prohibited content."""


def _build_analysis_prompt(campaign: Dict[str, Any], metrics: Dict[str, Any]) -> str:
    return f"""You are an Instagram advertising optimization expert. Analyze this campaign performance and provide specific, actionable recommendations.

CAMPAIGN:
- Name: {campaign.get('name')}
- Objective: {campaign.get('objective')}
- Daily Budget: ₹{campaign.get('daily_budget')}
- Status: {campaign.get('status')}

METRICS:
- Impressions: {metrics.get('impressions', 0)}
- Reach: {metrics.get('reach', 0)}
- Clicks: {metrics.get('clicks', 0)}
- CTR: {metrics.get('ctr', 0)}%
- Spend: ₹{metrics.get('spend', 0)}
- Conversions: {metrics.get('conversions', 0)}

Provide 4-6 specific, actionable optimization recommendations. Each recommendation should identify a specific issue and suggest a concrete action.

Return ONLY a JSON array of strings:
["recommendation 1", "recommendation 2", ...]

Each recommendation should be concise (1-2 sentences) and actionable. Use emojis for visual clarity."""


async def generate_campaign_plan(product: Dict[str, Any], request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an AI campaign plan for the given product.
    Falls back to demo response if OpenAI is not configured.
    """
    if not settings.OPENAI_API_KEY:
        logger.info("OpenAI not configured — returning demo campaign plan.")
        plan = DEMO_CAMPAIGN_PLAN.copy()
        plan["audience"]["location"] = request.get("target_country", "India")
        plan["campaign_settings"]["recommended_daily_budget"] = float(request.get("daily_budget", 500))
        return plan

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert Instagram advertising strategist. Always respond with valid JSON only."},
                {"role": "user", "content": _build_planning_prompt(product, request)},
            ],
            temperature=0.7,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        plan = json.loads(content)
        plan["is_demo"] = False
        return plan

    except Exception as e:
        logger.error(f"OpenAI campaign planning failed: {e}")
        # Fallback to demo
        plan = DEMO_CAMPAIGN_PLAN.copy()
        plan["is_demo"] = True
        return plan


async def analyze_campaign_performance(
    campaign: Dict[str, Any], metrics: Dict[str, Any]
) -> list:
    """
    Generate AI optimization suggestions for a campaign.
    Falls back to demo suggestions if OpenAI is not configured.
    """
    if not settings.OPENAI_API_KEY:
        logger.info("OpenAI not configured — returning demo analysis.")
        return DEMO_ANALYSIS

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an Instagram ad optimization expert. Always respond with a valid JSON array of strings."},
                {"role": "user", "content": _build_analysis_prompt(campaign, metrics)},
            ],
            temperature=0.7,
            max_tokens=800,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        data = json.loads(content)
        # Handle both {"suggestions": [...]} and [...] responses
        if isinstance(data, list):
            return data
        return data.get("suggestions", data.get("recommendations", DEMO_ANALYSIS))

    except Exception as e:
        logger.error(f"OpenAI analysis failed: {e}")
        return DEMO_ANALYSIS
