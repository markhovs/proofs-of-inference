from fastapi import APIRouter
from app.api.v1.endpoints import proofs, akave, model

router = APIRouter()

router.include_router(proofs.router, prefix="/proofs", tags=["proofs"])
router.include_router(akave.router, prefix="/akave", tags=["akave"])
router.include_router(model.router, prefix="/model", tags=["model"]) 