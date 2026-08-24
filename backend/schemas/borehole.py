from pydantic import BaseModel, Field
from typing import Optional, List

class SoilLayerCreate(BaseModel):
    from_depth: float = Field(..., ge=0.0, description="Start depth in metres")
    to_depth: float = Field(..., ge=0.0, description="End depth in metres")
    layer_order: int = Field(..., ge=0, description="Display order sequence index")
    soil_type: str = Field(..., min_length=1, description="Soil type category (e.g. clay, sand)")
    description: Optional[str] = Field(None, description="Visual description of soil layer")
    uscs_classification: Optional[str] = Field(None, description="USCS classification group symbol")
    is_1498_classification: Optional[str] = Field(None, description="IS 1498 classification group symbol")
    aashto_classification: Optional[str] = Field(None, description="AASHTO soil classification group symbol")
    unit_weight: Optional[float] = Field(None, gt=0.0, description="Unit weight in kN/m³")
    cohesion: Optional[float] = Field(None, ge=0.0, description="Cohesion in kN/m²")
    friction_angle: Optional[float] = Field(None, ge=0.0, le=90.0, description="Friction angle in degrees")
    moisture_content: Optional[float] = Field(None, ge=0.0, le=100.0, description="Water content in %")
    permeability: Optional[float] = Field(None, ge=0.0, description="Permeability in cm/s")
    color: Optional[str] = Field("#8d6e63", description="Visual display color hex")

class SoilLayerResponse(BaseModel):
    id: int
    uuid: str
    borehole_id: int
    from_depth: float
    to_depth: float
    layer_order: int
    soil_type: str
    description: Optional[str] = None
    uscs_classification: Optional[str] = None
    is_1498_classification: Optional[str] = None
    aashto_classification: Optional[str] = None
    unit_weight: Optional[float] = None
    cohesion: Optional[float] = None
    friction_angle: Optional[float] = None
    moisture_content: Optional[float] = None
    permeability: Optional[float] = None
    color: str
    version: str
    created_at: str
    updated_at: str

class SptRecordCreate(BaseModel):
    depth: float = Field(..., ge=0.0, description="Depth of test in metres")
    n_value: int = Field(..., ge=0, description="Raw blow count N")
    corrected_n: Optional[float] = Field(None, ge=0.0, description="Corrected blow count N''")

class SptRecordResponse(BaseModel):
    id: int
    uuid: str
    borehole_id: int
    depth: float
    n_value: int
    corrected_n: Optional[float] = None

class GroundwaterLogCreate(BaseModel):
    measured_date: str = Field(..., description="Measurement date ISO string")
    water_depth: float = Field(..., ge=0.0, description="Water level depth in metres")
    remarks: Optional[str] = None

class GroundwaterLogResponse(BaseModel):
    id: int
    uuid: str
    borehole_id: int
    measured_date: str
    water_depth: float
    remarks: Optional[str] = None

class BoreholeCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Borehole name e.g. BH-1")
    location: Optional[str] = Field(None, description="Borehole location description")
    ground_level: Optional[float] = Field(0.0, description="Ground surface elevation relative to datum")
    termination_depth: Optional[float] = Field(0.0, description="Borehole total depth")
    groundwater_depth: Optional[float] = Field(None, description="Groundwater depth at time of drilling")
    drilling_method: Optional[str] = Field(None, description="Wash Boring, Rotary, etc.")
    remarks: Optional[str] = None
    status: Optional[str] = Field("Draft", description="Status workflow state")

class BoreholeUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    location: Optional[str] = None
    ground_level: Optional[float] = 0.0
    termination_depth: Optional[float] = 0.0
    groundwater_depth: Optional[float] = None
    drilling_method: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = "Draft"

class BoreholeResponse(BaseModel):
    id: int
    uuid: str
    project_id: int
    name: str
    location: Optional[str] = None
    ground_level: float
    termination_depth: float
    groundwater_depth: Optional[float] = None
    drilling_method: Optional[str] = None
    remarks: Optional[str] = None
    status: str
    
    # Nested stats
    layers_count: int = 0
    spt_count: int = 0
