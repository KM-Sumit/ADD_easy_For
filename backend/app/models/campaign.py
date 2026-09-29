from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    connected_account_id = Column(Integer, ForeignKey("connected_accounts.id", ondelete="SET NULL"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    platform = Column(String(50), nullable=False, default="instagram")
    external_campaign_id = Column(String(255), nullable=True)
    external_adset_id = Column(String(255), nullable=True)
    external_ad_id = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    objective = Column(String(100), nullable=True)
    daily_budget = Column(Float, nullable=True)
    status = Column(String(50), default="DRAFT")
    ai_plan = Column(String(4096), nullable=True)  # JSON string of AI plan
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="campaigns")
    connected_account = relationship("ConnectedAccount", back_populates="campaigns")
    product = relationship("Product", back_populates="campaigns")
    metrics = relationship("CampaignMetrics", back_populates="campaign", cascade="all, delete-orphan")
