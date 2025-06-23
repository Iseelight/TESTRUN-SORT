from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from uuid import UUID

from app.models.job import JobPosting
from app.schemas.job import JobPostingCreate, JobPostingUpdate

def create_job(db: Session, *, job_create: JobPostingCreate, recruiter_id: UUID) -> JobPosting:
    expires_at = datetime.utcnow() + timedelta(days=job_create.active_days)
    
    db_job = JobPosting(
        **job_create.dict(),
        recruiter_id=recruiter_id,
        expires_at=expires_at,
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def get_job(db: Session, *, job_id: UUID) -> Optional[JobPosting]:
    return db.query(JobPosting).filter(JobPosting.id == job_id).first()

def get_jobs(db: Session, *, skip: int = 0, limit: int = 100) -> List[JobPosting]:
    return db.query(JobPosting).offset(skip).limit(limit).all()

def get_active_jobs(db: Session, *, skip: int = 0, limit: int = 100) -> List[JobPosting]:
    return db.query(JobPosting).filter(
        JobPosting.status == "active",
        JobPosting.expires_at > datetime.utcnow()
    ).offset(skip).limit(limit).all()

def update_job(db: Session, *, job: JobPosting, job_update: JobPostingUpdate) -> JobPosting:
    update_data = job_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
    
    db.commit()
    db.refresh(job)
    return job

def delete_job(db: Session, *, job_id: UUID) -> None:
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if job:
        db.delete(job)
        db.commit()

def generate_job_description(title: str, requirements: List[str]) -> str:
    """
    Generate AI-powered job description
    This is a mock implementation - in production, integrate with OpenAI or similar
    """
    base_descriptions = {
        "Frontend Developer": """We are seeking a talented Frontend Developer to join our dynamic team. You will be responsible for creating engaging user interfaces and ensuring excellent user experiences across our web applications.

Key Responsibilities:
• Develop responsive web applications using modern frontend technologies
• Collaborate with UX/UI designers to implement pixel-perfect designs
• Optimize applications for maximum speed and scalability
• Write clean, maintainable, and well-documented code
• Participate in code reviews and maintain coding standards

What We Offer:
• Competitive salary and comprehensive benefits package
• Flexible working arrangements and remote work options
• Professional development opportunities and learning budget
• Collaborative and innovative work environment""",

        "Backend Developer": """Join our engineering team as a Backend Developer and help build robust, scalable server-side applications. You'll work on designing and implementing APIs, managing databases, and ensuring our systems can handle high traffic loads.

Key Responsibilities:
• Design and develop RESTful APIs and microservices
• Implement database schemas and optimize query performance
• Ensure application security and data protection
• Write comprehensive tests and maintain code quality
• Collaborate with frontend developers and DevOps teams

What We Offer:
• Competitive compensation with equity options
• Health, dental, and vision insurance
• Flexible PTO and work-life balance
• State-of-the-art development tools and equipment""",

        "Product Manager": """We're looking for an experienced Product Manager to drive product strategy and execution. You'll work closely with engineering, design, and business stakeholders to define product roadmaps and ensure successful launches.

Key Responsibilities:
• Define product vision, strategy, and roadmap
• Conduct market research and competitive analysis
• Gather and prioritize product requirements from stakeholders
• Work with engineering teams to deliver features on time
• Analyze product metrics and user feedback for improvements

What We Offer:
• Competitive salary with performance bonuses
• Comprehensive benefits and wellness programs
• Professional development and conference attendance
• Collaborative culture with cross-functional teams"""
    }
    
    description = base_descriptions.get(title, f"""We are seeking a qualified {title} to join our growing team. This is an excellent opportunity for a motivated professional to contribute to our company's success.

Key Responsibilities:
• Execute core responsibilities related to {title.lower()} role
• Collaborate with cross-functional teams to achieve business objectives
• Contribute to process improvements and best practices
• Maintain high standards of quality and professionalism

What We Offer:
• Competitive compensation package
• Comprehensive benefits including health insurance
• Professional development opportunities
• Flexible work environment""")
    
    if requirements:
        description += f"\n\nRequired Skills and Experience:\n" + "\n".join([f"• {req}" for req in requirements])
    
    return description