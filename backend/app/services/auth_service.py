import hashlib
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config.settings import settings
from app.domain.database import get_db
from app.domain.repositories.user_repository import user_repo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=15)
    
    to_encode.update({"iat": int(now.timestamp()), "exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

PASSWORD_RESET_PURPOSE = "pwd_reset"


def _password_fingerprint(hashed_password: str) -> str:
    """Short digest of the current hash: a reset token stops working once the password changes."""
    return hashlib.sha256(hashed_password.encode("utf-8")).hexdigest()[:16]


def create_password_reset_token(email: str, hashed_password: str) -> str:
    """Single-use, short-lived token that can only be used to reset the password."""
    return create_access_token(
        data={
            "sub": email,
            "purpose": PASSWORD_RESET_PURPOSE,
            "pwf": _password_fingerprint(hashed_password),
        },
        expires_delta=timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
    )


def verify_password_reset_token(db: Session, token: str):
    """Returns the user the token belongs to, or None when invalid, expired or already used."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    if payload.get("purpose") != PASSWORD_RESET_PURPOSE:
        return None
    user = user_repo.get_by_email(db, email=payload.get("sub") or "")
    if user is None or not user.is_active:
        return None
    if payload.get("pwf") != _password_fingerprint(user.hashed_password):
        return None
    return user


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        # Password-reset tokens must never authenticate API calls
        if email is None or payload.get("purpose"):
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = user_repo.get_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
