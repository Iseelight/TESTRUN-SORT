from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.schemas.candidate import Candidate as CandidateSchema, CandidateCreate, CandidateUpdate
from app.services.candidates import create_candidate, update_candidate, get_candidate, get_candidates_by_job, select_candidate, reject_candidate

router = APIRouter()

@router.post("/", response_model=CandidateSchema)
def create_candidate_application(
    *,
    db: Session = Depends(get_db),
    candidate_in: CandidateCreate,
    current_user: User = Depends(deps.get_current_candidate),
) -> Any:
    """
    Create new candidate application
    """
    candidate = create_candidate(
        db=db, 
        candidate_create=candidate_in, 
        user_id=current_user.id
    )
    return candidate

@router.get("/job/{job_id}", response_model=List[CandidateSchema])
def read_candidates_by_job(
    *,
    db: Session = Depends(get_db),
    job_id: UUID,
    current_user: User = Depends(deps.get_current_recruiter),
    skip: int = 0,
    limit: int = 100,
    status: str = Query(None, description="Filter by status"),
    min_score: float = Query(0, description="Minimum overall score"),
) -> Any:
    """
    Retrieve candidates for a specific job (recruiter only)
    """
    candidates = get_candidates_by_job(
        db=db, 
        job_id=job_id, 
        recruiter_id=current_user.id,
        skip=skip, 
        limit=limit,
        status=status,
        min_score=min_score
    )
    return candidates

@router.get("/{candidate_id}", response_model=CandidateSchema)
def read_candidate(
    *,
    db: Session = Depends(get_db),
    candidate_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get candidate by ID
    """
    candidate = get_candidate(db=db, candidate_id=candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Check permissions
    if current_user.role == "recruiter":
        # Recruiter can only see candidates for their jobs
        if candidate.job.recruiter_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    elif current_user.role == "candidate":
        # Candidate can only see their own application
        if candidate.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return candidate

@router.put("/{candidate_id}", response_model=CandidateSchema)
def update_candidate_application(
    *,
    db: Session = Depends(get_db),
    candidate_id: UUID,
    candidate_in: CandidateUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update candidate application
    """
    candidate = get_candidate(db=db, candidate_id=candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Check permissions
    if current_user.role == "recruiter":
        if candidate.job.recruiter_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    elif current_user.role == "candidate":
        if candidate.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    candidate = update_candidate(db=db, candidate=candidate, candidate_update=candidate_in)
    return candidate

@router.post("/{candidate_id}/select")
def select_candidate_for_interview(
    *,
    db: Session = Depends(get_db),
    candidate_id: UUID,
    current_user: User = Depends(deps.get_current_recruiter),
) -> Any:
    """
    Select candidate for interview
    """
    candidate = select_candidate(
        db=db, 
        candidate_id=candidate_id, 
        recruiter_id=current_user.id
    )
    return {"message": "Candidate selected successfully", "candidate": candidate}

@router.post("/{candidate_id}/reject")
def reject_candidate_application(
    *,
    db: Session = Depends(get_db),
    candidate_id: UUID,
    reason: str = None,
    current_user: User = Depends(deps.get_current_recruiter),
) -> Any:
    """
    Reject candidate application
    """
    candidate = reject_candidate(
        db=db, 
        candidate_id=candidate_id, 
        recruiter_id=current_user.id,
        reason=reason
    )
    return {"message": "Candidate rejected", "candidate": candidate}

@router.post("/{candidate_id}/upload-cv")
def upload_cv(
    *,
    db: Session = Depends(get_db),
    candidate_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_candidate),
) -> Any:
    """
    Upload CV file for candidate
    """
    candidate = get_candidate(db=db, candidate_id=candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if candidate.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # TODO: Implement file upload logic
    # Save file, update candidate record with file path
    
    return {"message": "CV uploaded successfully"}