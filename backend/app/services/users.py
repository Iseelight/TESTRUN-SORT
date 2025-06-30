from typing import Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.user import User
from app.schemas.user import UserUpdate, UserProfile

def update_user(db: Session, *, user: User, user_update: UserUpdate) -> User:
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

def get_user_profile(db: Session, *, user_id: str) -> Optional[UserProfile]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    return UserProfile(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        company=user.company,
        avatar_url=user.avatar_url,
        location=user.location,
        bio=user.bio,
        created_at=user.created_at
    )