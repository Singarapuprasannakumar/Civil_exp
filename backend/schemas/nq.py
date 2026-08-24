from pydantic import BaseModel, Field

class NqRequest(BaseModel):
    phi: float = Field(..., gt=0, description="Angle of internal friction phi' (degrees)")

class NqResponse(BaseModel):
    phi: float
    nq: float
    nqLog: float
    difference: float
    outOfRange: bool
    warningMessage: str | None
