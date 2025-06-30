from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.schemas.job import JobPosting as JobSchema, JobPostingCreate, JobPostingUpdate, JobPostingPublic
from app.services.jobs import create_job, update_job, get_job, get_jobs, delete_job, get_active_jobs, generate_job_description

router = APIRouter()

@router.get("/", response_model=List[JobPostingPublic])
def read_jobs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    active_only: bool = Query(True, description="Only return active jobs"),
) -> Any:
    """
    Retrieve jobs (public endpoint for candidates)
    """
    if active_only:
        jobs = get_active_jobs(db, skip=skip, limit=limit)
    else:
        jobs = get_jobs(db, skip=skip, limit=limit)
    return jobs

@router.get("/my-jobs", response_model=List[JobSchema])
def read_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_recruiter),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve jobs created by current recruiter
    """
    jobs = db.query(JobPosting).filter(
        JobPosting.recruiter_id == current_user.id
    ).offset(skip).limit(limit).all()
    return jobs

@router.post("/", response_model=JobSchema)
def create_job_posting(
    *,
    db: Session = Depends(get_db),
    job_in: JobPostingCreate,
    current_user: User = Depends(deps.get_current_recruiter),
) -> Any:
    """
    Create new job posting
    """
    job = create_job(db=db, job_create=job_in, recruiter_id=current_user.id)
    return job

@router.get("/{job_id}", response_model=JobPostingPublic)
def read_job(
    *,
    db: Session = Depends(get_db),
    job_id: UUID,
) -> Any:
    """
    Get job by ID (public endpoint)
    """
    job = get_job(db=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}", response_model=JobSchema)
def update_job_posting(
    *,
    db: Session = Depends(get_db),
    job_id: UUID,
    job_in: JobPostingUpdate,
    current_user: User = Depends(deps.get_current_recruiter),
) -> Any:
    """
    Update job posting
    """
    job = get_job(db=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    job = update_job(db=db, job=job, job_update=job_in)
    return job

@router.delete("/{job_id}")
def delete_job_posting(
    *,
    db: Session = Depends(get_db),
    job_id: UUID,
    current_user: User = Depends(deps.get_current_recruiter),
) -> Any:
    """
    Delete job posting
    """
    job = get_job(db=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    delete_job(db=db, job_id=job_id)
    return {"message": "Job deleted successfully"}

@router.post("/generate-description")
def generate_description(
    *,
    db: Session = Depends(get_db),
    title: str,
    requirements: List[str] = [],
    current_user: User = Depends(deps.get_current_recruiter),
) -> Any:
    """
    Generate AI-powered job description
    """
    description = generate_job_description(title=title, requirements=requirements)
    return {"description": description}

@router.get("/{job_id}/share-link")
def get_share_link(
    *,
    job_id: UUID,
    current_user: User = Depends(deps.get_current_recruiter),
) -> Any:
    """
    Get shareable link for job posting
    """
    # In production, this would use the actual domain
    base_url = "https://recruitai.com"
    share_link = f"{base_url}/jobs/{job_id}"
    return {"share_link": share_link}