from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class SoilRequest(BaseModel):
    fines: float = Field(..., ge=0.0, le=100.0, description="Percentage of Fines (%)")
    gravel: Optional[float] = Field(None, ge=0.0, le=100.0, description="Percentage of Gravel (%)")
    wl: Optional[float] = Field(None, ge=0.0, description="Liquid Limit WL (%)")
    wp: Optional[float] = Field(None, ge=0.0, description="Plastic Limit WP (%)")
    cu: Optional[float] = Field(None, ge=0.0, description="Uniformity Coefficient Cu")
    cc: Optional[float] = Field(None, ge=0.0, description="Coefficient of Curvature Cc")

class SoilResponse(BaseModel):
    inputs: Dict[str, Any]
    soilType: str
    groupSymbol: str
    engineeringProperties: Dict[str, Any]
    notes: Dict[str, Any]
