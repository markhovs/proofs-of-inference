from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Dict, Any, Optional
from app.services.akave import AkaveService
import json
from fastapi.responses import Response

router = APIRouter()

def get_akave_service():
    return AkaveService()

@router.get("/test")
async def test_connection(
    akave: AkaveService = Depends(get_akave_service)
) -> dict:
    """
    Test Akave O3 connection and credentials
    """
    return await akave.test_connection()

@router.post("/model-settings/{model_id}")
async def upload_model_settings(
    model_id: str,
    file: UploadFile = File(...),
    akave: AkaveService = Depends(get_akave_service)
) -> dict:
    """
    Upload model settings file (JSON) for a given model_id.
    """
    try:
        settings = json.loads(await file.read())
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    result = await akave.upload_model_settings(model_id, settings)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.get("/model-settings/{model_id}")
async def get_model_settings(
    model_id: str,
    akave: AkaveService = Depends(get_akave_service)
) -> dict:
    """
    Download model settings file (JSON) for a given model_id.
    """
    result = await akave.download_model_settings(model_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.post("/verification-key/{model_id}")
async def upload_verification_key(
    model_id: str,
    file: UploadFile = File(...),
    akave: AkaveService = Depends(get_akave_service)
) -> dict:
    """
    Upload verification key file (binary) for a given model_id.
    """
    vk_data = await file.read()
    result = await akave.upload_verification_key(model_id, vk_data)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.get("/verification-key/{model_id}")
async def get_verification_key(
    model_id: str,
    akave: AkaveService = Depends(get_akave_service)
):
    """
    Download verification key file (binary) for a given model_id.
    """
    result = await akave.download_verification_key(model_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    vk_data = result["data"]
    return Response(content=vk_data, media_type="application/octet-stream") 