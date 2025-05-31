from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProofRequest(BaseModel):
    input_hash: str
    model_hash: Optional[str] = None
    metadata: Optional[dict] = None

class ProofResponse(BaseModel):
    proof_id: str
    status: str
    proof_hash: Optional[str] = None
    timestamp: datetime = datetime.utcnow()
    storage_location: Optional[str] = None 