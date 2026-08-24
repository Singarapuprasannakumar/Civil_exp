from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class SptSoilRequest(BaseModel):
    soilType: Literal["clay", "sand"]
    nValue: float = Field(..., ge=0, description="SPT N-value (blows/300mm)")

class SptPhiEstimate(BaseModel):
    method: str
    formula: str
    phi: float

class SptClayResponse(BaseModel):
    soilType: Literal["clay"]
    nValue: float
    consistency: str
    qu: float
    cohesion: float
    recommendation: str

class SptSandResponse(BaseModel):
    soilType: Literal["sand"]
    nValue: float
    relativeDensity: str
    phiEstimates: List[SptPhiEstimate]
    averagePhi: float
    conservativePhi: float
    minPhi: float
    maxPhi: float
    recommendation: str

class SptSoilResponse(BaseModel):
    data: SptClayResponse | SptSandResponse
