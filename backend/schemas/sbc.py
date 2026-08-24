from pydantic import BaseModel, Field
from typing import Literal

class SbcRequest(BaseModel):
    trialPit: str = Field(..., description="Trial Pit Number")
    cohesion: float = Field(..., ge=0, description="Cohesion (kN/m²)")
    phi: float = Field(..., ge=0, le=45, description="Friction angle (degrees)")
    D: float = Field(..., ge=0, description="Depth of footing, D (m)")
    B: float = Field(..., gt=0, description="Width of footing, B (m)")
    L: float = Field(..., gt=0, description="Length of footing, L (m)")
    wt: float = Field(..., ge=0, description="Water table depth (m)")
    footingType: Literal["square", "rectangular", "circular", "strip"]
    failureType: Literal["general", "local"]
    gamma: float = Field(..., ge=0, description="Bulk unit weight (kN/m³)")
    gammaSub: float = Field(..., ge=0, description="Submerged unit weight (kN/m³)")
    alpha: float = Field(..., ge=0, le=90, description="Inclination of load (degrees)")
    FS: float = Field(..., gt=0, description="Factor of safety")

class SbcBearingFactors(BaseModel):
    Nc: float
    Nq: float
    Nr: float

class SbcCorrectionFactors(BaseModel):
    dc: float
    dq: float
    dr: float
    sc: float
    sq: float
    sr: float
    Rw2: float

class SbcResults(BaseModel):
    ultimateBearingCapacity: float
    safeBearingCapacity: float
    safeBearingCapacityTon: float

class SbcResponse(BaseModel):
    inputs: dict
    bearingFactors: SbcBearingFactors
    correctionFactors: SbcCorrectionFactors
    results: SbcResults
