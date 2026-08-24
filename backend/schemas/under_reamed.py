from pydantic import BaseModel, Field
from typing import Dict, Any

class UnderReamedRequest(BaseModel):
    trialPit: str = Field(..., description="Trial Pit / Borehole ID")
    D: float = Field(..., gt=0.0, description="Stem Diameter, D (m)")
    Cp: float = Field(..., ge=0.0, description="Cohesion at Pile Tip, Cp (kPa)")
    Ca_dash: float = Field(..., ge=0.0, description="Cohesion at Bulb Level, Ca' (kPa)")
    Ca: float = Field(..., ge=0.0, description="Cohesion Along Stem, Ca (kPa)")
    alpha: float | None = Field(None, description="Global Alpha / Adhesion Factor override")

class UnderReamedGeometry(BaseModel):
    Du: float = Field(..., description="Under-Ream Diameter (m)")
    Ap: float = Field(..., description="Tip Area (m²)")
    Aa: float = Field(..., description="Bulb Area (m²)")
    L1: float = Field(..., description="Bulb Height (m)")
    AB_dash: float = Field(..., description="Bulb Surface Area (m²)")
    l: float = Field(..., description="Pile Length Parameter l (m)")
    l2: float = Field(..., description="Shaft Length Parameter l2 (m)")
    As: float = Field(..., description="Shaft Surface Area (m²)")
    Ase: float = Field(..., description="Stem Extension Area (m²)")

class UnderReamedCapacity(BaseModel):
    Qu: float = Field(..., description="Ultimate Capacity (kN)")
    Qa: float = Field(..., description="Allowable Capacity (kN)")
    additionalShaftFriction: float = Field(..., description="Additional Shaft Friction (kN)")
    Qa_total: float = Field(..., description="Total Allowable Capacity (kN)")
    Qa_increase: float = Field(..., description="Capacity Increase (kN)")

class UnderReamedResponse(BaseModel):
    inputs: Dict[str, Any]
    geometry: UnderReamedGeometry
    capacity: UnderReamedCapacity
    engineeringNotes: Dict[str, Any]
