from fastapi import APIRouter, HTTPException
from app.models.proof import ProofRequest, ProofResponse
import uuid

router = APIRouter()

@router.post("/request", response_model=ProofResponse)
async def request_proof(request: ProofRequest) -> ProofResponse:
    try:
        # Generate a unique ID for this proof request
        proof_id = str(uuid.uuid4())
        
        # TODO: Implement actual proof generation and storage
        # For now, return a mock response
        return ProofResponse(
            proof_id=proof_id,
            status="pending",
            storage_location=f"akave://{proof_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{proof_id}", response_model=ProofResponse)
async def get_proof(proof_id: str) -> ProofResponse:
    try:
        # TODO: Implement proof retrieval from storage
        return ProofResponse(
            proof_id=proof_id,
            status="completed",
            proof_hash="0x..." # Mock hash
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Proof not found") 