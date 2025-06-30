from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=False)
    
    # CV/Resume
    cv_filename = Column(String, nullable=True)
    cv_file_path = Column(String, nullable=True)
    cv_file_size = Column(Integer, nullable=True)
    
    # Assessment scores
    scores = Column(JSON, nullable=False)  # {overall, technical, soft, leadership, communication}
    
    # Status tracking
    status = Column(String, default="pending")  # pending, interviewing, completed, selected, rejected, waitlisted
    applied_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Feedback and results
    feedback = Column(JSON, nullable=True)  # {strengths, weaknesses, recommendations, overall_assessment, rejection_reason, interview_details}
    
    # Assessment metadata
    assessment_duration = Column(Integer, nullable=True)  # in seconds
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True)
    
    # Foreign keys
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # If registered user
    
    # Relationships
    job = relationship("JobPosting")
    user = relationship("User")
    conversation = relationship("Conversation", back_populates="candidate_record")