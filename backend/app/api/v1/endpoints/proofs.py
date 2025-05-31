from fastapi import APIRouter, HTTPException, Body, Query
from app.models.proof import ProofRequest, ProofResponse
from app.services.akave import AkaveService
from typing import List, Optional
import uuid

router = APIRouter()
akave = AkaveService()

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

@router.get("/", response_model=List[dict])
async def list_proofs(model_id: Optional[str] = Query(None)):
    """List all proofs in the Akave bucket, optionally filtered by model_id."""
    result = await akave.list_proofs(model_id=model_id)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    contents = result["response"].get("Contents", [])
    proofs = []
    for obj in contents:
        key = obj["Key"]
        if key.endswith(".pf"):
            parts = key.split("/")
            if len(parts) >= 3:
                model_id_from_key = parts[1]
                proof_id = parts[2].replace(".pf", "")
            else:
                model_id_from_key = None
                proof_id = key.replace("proofs/", "").replace(".pf", "")
            proofs.append({
                "proof_id": proof_id,
                "timestamp": obj.get("LastModified"),
                "model_id": model_id_from_key
            })
    return proofs

@router.get("/{model_id}/{proof_id}")
async def get_proof_details(model_id: str, proof_id: str):
    """Get details for a specific proof."""
    result = await akave.download_proof(model_id, proof_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Proof not found")
    return {
        "proof_id": proof_id,
        "model_id": model_id,
        "timestamp": None,      # TODO: parse from metadata if available
        "proof_url": None,      # TODO: add signed URL if needed
        "metadata": result.get("metadata", {})
    }

@router.post("/{model_id}/{proof_id}/verify")
async def verify_proof(model_id: str, proof_id: str):
    """Verify a proof by fetching the proof, verification key, and settings from Akave."""
    proof_result = await akave.download_proof(model_id, proof_id)
    vk_result = await akave.download_verification_key(model_id)
    settings_result = await akave.download_model_settings(model_id)
    if "error" in proof_result or "error" in vk_result or "error" in settings_result:
        raise HTTPException(status_code=404, detail="Required file not found in Akave")
    # TODO: Run actual verification logic here
    return {
        "proof_id": proof_id,
        "model_id": model_id,
        "verified": True, # Stub
        "details": "Proof is valid (stub)"
    } 