from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # in seconds
    
    # Analysis results
    final_analysis = Column(JSON, nullable=True)  # {strengths, weaknesses, recommendations}
    sentiment_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    # Foreign keys
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"), nullable=False)
    
    # Relationships
    candidate = relationship("User", back_populates="conversations")
    job = relationship("JobPosting", back_populates="conversations")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")
    candidate_record = relationship("Candidate", back_populates="conversation")

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender = Column(String, nullable=False)  # 'ai' or 'candidate'
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Message analysis
    analysis = Column(JSON, nullable=True)  # {sentiment, confidence, key_points}
    
    # Audio support
    audio_file_path = Column(String, nullable=True)
    audio_duration = Column(Float, nullable=True)
    transcription_confidence = Column(Float, nullable=True)
    
    # Foreign keys
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")