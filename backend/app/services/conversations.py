from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID
from fastapi import UploadFile

from app.models.conversation import Conversation, ConversationMessage
from app.schemas.conversation import ConversationCreate, MessageCreate

def create_conversation(db: Session, *, conversation_create: ConversationCreate, candidate_id: UUID) -> Conversation:
    db_conversation = Conversation(
        candidate_id=candidate_id,
        job_id=conversation_create.job_id,
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

def get_conversation(db: Session, *, conversation_id: UUID) -> Optional[Conversation]:
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()

def add_message(db: Session, *, conversation_id: UUID, message_create: MessageCreate) -> ConversationMessage:
    db_message = ConversationMessage(
        conversation_id=conversation_id,
        **message_create.dict(),
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def end_conversation(db: Session, *, conversation_id: UUID) -> Conversation:
    conversation = get_conversation(db=db, conversation_id=conversation_id)
    if not conversation:
        raise ValueError("Conversation not found")
    
    conversation.ended_at = datetime.utcnow()
    if conversation.started_at:
        duration = (conversation.ended_at - conversation.started_at).total_seconds()
        conversation.duration = int(duration)
    
    # Generate final analysis (mock implementation)
    conversation.final_analysis = {
        "strengths": ["Good communication skills", "Technical knowledge"],
        "weaknesses": ["Could improve leadership examples"],
        "recommendations": ["Practice behavioral questions", "Prepare more specific examples"]
    }
    
    db.commit()
    db.refresh(conversation)
    return conversation

def process_audio_message(db: Session, *, conversation_id: UUID, audio_file: UploadFile) -> ConversationMessage:
    """
    Process audio file and convert to text message
    This is a mock implementation - in production, integrate with speech-to-text service
    """
    # Mock transcription
    transcribed_text = "This is a mock transcription of the audio message."
    
    message_create = MessageCreate(
        sender="candidate",
        message=transcribed_text,
        audio_file_path=f"audio/{conversation_id}/{audio_file.filename}",
        audio_duration=30.0,  # Mock duration
        transcription_confidence=0.95
    )
    
    return add_message(db=db, conversation_id=conversation_id, message_create=message_create)