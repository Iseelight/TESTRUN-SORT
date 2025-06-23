#!/usr/bin/env python3

import asyncio
from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base
from app.models import *  # Import all models

def init_db():
    """Initialize database with tables"""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db()