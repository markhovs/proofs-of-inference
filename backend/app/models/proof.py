from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProofRequest(BaseModel):
    input_hash: str
    model_hash: Optional[str] = None
    metadata: Optional[dict] = None

class EzklProofRequest(BaseModel):
    input_vector: List[int]
    model_id: str
    metadata: Optional[dict] = None

class ProofResponse(BaseModel):
    proof_id: str
    status: str
    proof_hash: Optional[str] = None
    timestamp: datetime = datetime.utcnow()
    storage_location: Optional[str] = None

class EzklProofResponse(BaseModel):
    proof_id: str
    status: str
    predicted_digits: Optional[List[int]] = None
    proof_data: Optional[str] = None
    input_vector: Optional[List[int]] = None
    model_id: str
    timestamp: datetime = datetime.utcnow()
    error: Optional[str] = None 