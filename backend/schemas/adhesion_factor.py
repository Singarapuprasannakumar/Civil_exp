from pydantic import BaseModel, Field
from typing import Literal

class AdhesionFactorRequest(BaseModel):
    cohesion: float = Field(..., ge=0, description="Cohesion (kPa)")
    pileType: Literal["concrete", "all"]

class AdhesionFactorResponse(BaseModel):
    cohesion: float
    pileType: str
    alpha: float
    outOfRange: bool
    warningMessage: str | None
