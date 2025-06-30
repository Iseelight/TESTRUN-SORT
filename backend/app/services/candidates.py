from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID

from app.models.candidate import Candidate
from app.models.job import JobPosting
from app.schemas.candidate import CandidateCreate, CandidateUpdate

def create_candidate(db: Session, *, candidate_create: CandidateCreate, user_id: UUID) -> Candidate:
    db_candidate = Candidate(
        **candidate_create.dict(),
        user_id=user_id,
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

def get_candidate(db: Session, *, candidate_id: UUID) -> Optional[Candidate]:
    return db.query(Candidate).filter(Candidate.id == candidate_id).first()

def get_candidates_by_job(
    db: Session, 
    *, 
    job_id: UUID, 
    recruiter_id: UUID,
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    min_score: float = 0
) -> List[Candidate]:
    # Verify recruiter owns the job
    job = db.query(JobPosting).filter(
        JobPosting.id == job_id,
        JobPosting.recruiter_id == recruiter_id
    ).first()
    
    if not job:
        return []
    
    query = db.query(Candidate).filter(Candidate.job_id == job_id)
    
    if status:
        query = query.filter(Candidate.status == status)
    
    if min_score > 0:
        query = query.filter(Candidate.scores["overall"].astext.cast(db.Float) >= min_score)
    
    return query.offset(skip).limit(limit).all()

def update_candidate(db: Session, *, candidate: Candidate, candidate_update: CandidateUpdate) -> Candidate:
    update_data = candidate_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(candidate, field, value)
    
    db.commit()
    db.refresh(candidate)
    return candidate

def select_candidate(db: Session, *, candidate_id: UUID, recruiter_id: UUID) -> Candidate:
    candidate = get_candidate(db=db, candidate_id=candidate_id)
    if not candidate:
        raise ValueError("Candidate not found")
    
    # Verify recruiter owns the job
    job = db.query(JobPosting).filter(
        JobPosting.id == candidate.job_id,
        JobPosting.recruiter_id == recruiter_id
    ).first()
    
    if not job:
        raise ValueError("Not authorized")
    
    candidate.status = "selected"
    candidate.reviewed_at = datetime.utcnow()
    
    # Update job metrics
    job.selected_candidates += 1
    
    db.commit()
    db.refresh(candidate)
    return candidate

def reject_candidate(db: Session, *, candidate_id: UUID, recruiter_id: UUID, reason: Optional[str] = None) -> Candidate:
    candidate = get_candidate(db=db, candidate_id=candidate_id)
    if not candidate:
        raise ValueError("Candidate not found")
    
    # Verify recruiter owns the job
    job = db.query(JobPosting).filter(
        JobPosting.id == candidate.job_id,
        JobPosting.recruiter_id == recruiter_id
    ).first()
    
    if not job:
        raise ValueError("Not authorized")
    
    candidate.status = "rejected"
    candidate.reviewed_at = datetime.utcnow()
    
    if reason and candidate.feedback:
        feedback = candidate.feedback.copy()
        feedback["rejection_reason"] = reason
        candidate.feedback = feedback
    
    # Update job metrics
    job.rejected_candidates += 1
    
    db.commit()
    db.refresh(candidate)
    return candidate