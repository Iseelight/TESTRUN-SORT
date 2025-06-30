#!/usr/bin/env python3

import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_superuser():
    """Create a superuser for testing"""
    db = SessionLocal()
    
    try:
        # Check if superuser already exists
        existing_user = db.query(User).filter(User.email == "admin@recruitai.com").first()
        if existing_user:
            print("Superuser already exists!")
            return
        
        # Create superuser
        superuser = User(
            email="admin@recruitai.com",
            hashed_password=get_password_hash("admin123"),
            name="Admin User",
            role="recruiter",
            company="RecruitAI",
            is_active=True,
            is_verified=True
        )
        
        db.add(superuser)
        db.commit()
        print("Superuser created successfully!")
        print("Email: admin@recruitai.com")
        print("Password: admin123")
        
    except Exception as e:
        print(f"Error creating superuser: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_superuser()