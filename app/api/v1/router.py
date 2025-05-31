from fastapi import APIRouter
from app.api.v1.endpoints import proofs

router = APIRouter()

router.include_router(proofs.router, prefix="/proofs", tags=["proofs"]) 