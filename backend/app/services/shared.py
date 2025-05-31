# Shared service instances to ensure state persistence across endpoints
from app.services.ezkl_service import EzklService
from app.services.akave import AkaveService

# Create singleton instances
ezkl_service = EzklService()
akave_service = AkaveService()
