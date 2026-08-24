from pydantic import BaseModel, Field
from typing import Literal

class FootingRequest(BaseModel):
    trialPit: str = Field(..., description="Trial Pit Number")
    foundationType: Literal["isolated", "raft"] = Field(..., description="Foundation Type")
    D: float = Field(..., ge=0, description="Depth of footing/raft, D (m)")
    B: float = Field(..., gt=0, description="Width of footing/raft, B (m)")
    S: float = Field(..., gt=0, description="Allowable settlement, S (mm)")
    N2: float = Field(..., ge=0, description="Corrected SPT value N''")
    Zw2: float = Field(..., ge=0, description="Water table depth below foundation base, Zw2 (m)")

class FootingCorrectionFactors(BaseModel):
    Cd: float
    Rw2: float

class FootingResults(BaseModel):
    netSafeBearingPressure: float

class FootingResponse(BaseModel):
    inputs: dict
    correctionFactors: FootingCorrectionFactors
    results: FootingResults
