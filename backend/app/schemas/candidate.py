from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List
from datetime import datetime
from uuid import UUID

class Scores(BaseModel):
    overall: float
    technical: float
    soft: float
    leadership: float
    communication: float

class InterviewDetails(BaseModel):
    date: str
    time: str
    location: str
    interviewer: str
    instructions: str

class Feedback(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    overall_assessment: str
    rejection_reason: Optional[str] = None
    interview_details: Optional[InterviewDetails] = None

class CandidateBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    location: str

class CandidateCreate(CandidateBase):
    job_id: UUID
    scores: Scores

class CandidateUpdate(BaseModel):
    status: Optional[str] = None
    scores: Optional[Scores] = None
    feedback: Optional[Feedback] = None
    completed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

class CandidateInDB(CandidateBase):
    id: UUID
    scores: Scores
    status: str
    applied_at: datetime
    completed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    feedback: Optional[Feedback] = None
    cv_filename: Optional[str] = None
    assessment_duration: Optional[int] = None
    job_id: UUID
    user_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class Candidate(CandidateInDB):
    pass