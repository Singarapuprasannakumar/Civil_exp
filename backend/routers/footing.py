from fastapi import APIRouter
from schemas.footing import FootingRequest, FootingResponse
from calculators.footing_calculator import calculate_footing

router = APIRouter(prefix="/footing", tags=["footing"])

@router.post("/calculate", response_model=FootingResponse, summary="Calculate safe bearing pressure for footing & raft")
def calculate_footing_route(req: FootingRequest):
    return calculate_footing(req)
