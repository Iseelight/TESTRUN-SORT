from typing import Optional
from sqlalchemy.orm import Session
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate
import hashlib

def authenticate_user(db: Session, *, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(db: Session, *, user_create: UserCreate) -> User:
    hashed_password = get_password_hash(user_create.password)
    db_user = User(
        email=user_create.email,
        hashed_password=hashed_password,
        name=user_create.name,
        role=user_create.role,
        company=user_create.company,
        phone=user_create.phone,
        location=user_create.location,
        bio=user_create.bio,
        is_active=True,
        is_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

async def verify_google_token(token: str) -> dict:
    """
    Verify Google OAuth token and return user info
    """
    # Handle mock tokens for development
    if token.startswith('mock_google_token_'):
        # Generate unique values based on the token to prevent database conflicts
        token_hash = hashlib.md5(token.encode()).hexdigest()[:8]
        unique_id = f"mock_user_id_{token_hash}"
        unique_email = f"test_{token_hash}@example.com"
        
        return {
            "email": unique_email,
            "name": f"Test User {token_hash}",
            "sub": unique_id,
            "picture": "https://via.placeholder.com/150"
        }
    
    # For real Google tokens, you would use httpx to verify with Google
    # For now, we'll create a mock response for development
    token_hash = hashlib.md5(token.encode()).hexdigest()[:8]
    return {
        "email": f"user_{token_hash}@gmail.com",
        "name": f"Google User {token_hash}",
        "sub": f"google_user_{token_hash}",
        "picture": "https://via.placeholder.com/150"
    }