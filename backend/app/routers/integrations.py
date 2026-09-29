import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.connected_account import ConnectedAccount
from app.models.user import User
from app.schemas.integration import (
    ConnectedAccountResponse,
    IntegrationStatusResponse,
    SelectAccountRequest,
    AdAccount,
)
from app.core.auth import get_current_user
from app.services import meta_service
from app.services.encryption import encrypt_token, decrypt_token
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations/instagram", tags=["Instagram Integration"])


@router.get("/status", response_model=IntegrationStatusResponse)
def get_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the Instagram integration status for the current user."""
    account = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == current_user.id)
        .first()
    )
    return IntegrationStatusResponse(
        connected=account is not None,
        meta_configured=meta_service.is_configured(),
        account=account,
    )


@router.get("/connect")
def connect_instagram(current_user: User = Depends(get_current_user)):
    """
    Generate and return the Meta OAuth authorization URL.
    The frontend redirects the user's browser to this URL.
    """
    if not meta_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Instagram integration is not configured. Please set META_APP_ID and META_APP_SECRET in the backend .env file.",
        )
    oauth_url = meta_service.generate_oauth_url(current_user.id)
    return {"oauth_url": oauth_url}


@router.get("/callback")
async def instagram_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Handle Meta OAuth callback.
    Validates state, exchanges code for token, fetches ad accounts,
    then redirects frontend to the account selection page.
    SECURITY: Access token is NEVER returned to browser; only encrypted DB storage.
    """
    user_id = meta_service.validate_and_consume_state(state)
    if user_id is None:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/connect?error=invalid_state"
        )

    try:
        token_data = await meta_service.exchange_code_for_token(code)
        short_token = token_data.get("access_token")
        if not short_token:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/connect?error=token_exchange_failed"
            )

        # Exchange for long-lived token (60 days)
        try:
            long_token_data = await meta_service.get_long_lived_token(short_token)
            access_token = long_token_data.get("access_token", short_token)
            expires_in = long_token_data.get("expires_in")
            expires_at = None
            if expires_in:
                from datetime import timedelta
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
        except Exception:
            access_token = short_token
            expires_at = None

        # Encrypt and temporarily store token + user_id in a pending record
        encrypted = encrypt_token(access_token)

        # Check if already connected; update or create
        account = (
            db.query(ConnectedAccount)
            .filter(ConnectedAccount.user_id == user_id)
            .first()
        )
        if account:
            account.encrypted_access_token = encrypted
            account.token_expires_at = expires_at
            account.updated_at = datetime.now(timezone.utc)
        else:
            account = ConnectedAccount(
                user_id=user_id,
                platform="instagram",
                encrypted_access_token=encrypted,
                token_expires_at=expires_at,
            )
            db.add(account)

        db.commit()

        # Redirect to frontend with account selection step
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/connect?step=select_account"
        )

    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/connect?error=callback_failed"
        )


@router.get("/ad-accounts", response_model=List[AdAccount])
async def list_ad_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the list of Meta ad accounts the user has access to."""
    account = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="No connected account found.")

    token = decrypt_token(account.encrypted_access_token)
    try:
        ad_accounts = await meta_service.get_ad_accounts(token)
        return [
            AdAccount(
                id=a.get("id", ""),
                name=a.get("name", "Unknown"),
                account_status=a.get("account_status"),
                currency=a.get("currency"),
            )
            for a in ad_accounts
        ]
    except Exception as e:
        logger.error(f"Failed to fetch ad accounts: {e}")
        raise HTTPException(status_code=502, detail="Failed to retrieve ad accounts from Meta.")


@router.post("/select-account", response_model=ConnectedAccountResponse)
def select_account(
    payload: SelectAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save the selected ad account to the connected account record."""
    account = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="No connected account found.")

    account.platform_account_id = payload.platform_account_id
    account.instagram_account_id = payload.instagram_account_id
    account.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(account)
    return account


@router.get("/account", response_model=ConnectedAccountResponse)
def get_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get connected account details."""
    account = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="No connected account.")
    return account


@router.delete("/disconnect")
def disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove the Meta connection for the current user."""
    account = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == current_user.id)
        .first()
    )
    if account:
        db.delete(account)
        db.commit()
    return {"message": "Instagram account disconnected."}
