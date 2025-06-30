from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(String, default="pending")  # pending, completed, selected, rejected, waitlisted
    applied_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Application metadata
    source = Column(String, nullable=True)  # 'direct', 'social_media', 'referral'
    referrer = Column(String, nullable=True)
    
    # Foreign keys
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    job = relationship("JobPosting", back_populates="applications")
    candidate = relationship("User", back_populates="applications")