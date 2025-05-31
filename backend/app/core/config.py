from pydantic import BaseModel
from functools import lru_cache
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    # API Configuration
    PROJECT_NAME: str = "Proofs of Inference"
    API_V1_STR: str = "/api/v1"
    
    # Blockchain Configuration
    WEB3_PROVIDER_URI: Optional[str] = os.getenv("WEB3_PROVIDER_URI")
    CONTRACT_ADDRESS: Optional[str] = os.getenv("CONTRACT_ADDRESS")
    
    # Storage Configuration
    AKAVE_API_KEY: Optional[str] = os.getenv("AKAVE_API_KEY")
    AKAVE_ENDPOINT: Optional[str] = os.getenv("AKAVE_ENDPOINT")

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings() 