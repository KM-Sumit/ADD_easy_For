"""
Fernet symmetric encryption for storing OAuth access tokens at rest.
The encryption key is derived from the application SECRET_KEY.
Tokens are NEVER stored in plaintext or returned to the frontend.
"""

import base64
import hashlib
from cryptography.fernet import Fernet
from app.config import settings


def _get_fernet() -> Fernet:
    """Derive a Fernet-compatible 32-byte key from SECRET_KEY."""
    raw_key = settings.SECRET_KEY.encode("utf-8")
    # SHA-256 produces exactly 32 bytes, valid for Fernet after base64url encoding
    key_bytes = hashlib.sha256(raw_key).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_token(plaintext_token: str) -> str:
    """Encrypt a token string. Returns a base64 ciphertext string."""
    f = _get_fernet()
    return f.encrypt(plaintext_token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt an encrypted token string. Returns plaintext."""
    f = _get_fernet()
    return f.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
