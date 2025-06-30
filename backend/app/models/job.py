from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(JSON, nullable=False)  # List of strings
    location = Column(String, nullable=False)
    employment_type = Column(String, nullable=False)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String, default="USD")
    
    # Assessment configuration
    skill_weights = Column(JSON, nullable=False)  # {technical, soft, leadership, communication}
    cutoff_percentage = Column(Float, nullable=False)
    max_candidates = Column(Integer, nullable=False)
    
    # Timing configuration
    active_days = Column(Integer, nullable=False, default=30)
    expires_at = Column(DateTime, nullable=False)
    
    # Waitlist configuration
    enable_waitlist = Column(Boolean, default=False)
    waitlist_duration = Column(Integer, default=7)  # days
    waitlist_message = Column(Text, nullable=True)
    
    # Status and metrics
    status = Column(String, default="active")  # active, inactive, closed, draft
    selected_candidates = Column(Integer, default=0)
    rejected_candidates = Column(Integer, default=0)
    total_applications = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    recruiter = relationship("User", back_populates="job_postings")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="job", cascade="all, delete-orphan")