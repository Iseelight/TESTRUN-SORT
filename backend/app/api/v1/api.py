from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, jobs, candidates, conversations, applications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["candidates"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])