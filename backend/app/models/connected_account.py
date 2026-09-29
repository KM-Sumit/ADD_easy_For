from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False, default="instagram")
    platform_account_id = Column(String(255), nullable=True)   # Meta Ad Account ID (act_XXXXX)
    instagram_account_id = Column(String(255), nullable=True)  # Instagram Business Account ID
    encrypted_access_token = Column(String(2048), nullable=False)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="connected_accounts")
    campaigns = relationship("Campaign", back_populates="connected_account")
