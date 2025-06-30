from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class JobApplicationBase(BaseModel):
    job_id: UUID
    candidate_id: UUID

class JobApplicationCreate(JobApplicationBase):
    source: Optional[str] = None
    referrer: Optional[str] = None

class JobApplicationUpdate(BaseModel):
    status: Optional[str] = None
    completed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

class JobApplicationInDB(JobApplicationBase):
    id: UUID
    status: str
    applied_at: datetime
    completed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    source: Optional[str] = None
    referrer: Optional[str] = None

    class Config:
        from_attributes = True

class JobApplication(JobApplicationInDB):
    pass