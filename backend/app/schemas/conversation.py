from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID

class MessageAnalysis(BaseModel):
    sentiment: float
    confidence: float
    key_points: List[str]

class ConversationMessageBase(BaseModel):
    sender: str  # 'ai' or 'candidate'
    message: str

class MessageCreate(ConversationMessageBase):
    analysis: Optional[MessageAnalysis] = None
    audio_file_path: Optional[str] = None
    audio_duration: Optional[float] = None
    transcription_confidence: Optional[float] = None

class ConversationMessage(ConversationMessageBase):
    id: UUID
    timestamp: datetime
    analysis: Optional[MessageAnalysis] = None
    audio_file_path: Optional[str] = None
    audio_duration: Optional[float] = None
    transcription_confidence: Optional[float] = None

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    candidate_id: UUID
    job_id: UUID

class ConversationCreate(ConversationBase):
    pass

class ConversationInDB(ConversationBase):
    id: UUID
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None
    final_analysis: Optional[Dict] = None
    sentiment_score: Optional[float] = None
    confidence_score: Optional[float] = None

    class Config:
        from_attributes = True

class Conversation(ConversationInDB):
    messages: List[ConversationMessage] = []