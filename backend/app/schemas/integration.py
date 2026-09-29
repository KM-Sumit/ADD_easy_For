from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConnectedAccountResponse(BaseModel):
    id: int
    platform: str
    platform_account_id: Optional[str]
    instagram_account_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SelectAccountRequest(BaseModel):
    platform_account_id: str
    instagram_account_id: Optional[str] = None


class AdAccount(BaseModel):
    id: str
    name: str
    account_status: Optional[int] = None
    currency: Optional[str] = None


class IntegrationStatusResponse(BaseModel):
    connected: bool
    meta_configured: bool
    account: Optional[ConnectedAccountResponse] = None
