from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.domain.database import get_db
from app.domain.repositories.user_repository import user_repo
import logging

from app.services.auth_service import (
    verify_password,
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
    get_password_hash,
)
from app.config.settings import settings
from app.dto.auth import (
    Token,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    MessageResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends(),
    remember_me: bool = Form(False)
):
    """OAuth2 compatible token login, get an access token for future requests"""
    user = user_repo.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
        
    if remember_me:
        access_token_expires = timedelta(days=30)
    else:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    role_val = (
        user.role.name
        if getattr(user, "role", None) and getattr(user.role, "name", None)
        else ("brand_manager" if user.role_id == 2 else "customer")
    )
    access_token = create_access_token(
        data={"sub": user.email, "role": role_val}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


FORGOT_PASSWORD_MESSAGE = (
    "Si el correo está registrado, vas a recibir instrucciones para restablecer tu contraseña."
)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Starts a password recovery. The answer is identical whether or not the e-mail exists
    (prevents account enumeration)."""
    user = user_repo.get_by_email(db, email=payload.email)
    reset_url = None
    if user and user.is_active:
        token = create_password_reset_token(user.email, user.hashed_password)
        link = f"{settings.FRONTEND_URL.rstrip('/')}/recuperar?token={token}"
        logger.info("Password reset requested for %s", user.email)
        if settings.ENVIRONMENT.lower() != "production":
            # No e-mail provider yet: outside production the link is returned for testing.
            reset_url = link
    return {"message": FORGOT_PASSWORD_MESSAGE, "reset_url": reset_url}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Sets a new password using a valid, unused recovery token."""
    user = verify_password_reset_token(db, payload.token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de recuperación es inválido o ya expiró.",
        )
    user.hashed_password = get_password_hash(payload.new_password)
    db.add(user)
    db.commit()
    return {"message": "Contraseña actualizada. Ya podés iniciar sesión."}
