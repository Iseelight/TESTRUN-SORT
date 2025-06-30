from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import Token, LoginRequest, GoogleAuthRequest, RefreshTokenRequest
from app.schemas.user import UserCreate, User as UserSchema
from app.services.auth import authenticate_user, create_user, verify_google_token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: LoginRequest
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = authenticate_user(db, email=form_data.email, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserSchema)
def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = create_user(db, user_create=user_in)
    return user

@router.post("/google", response_model=Token)
async def google_auth(
    *,
    db: Session = Depends(get_db),
    google_auth: GoogleAuthRequest,
) -> Any:
    """
    Google OAuth authentication
    """
    try:
        google_user_info = await verify_google_token(google_auth.token)
        
        # Check if user exists
        user = db.query(User).filter(User.email == google_user_info["email"]).first()
        
        if not user:
            # Create new user
            user_create = UserCreate(
                email=google_user_info["email"],
                name=google_user_info["name"],
                role=google_auth.role,
                password="google_oauth"  # Placeholder, won't be used
            )
            user = create_user(db, user_create=user_create)
            user.google_id = google_user_info["sub"]
            user.avatar_url = google_user_info.get("picture")
            user.is_verified = True
            db.commit()
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
        refresh_token = security.create_refresh_token(user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

@router.post("/refresh", response_model=Token)
def refresh_token(
    *,
    db: Session = Depends(get_db),
    refresh_request: RefreshTokenRequest,
) -> Any:
    """
    Refresh access token
    """
    try:
        user_id = security.verify_token(refresh_request.refresh_token)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user",
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
        new_refresh_token = security.create_refresh_token(user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

@router.post("/test-token", response_model=UserSchema)
def test_token(current_user: User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user