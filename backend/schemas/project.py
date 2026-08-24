from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Project Name")
    project_number: str = Field(..., min_length=1, description="Unique Project Number")
    client_name: str = Field(..., min_length=1, description="Client Name")
    consultant: Optional[str] = Field(None, description="Consultant Name")
    location: str = Field(..., min_length=1, description="Location")
    latitude: Optional[float] = Field(None, description="Latitude")
    longitude: Optional[float] = Field(None, description="Longitude")
    description: Optional[str] = Field(None, description="Project Description")
    status: Optional[str] = Field("Draft", description="Status (Draft, In Progress, etc.)")

class ProjectUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    client_name: str = Field(..., min_length=1)
    consultant: Optional[str] = None
    location: str = Field(..., min_length=1)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = "Draft"

class SiteInfoUpdate(BaseModel):
    site_name: Optional[str] = None
    site_coordinates: Optional[str] = None
    ground_level: Optional[float] = None
    groundwater_level: Optional[float] = None
    weather: Optional[str] = None
    elevation: Optional[float] = None
    site_notes: Optional[str] = None

class AdhesionFactorPref(BaseModel):
    value: Optional[float] = Field(None, ge=0.0, le=1.0, description="Adhesion factor must be between 0 and 1")
    active: bool = False
    source: Optional[str] = None

class FoundationPreferencesUpdate(BaseModel):
    adhesion_factor: AdhesionFactorPref

class FoundationPreferencesResponse(BaseModel):
    project_id: int
    adhesion_factor_value: Optional[float] = None
    adhesion_factor_active: bool = False
    adhesion_factor_source: Optional[str] = None
    adhesion_factor_confirmed_at: Optional[str] = None

class CalculationSave(BaseModel):
    module: str = Field(..., description="Geotechnical module name")
    calculation_name: str = Field(..., description="Custom name for the calculation trial")
    inputs: Dict[str, Any] = Field(..., description="Serialized input fields dict")
    results: Dict[str, Any] = Field(..., description="Serialized results metrics dict")
    version: Optional[str] = Field("1.0", description="Solver calculation version")

class CalculationResponse(BaseModel):
    id: int
    uuid: str
    project_id: int
    module: str
    calculation_name: str
    created_at: str
    inputs: Dict[str, Any]
    results: Dict[str, Any]
    version: str

class ReportSave(BaseModel):
    id: str = Field(..., description="Report UUID")
    module: str = Field(..., description="Engineering module name")
    report_number: int = Field(..., description="Trial number")
    engineer: str = Field("Consultant Geotechnical Engineer", description="Engineer name")
    inputs: Dict[str, Any] = Field(..., description="Serialized input fields dict")
    results: Dict[str, Any] = Field(..., description="Serialized results metrics dict")
    engineering_notes: Optional[Dict[str, Any]] = Field(None, description="Serialized notes dict")

class ReportResponse(BaseModel):
    id: str
    project_id: int
    module: str
    report_number: int
    engineer: str
    created_at: str
    inputs: Dict[str, Any]
    results: Dict[str, Any]
    engineering_notes: Optional[Dict[str, Any]] = None

class ActivityResponse(BaseModel):
    id: int
    project_id: int
    activity_type: str
    description: str
    created_at: str
    user_name: str

class ProjectResponse(BaseModel):
    id: int
    uuid: str
    name: str
    project_number: str
    client_name: str
    consultant: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    status: str
    created_at: str
    modified_at: str
    
    # Site Info (Normalized mapping)
    site_name: Optional[str] = None
    site_coordinates: Optional[str] = None
    ground_level: Optional[float] = None
    groundwater_level: Optional[float] = None
    weather: Optional[str] = None
    elevation: Optional[float] = None
    site_notes: Optional[str] = None
    
    # Reports Summary
    calculations_count: int = 0
