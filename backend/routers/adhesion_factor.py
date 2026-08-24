from fastapi import APIRouter
from schemas.adhesion_factor import AdhesionFactorRequest, AdhesionFactorResponse
from calculators.adhesion_factor_calculator import calculate_adhesion_factor

router = APIRouter(prefix="/adhesion-factor", tags=["Foundation Engineering"])

@router.post("/calculate", response_model=AdhesionFactorResponse)
def get_adhesion_factor(req: AdhesionFactorRequest):
    alpha, out_of_range, warning_msg = calculate_adhesion_factor(req.cohesion, req.pileType)
    
    return AdhesionFactorResponse(
        cohesion=req.cohesion,
        pileType=req.pileType,
        alpha=alpha,
        outOfRange=out_of_range,
        warningMessage=warning_msg
    )
