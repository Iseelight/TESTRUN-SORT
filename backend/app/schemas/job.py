from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID

class SkillWeights(BaseModel):
    technical: float
    soft: float
    leadership: float
    communication: float

class JobPostingBase(BaseModel):
    title: str
    company: str
    description: str
    requirements: List[str]
    location: str
    employment_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    skill_weights: SkillWeights
    cutoff_percentage: float
    max_candidates: int
    active_days: int = 30
    enable_waitlist: bool = False
    waitlist_duration: int = 7
    waitlist_message: Optional[str] = None

class JobPostingCreate(JobPostingBase):
    pass

class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skill_weights: Optional[SkillWeights] = None
    cutoff_percentage: Optional[float] = None
    max_candidates: Optional[int] = None
    status: Optional[str] = None
    enable_waitlist: Optional[bool] = None
    waitlist_duration: Optional[int] = None
    waitlist_message: Optional[str] = None

class JobPostingInDB(JobPostingBase):
    id: UUID
    status: str
    selected_candidates: int
    rejected_candidates: int
    total_applications: int
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    recruiter_id: UUID

    class Config:
        from_attributes = True

class JobPosting(JobPostingInDB):
    pass

class JobPostingPublic(BaseModel):
    id: UUID
    title: str
    company: str
    description: str
    requirements: List[str]
    location: str
    employment_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    cutoff_percentage: float
    max_candidates: int
    status: str
    total_applications: int
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True