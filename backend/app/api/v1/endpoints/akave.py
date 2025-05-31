from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from app.services.akave import AkaveService

router = APIRouter()

def get_akave_service():
    return AkaveService()

@router.post("/bucket/create")
async def create_bucket(
    bucket_name: Optional[str] = None,
    akave: AkaveService = Depends(get_akave_service)
) -> dict:
    """
    Create a new bucket. If no bucket_name is provided, 
    uses the one from configuration.
    """
    return await akave.create_bucket(bucket_name)

@router.get("/test")
async def test_connection(
    akave: AkaveService = Depends(get_akave_service)
) -> dict:
    """
    Test Akave O3 connection and credentials
    """
    return await akave.test_connection()

@router.post("/upload")
async def upload_test_file(
    data: Dict[str, Any],
    key: str,
    akave: AkaveService = Depends(get_akave_service)
) -> dict:
    """
    Upload a test JSON file to Akave O3.
    Returns the upload response including S3 response data and file metadata.
    """
    response = await akave.upload_json(key, data)
    if "error" in response:
        raise HTTPException(status_code=500, detail=response["error"])
    return response

@router.get("/list")
async def list_files(
    prefix: str = None,
    akave: AkaveService = Depends(get_akave_service)
) -> Dict[str, Any]:
    """
    List files in the Akave O3 bucket.
    Returns a dictionary containing the listing response and metadata.
    """
    return await akave.list_files(prefix)

@router.get("/download/{key:path}")
async def download_file(
    key: str,
    akave: AkaveService = Depends(get_akave_service)
) -> dict:
    """
    Download a JSON file from Akave O3.
    The key can include forward slashes for nested paths.
    """
    response = await akave.download_json(key)
    if "error" in response:
        raise HTTPException(status_code=500, detail=response["error"])
    return response 