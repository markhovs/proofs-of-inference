from fastapi import APIRouter, HTTPException, Body
from app.services.akave import AkaveService
import uuid

router = APIRouter()
akave = AkaveService()

@router.post("/infer")
async def model_infer(
    data: dict = Body(...)
):
    """
    Run model inference. If generate_proof is true, generate and store a proof.
    """
    input_text = data.get("input")
    generate_proof = data.get("generate_proof", False)
    model_id = data.get("model_id", "model-1")
    if not input_text:
        raise HTTPException(status_code=400, detail="input is required")

    # Mock model output (replace with real model logic)
    output = input_text[::-1]  # Example: reverse the input

    proof_id = None
    if generate_proof:
        proof_id = str(uuid.uuid4())
        # Mock proof data (replace with real proof generation)
        proof_data = f"proof for {input_text} with model {model_id}".encode()
        upload_result = await akave.upload_proof(model_id, proof_id, proof_data)
        if "error" in upload_result:
            raise HTTPException(status_code=500, detail=upload_result["error"])

    return {
        "output": output,
        "proof_id": proof_id,
        "message": "Proof generated and stored" if generate_proof else "No proof requested"
    } 