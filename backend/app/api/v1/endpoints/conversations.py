from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.schemas.conversation import Conversation as ConversationSchema, ConversationCreate, MessageCreate, ConversationMessage
from app.services.conversations import create_conversation, add_message, get_conversation, end_conversation, process_audio_message

router = APIRouter()

@router.post("/", response_model=ConversationSchema)
def create_conversation_session(
    *,
    db: Session = Depends(get_db),
    conversation_in: ConversationCreate,
    current_user: User = Depends(deps.get_current_candidate),
) -> Any:
    """
    Create new conversation session
    """
    conversation = create_conversation(
        db=db, 
        conversation_create=conversation_in,
        candidate_id=current_user.id
    )
    return conversation

@router.get("/{conversation_id}", response_model=ConversationSchema)
def read_conversation(
    *,
    db: Session = Depends(get_db),
    conversation_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get conversation by ID
    """
    conversation = get_conversation(db=db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Check permissions
    if current_user.role == "candidate":
        if conversation.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    elif current_user.role == "recruiter":
        if conversation.job.recruiter_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return conversation

@router.post("/{conversation_id}/messages", response_model=ConversationMessage)
def add_message_to_conversation(
    *,
    db: Session = Depends(get_db),
    conversation_id: UUID,
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_candidate),
) -> Any:
    """
    Add message to conversation
    """
    conversation = get_conversation(db=db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    message = add_message(
        db=db, 
        conversation_id=conversation_id, 
        message_create=message_in
    )
    return message

@router.post("/{conversation_id}/audio", response_model=ConversationMessage)
def upload_audio_message(
    *,
    db: Session = Depends(get_db),
    conversation_id: UUID,
    audio_file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_candidate),
) -> Any:
    """
    Upload audio message and convert to text
    """
    conversation = get_conversation(db=db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    message = process_audio_message(
        db=db,
        conversation_id=conversation_id,
        audio_file=audio_file
    )
    return message

@router.post("/{conversation_id}/end")
def end_conversation_session(
    *,
    db: Session = Depends(get_db),
    conversation_id: UUID,
    current_user: User = Depends(deps.get_current_candidate),
) -> Any:
    """
    End conversation and generate final analysis
    """
    conversation = get_conversation(db=db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    conversation = end_conversation(db=db, conversation_id=conversation_id)
    return {"message": "Conversation ended", "conversation": conversation}