from fastapi import APIRouter
from app.api.v1.endpoints import proofs, akave, inference

router = APIRouter()

router.include_router(proofs.router, prefix="/proofs", tags=["proofs"])
router.include_router(akave.router, prefix="/akave", tags=["akave"])
router.include_router(inference.router, prefix="/inference", tags=["inference"]) 