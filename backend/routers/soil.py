from fastapi import APIRouter
from schemas.soil import SoilRequest, SoilResponse
from calculators.soil_classification_calculator import classify_soil

router = APIRouter(prefix="/soil", tags=["soil"])

@router.post("/classify", response_model=SoilResponse, summary="Classify soil type and retrieve engineering properties")
def classify_soil_route(req: SoilRequest):
    return classify_soil(req)
