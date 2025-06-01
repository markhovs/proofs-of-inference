from fastapi import APIRouter, HTTPException, Body
from app.services.shared import ezkl_service

router = APIRouter()

@router.post("/")
async def run_inference(
    data: dict = Body(...)
):
    """
    Run model inference using ezkl.
    
    Input requirements by model:
    - parity: Binary inputs only (0 or 1). Example: [1, 0, 1, 0, 1, 0]
    - reverse: Digit inputs (0-9). Example: [1, 2, 3, 4, 5, 6]
    """
    input_vector = data.get("input_vector")
    model_id = data.get("model_id", "parity")
    
    # Validate input
    if not input_vector:
        raise HTTPException(status_code=400, detail="input_vector is required")
    
    if not isinstance(input_vector, list) or len(input_vector) != 6:
        raise HTTPException(status_code=400, detail="input_vector must be a list of exactly 6 integers")
    
    # Validate that all elements are integers
    try:
        input_vector = [int(x) for x in input_vector]
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="All elements in input_vector must be integers")

    try:
        # Run prediction only
        result = await ezkl_service.predict(input_vector, model_id)
        
        return {
            "output": result["predicted_digits"],
            "input_vector": input_vector,
            "model_id": model_id,
            "message": "Inference completed successfully. You can now request a proof if needed."
        }
            
    except ValueError as e:
        # Handle input validation errors with specific guidance
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")



@router.get("/latest-prediction")
async def get_latest_prediction():
    """
    Get information about the most recent prediction.
    Useful for showing users what they predicted before they decide to generate a proof.
    """
    if not ezkl_service.latest_prediction:
        raise HTTPException(status_code=404, detail="No recent prediction found. Please run /inference first.")
    
    return {
        "predicted_digits": ezkl_service.latest_prediction["predicted_digits"],
        "input_vector": ezkl_service.latest_prediction["input_vector"],
        "model_id": ezkl_service.latest_prediction["model_id"],
        "can_generate_proof": ezkl_service.latest_prediction.get("witness_file_exists", False),
        "message": "Latest prediction data. You can generate a proof using /proofs/generate endpoint."
    } 