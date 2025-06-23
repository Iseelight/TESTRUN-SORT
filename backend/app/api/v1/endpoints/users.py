from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate, UserProfile
from app.services.users import update_user, get_user_profile

router = APIRouter()

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own user.
    """
    user = update_user(db=db, user=current_user, user_update=user_in)
    return user

@router.get("/profile/{user_id}", response_model=UserProfile)
def read_user_profile(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get user profile by ID (public info only).
    """
    profile = get_user_profile(db=db, user_id=user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile