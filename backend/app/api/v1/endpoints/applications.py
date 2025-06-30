from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.schemas.application import JobApplication as ApplicationSchema, JobApplicationCreate, JobApplicationUpdate
from app.services.applications import create_application, get_application, get_applications_by_user, get_applications_by_job, update_application

router = APIRouter()

@router.post("/", response_model=ApplicationSchema)
def create_job_application(
    *,
    db: Session = Depends(get_db),
    application_in: JobApplicationCreate,
    current_user: User = Depends(deps.get_current_candidate),
) -> Any:
    """
    Create new job application
    """
    application = create_application(
        db=db, 
        application_create=application_in,
        candidate_id=current_user.id
    )
    return application

@router.get("/my-applications", response_model=List[ApplicationSchema])
def read_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_candidate),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve applications by current candidate
    """
    applications = get_applications_by_user(
        db=db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return applications

@router.get("/job/{job_id}", response_model=List[ApplicationSchema])
def read_applications_by_job(
    *,
    db: Session = Depends(get_db),
    job_id: UUID,
    current_user: User = Depends(deps.get_current_recruiter),
    skip: int = 0,
    limit: int = 100,
    status: str = Query(None, description="Filter by status"),
) -> Any:
    """
    Retrieve applications for a specific job (recruiter only)
    """
    applications = get_applications_by_job(
        db=db, 
        job_id=job_id, 
        recruiter_id=current_user.id,
        skip=skip, 
        limit=limit,
        status=status
    )
    return applications

@router.get("/{application_id}", response_model=ApplicationSchema)
def read_application(
    *,
    db: Session = Depends(get_db),
    application_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get application by ID
    """
    application = get_application(db=db, application_id=application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check permissions
    if current_user.role == "candidate":
        if application.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    elif current_user.role == "recruiter":
        if application.job.recruiter_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return application

@router.put("/{application_id}", response_model=ApplicationSchema)
def update_job_application(
    *,
    db: Session = Depends(get_db),
    application_id: UUID,
    application_in: JobApplicationUpdate,
    current_user: User = Depends(deps.get_current_recruiter),
) -> Any:
    """
    Update job application (recruiter only)
    """
    application = get_application(db=db, application_id=application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    application = update_application(
        db=db, 
        application=application, 
        application_update=application_in
    )
    return application