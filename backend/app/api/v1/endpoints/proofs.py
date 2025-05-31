from fastapi import APIRouter, HTTPException, Query
from app.services.shared import akave_service as akave, ezkl_service
from typing import List, Optional
import uuid

router = APIRouter()

@router.post("/generate")
async def generate_proof_for_latest():
    """
    Generate a ZK proof for the most recent prediction.
    This endpoint should be called after model inference when the user wants to verify the results.
    """
    try:
        # Generate proof for the latest prediction
        result = await ezkl_service.generate_proof_for_latest_prediction()
        
        # Generate proof ID and store in Akave
        proof_id = str(uuid.uuid4())
        upload_result = await akave.upload_proof(
            result["model_id"], 
            proof_id, 
            result["proof_data"].encode('utf-8')  # Convert string to bytes
        )
        
        if "error" in upload_result:
            raise HTTPException(status_code=500, detail=f"Failed to store proof: {upload_result['error']}")
        
        return {
            "proof_id": proof_id,
            "model_id": result["model_id"],
            "key": upload_result["key"],
            "etag": upload_result.get("etag"),
            "checksum_sha256": upload_result.get("checksum_sha256"),
            "checksum_crc32": upload_result.get("checksum_crc32"),
            "checksum_type": upload_result.get("checksum_type"),
            "bucket": upload_result["bucket"],
            "message": "ZK proof generated and stored successfully in Akave"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proof generation failed: {str(e)}")

@router.get("/", response_model=List[dict])
async def list_proofs(model_id: Optional[str] = Query(None)):
    """List all proofs in the Akave bucket, optionally filtered by model_id."""
    result = await akave.list_proofs(model_id=model_id)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    contents = result["response"].get("Contents", [])
    # Filter for proof files and return raw objects from Akave
    proofs = [obj for obj in contents if obj.get("Key", "").endswith(".json")]
    return proofs

@router.get("/{model_id}/{proof_id}")
async def get_proof_details(model_id: str, proof_id: str):
    """Get details for a specific proof."""
    result = await akave.download_proof(model_id, proof_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Proof not found")
    # Return the full Akave response which includes comprehensive metadata
    return result

@router.post("/{model_id}/{proof_id}/verify")
async def verify_proof(model_id: str, proof_id: str):
    """Verify a ZK proof by fetching the proof from Akave and using ezkl verification."""
    try:
        # Download proof from Akave
        proof_result = await akave.download_proof(model_id, proof_id)
        if "error" in proof_result:
            raise HTTPException(status_code=404, detail="Proof not found in Akave")
        
        # Use ezkl service for verification
        verification_result = await ezkl_service.verify_proof(
            proof_result["data"], 
            model_id
        )
        
        return {
            "proof_id": proof_id,
            "model_id": model_id,
            "verified": verification_result["verified"],
            "proof_valid": verification_result.get("proof_valid", False),
            "details": "ZK proof verification completed using ezkl",
            "error": verification_result.get("error")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}") 