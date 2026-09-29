import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductResponse
from app.core.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/products", tags=["Products"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    name: str = Form(...),
    url: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new product. Supports image upload."""
    image_url = None

    if image and image.filename:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported image type.")

        # Save to uploads directory
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = image.filename.rsplit(".", 1)[-1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)

        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Image exceeds 10MB limit.")

        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)

        image_url = f"/uploads/{filename}"

    product = Product(
        user_id=current_user.id,
        name=name,
        url=url,
        description=description,
        price=price,
        image_url=image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=List[ProductResponse])
def list_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all products for the current user."""
    return db.query(Product).filter(Product.user_id == current_user.id).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific product by ID."""
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a product."""
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted."}
