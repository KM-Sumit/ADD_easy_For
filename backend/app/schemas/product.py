from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductCreate(BaseModel):
    name: str
    url: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    user_id: int
    name: str
    url: Optional[str]
    description: Optional[str]
    price: Optional[float]
    image_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
