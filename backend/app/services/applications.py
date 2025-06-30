from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.application import JobApplication
from app.models.job import JobPosting
from app.schemas.application import JobApplicationCreate, JobApplicationUpdate

def create_application(db: Session, *, application_create: JobApplicationCreate, candidate_id: UUID) -> JobApplication:
    db_application = JobApplication(
        **application_create.dict(),
        candidate_id=candidate_id,
    )
    db.add(db_application)
    
    # Update job application count
    job = db.query(JobPosting).filter(JobPosting.id == application_create.job_id).first()
    if job:
        job.total_applications += 1
    
    db.commit()
    db.refresh(db_application)
    return db_application

def get_application(db: Session, *, application_id: UUID) -> Optional[JobApplication]:
    return db.query(JobApplication).filter(JobApplication.id == application_id).first()

def get_applications_by_user(db: Session, *, user_id: UUID, skip: int = 0, limit: int = 100) -> List[JobApplication]:
    return db.query(JobApplication).filter(
        JobApplication.candidate_id == user_id
    ).offset(skip).limit(limit).all()

def get_applications_by_job(
    db: Session, 
    *, 
    job_id: UUID, 
    recruiter_id: UUID,
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None
) -> List[JobApplication]:
    # Verify recruiter owns the job
    job = db.query(JobPosting).filter(
        JobPosting.id == job_id,
        JobPosting.recruiter_id == recruiter_id
    ).first()
    
    if not job:
        return []
    
    query = db.query(JobApplication).filter(JobApplication.job_id == job_id)
    
    if status:
        query = query.filter(JobApplication.status == status)
    
    return query.offset(skip).limit(limit).all()

def update_application(db: Session, *, application: JobApplication, application_update: JobApplicationUpdate) -> JobApplication:
    update_data = application_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    return application