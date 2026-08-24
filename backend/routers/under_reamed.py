from fastapi import APIRouter
from schemas.under_reamed import UnderReamedRequest, UnderReamedResponse
from calculators.under_reamed_pile_calculator import calculate_under_reamed_pile

router = APIRouter(prefix="/under-reamed", tags=["under-reamed"])

@router.post("/calculate", response_model=UnderReamedResponse, summary="Calculate capacity and derived geometry of an under-reamed pile")
def calculate_under_reamed_pile_route(req: UnderReamedRequest):
    return calculate_under_reamed_pile(req)
