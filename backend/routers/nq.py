from fastapi import APIRouter
from schemas.nq import NqRequest, NqResponse
from calculators.nq_calculator import calculate_nq_factor

router = APIRouter(prefix="/nq", tags=["Foundation Engineering"])

@router.post("/calculate", response_model=NqResponse)
def get_nq(req: NqRequest):
    nq, nq_log, diff, out_of_range, warning_msg = calculate_nq_factor(req.phi)
    
    return NqResponse(
        phi=req.phi,
        nq=nq,
        nqLog=nq_log,
        difference=diff,
        outOfRange=out_of_range,
        warningMessage=warning_msg
    )
