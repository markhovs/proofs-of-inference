from fastapi import APIRouter, HTTPException, Body, Query
from app.models.proof import ProofRequest, ProofResponse
from app.services.akave import AkaveService
from app.services.shared import ezkl_service  # Use shared instance
from typing import List, Optional
import uuid

router = APIRouter()
akave = AkaveService()

@router.post("/request")
async def request_proof(request: ProofRequest):
    try:
        # Generate proof for the latest prediction
        proof_result = await ezkl_service.generate_proof_for_latest_prediction()
        
        # Generate a unique ID for this proof
        proof_id = str(uuid.uuid4())
        
        # Upload proof to Akave storage
        model_id = proof_result["model_id"]
        proof_data = proof_result["proof_data"]
        
        upload_result = await akave.upload_proof(
            model_id=model_id,
            proof_id=proof_id,
            proof_data=proof_data
        )
        
        if "error" in upload_result:
            raise HTTPException(status_code=500, detail=f"Failed to upload proof: {upload_result['error']}")
        
        # Return data in the format the frontend expects
        return {
            "proof_id": proof_id,
            "model_id": model_id,
            "key": upload_result.get("key"),
            "etag": upload_result.get("etag"),
            "checksum_sha256": upload_result.get("checksum_sha256"),
            "checksum_crc32": upload_result.get("checksum_crc32"),
            "checksum_type": upload_result.get("checksum_type"),
            "bucket": upload_result.get("bucket"),
            "message": "Proof generated and uploaded successfully"
        }
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
        # Filter for proof files (.json extension)
        if key.startswith("proofs/") and key.endswith(".json"):
            proofs.append(obj)
    return proofs

@router.get("/{model_id}/{proof_id}")
async def get_proof_details(model_id: str, proof_id: str, evm_encoding: bool = Query(False, description="Return proof data encoded for EVM")):
    """Get details for a specific proof, optionally EVM-encoded."""
    result = await akave.download_proof(model_id, proof_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    proof_data = result["data"]
    
    # If EVM encoding is requested, encode the proof data
    if evm_encoding:
        try:
            # Convert proof data to string if it's bytes
            if isinstance(proof_data, bytes):
                proof_data_str = proof_data.decode('utf-8')
            else:
                proof_data_str = proof_data
            
            # Encode for EVM
            encoded_proof = ezkl_service.encode_evm_calldata(proof_data_str)
            proof_data = encoded_proof
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"EVM encoding failed: {str(e)}")
    
    return {
        "proof_id": proof_id,
        "model_id": model_id,
        "data": proof_data,
        "evm_encoded": evm_encoding,
        "bucket": result.get("bucket"),
        "etag": result.get("etag"),
        "checksum_sha256": result.get("checksum_sha256"),
        "checksum_crc32": result.get("checksum_crc32"),
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
    
    # Use the ezkl_service to actually verify the proof
    verification_result = await ezkl_service.verify_proof(
        proof_data=proof_result["data"],
        model_id=model_id
    )
    
    # Pass the verification results back to the client
    return {
        "proof_id": proof_id,
        "model_id": model_id,
        "verified": verification_result.get("verified", False),
        "proof_valid": verification_result.get("proof_valid", False),
        "details": verification_result.get("details", "Proof verification completed"),
        "error": verification_result.get("error")
    } 