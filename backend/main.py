"""Pile Capacity Calculator – FastAPI Backend
==========================================

Engineering Methods Used
-------------------------
• Clay shaft friction  : α-method  →  qs = α × Cu
• Sand shaft friction  : Effective stress method
    - L/D < 15  : Average overburden = (ovTop + ovBottom) / 2
                  qs = K × σ'v_avg × tan(δ)   where δ = 0.75φ
    - L/D >= 15 : Compute σ'v from bulk/submerged unit weights with critical depth capping
                  same formula applies
• Clay end bearing    : Skempton  →  Qp = 9 × Cu × Ap
• Sand end bearing    : Qp = σ'v × Nq × Ap (overburden capped at critical depth Dc)
• Pile perimeter      : C = π × D
• Pile tip area       : Ap = π × D² / 4
• Ultimate capacity   : Qu = ΣQs + Qp
• Allowable capacity  : Qa = Qu / FOS  (FOS = 2.5 by default)
"""

import math
import os
import time
import datetime
from typing import List, Optional, Union, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from pydantic import BaseModel, Field
from schemas.sbc import SbcRequest, SbcResponse
from calculators.sbc_calculator import calculate_sbc
from routers import footing, soil, under_reamed, projects, boreholes, spt_soil, adhesion_factor, nq
from models.project import init_db


# ─── Geotechnical Engineering Configuration Constants ─────────────────────────

class GeotechnicalConfig:
    """Consolidated engineering parameters configuration block."""
    FACTOR_OF_SAFETY: float = 2.5            # Design factor of safety (IS 2911 Part 1/Sec 2 Clause 6.1)
    PI: float = math.pi
    DEFAULT_CLAY_UNIT_WEIGHT: float = 18.0   # kN/m³ bulk unit weight fallback for clay layers
    DEFAULT_CLAY_SUB_UNIT_WEIGHT: float = 8.0 # kN/m³ submerged unit weight fallback for clay
    WATER_UNIT_WEIGHT: float = 9.81          # kN/m³ unit weight of water
    CRITICAL_DEPTH_FACTOR: float = 15.0      # Dc = 15 * D according to standard practice (Tomlinson, IS 2911)
    DEFAULT_DELTA_FACTOR: float = 0.75       # δ = 0.75 * φ for soil-pile interface friction
    SKEMPTON_NC: float = 9.0                 # Nc = 9 for clay tip end bearing (Skempton, IS 2911)
    GRAVITY: float = 9.81                    # m/s² gravitational acceleration constant
    MAX_REASONABLE_PHI: float = 45.0         # degrees, maximum physically reasonable phi value for sand


# ─── Central Engineering Reference Table ──────────────────────────────────────

GEOTECHNICAL_REFERENCES = {
    "IS2911_P1S2_B22": {
        "title": "IS 2911 (Part 1/Section 2) Appendix B Clause B.2.2",
        "description": "Shaft resistance calculation in cohesive soils using the Adhesion alpha-method."
    },
    "IS2911_P1S2_B12_SHAFT": {
        "title": "IS 2911 (Part 1/Section 2) Appendix B Clause B.1.2",
        "description": "Shaft resistance calculation in cohesionless soils using the Effective Stress Method with interface friction angle delta."
    },
    "IS2911_P1S2_B21": {
        "title": "IS 2911 (Part 1/Section 2) Appendix B Clause B.2.1",
        "description": "Net ultimate end bearing resistance calculation in clay using bearing capacity factor Nc = 9.0 (Skempton's method)."
    },
    "IS2911_P1S2_B12_TIP": {
        "title": "IS 2911 (Part 1/Section 2) Appendix B Clause B.1.2",
        "description": "End bearing calculation in cohesionless soils using bearing capacity factor Nq."
    },
    "REISSNER_VESIC_NQ": {
        "title": "Reissner (1924) & Vesic (1973) bearing capacity theory",
        "description": "Closed-form formula for bearing capacity factor Nq = exp(pi*tan(phi)) * tan^2(45 + phi/2) representing deep foundation tip bearing."
    },
    "IS2911_P1S2_61": {
        "title": "IS 2911 (Part 1/Section 2) Clause 6.1",
        "description": "Definition of factor of safety (FS = 2.5) to obtain allowable pile capacity from ultimate capacity."
    }
}


# ─── Geotechnical Engineering Assumptions ─────────────────────────────────────
# • Homogeneous soil conditions within each defined soil layer.
# • Static loading conditions only; dynamic axial and structural load effects are ignored.
# • Vertical bored cast-in-situ concrete pile profile.
# • Single isolated pile capacity is computed; group efficiency/effects are ignored.
# • Negative skin friction (downdrag forces) is not considered in this analysis.
# • Settlement and differential settlement analysis is not included.
# • Liquefaction risks/effects in loose saturated sand strata are ignored.
# • Seismic and lateral wind loading effects are not considered.


# ─── Pydantic Models ─────────────────────────────────────────────────────────

class ClayLayer(BaseModel):
    soilType: Literal["clay"]
    thickness: float = Field(..., gt=0, description="Layer thickness in metres")
    alpha: float = Field(..., gt=0, le=1, description="Adhesion factor α")
    cohesion: float = Field(..., gt=0, description="Average undrained cohesion Cu (kN/m²)")


class SandLayerLDLow(BaseModel):
    """Sand layer where L/D < 15 – user supplies overburden directly."""
    soilType: Literal["sand"]
    thickness: float = Field(..., gt=0)
    K: float = Field(..., gt=0, description="Lateral earth pressure coefficient")
    phi: float = Field(..., gt=0, le=GeotechnicalConfig.MAX_REASONABLE_PHI, description="Friction angle φ in degrees")
    ovTop: float = Field(..., ge=0, description="Effective overburden at top (kN/m²)")
    ovBottom: float = Field(..., ge=0, description="Effective overburden at bottom (kN/m²)")


class SandLayerLDHigh(BaseModel):
    """Sand layer where L/D >= 15 – backend computes overburden from unit weights."""
    soilType: Literal["sand"]
    thickness: float = Field(..., gt=0)
    K: float = Field(..., gt=0)
    phi: float = Field(..., gt=0, le=GeotechnicalConfig.MAX_REASONABLE_PHI)
    bulkUnit: float = Field(..., gt=0, description="Bulk unit weight above WT (kN/m³)")
    waterTableDepth: float = Field(..., ge=0, description="Water table depth from top of layer (m)")
    submergedUnit: float = Field(..., gt=0, description="Submerged unit weight below WT (kN/m³)")


class ClayTip(BaseModel):
    soilType: Literal["clay"]
    cohesion: float = Field(..., gt=0, description="Undrained cohesion at pile tip (kN/m²)")


class SandTip(BaseModel):
    soilType: Literal["sand"]
    overburden: float = Field(..., gt=0, description="Effective overburden at pile tip (kN/m²)")
    nq: float = Field(..., gt=0, description="Bearing capacity factor Nq")


class CalculateRequest(BaseModel):
    diameter: float = Field(..., gt=0, description="Pile diameter in metres")
    layers: List[dict] = Field(..., min_length=1)
    tip: dict
    debugEngineering: Optional[bool] = Field(False, description="Enable detailed geotechnical engineering debug trace")


class LayerResult(BaseModel):
    layer: int              # 1-based layer number
    soilType: str
    thickness: float
    skinFrictionClay: float # Qs from clay α-method (0 if sand layer)
    skinFrictionSand: float # Qs from sand effective-stress (0 if clay layer)
    shaftResistance: float  # Total Qs = skinFrictionClay + skinFrictionSand
    
    # Intermediate calculations (Optional, added for engineering clarity and vivas)
    area: Optional[float] = None
    perimeter: Optional[float] = None
    avgEffectiveStress: Optional[float] = None
    delta: Optional[float] = None
    tanDelta: Optional[float] = None
    depth: Optional[float] = None
    cumulativeShaftResistance: Optional[float] = None


class DesignSummary(BaseModel):
    assumptions: List[str] = Field(default_factory=list)
    references: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    disclaimer: str = ""


class CalculateResponse(BaseModel):
    layerResults: List[LayerResult]
    Qp: float   # End bearing (kN)
    Qu: float   # Ultimate capacity (kN)
    Qa: float   # Allowable capacity (kN)
    warnings: List[str] = Field(default_factory=list)
    intermediateCalculations: dict = Field(default_factory=dict)
    designSummary: Optional[DesignSummary] = None


# ─── Geotechnical Engineering Logic Helpers ──────────────────────────────────

def explain_calculation(ref_id: str) -> str:
    """Returns a human-readable explanation of calculations based on its Reference ID."""
    ref = GEOTECHNICAL_REFERENCES.get(ref_id)
    if not ref:
        return ""
    return f"Calculated using the methodology recommended by {ref['title']}. {ref['description']}"


def pile_perimeter(diameter: float) -> float:
    # Pile perimeter calculation
    # Formula: C = π * D
    # Engineering Reference: Standard geometry
    # Source: Standard geometric boundary circumference
    # Units: metres (m)
    return GeotechnicalConfig.PI * diameter


def pile_tip_area(diameter: float) -> float:
    # Pile base area calculation
    # Formula: Ap = π * D² / 4
    # Engineering Reference: Standard geometry
    # Source: Standard geometric circular cross-section
    # Units: square metres (m²)
    return GeotechnicalConfig.PI * (diameter ** 2) / 4.0


def calculate_nq(phi_deg: float) -> float:
    # Bearing capacity factor calculation
    # Formula: Nq = exp(π * tan(φ)) * tan²(45° + φ/2)
    # Engineering Reference: Reissner-Vesic bearing capacity equation
    # Source: Based on accepted geotechnical engineering practice (Tomlinson / Vesic).
    # Units: Dimensionless
    if phi_deg <= 0:
        return 1.0
    phi_rad = math.radians(phi_deg)
    tan_term = math.tan(math.radians(45.0) + phi_rad / 2.0)
    nq = math.exp(math.pi * math.tan(phi_rad)) * (tan_term ** 2)
    return nq


def calculate_clay_shaft(alpha: float, cohesion: float, perimeter: float, thickness: float) -> float:
    # Cohesive skin friction calculated using the Adhesion Method (α-method)
    # Formula: Qs = α * Cu * As  where As = perimeter * thickness
    # Engineering Reference: IS 2911 (Part 1/Section 2) Clause B.2.2
    # Source: Bureau of Indian Standards (BIS)
    # Units: Force in kN
    as_area = perimeter * thickness
    return alpha * cohesion * as_area


def calculate_sand_shaft(K: float, sigma_avg: float, phi_deg: float, perimeter: float, thickness: float) -> float:
    # Shaft resistance calculated using the Effective Stress Method
    # Formula: Qs = K * σ'_v_avg * tan(δ) * As  where δ = 0.75 * φ, As = perimeter * thickness
    # Engineering Reference: IS 2911 (Part 1/Section 2) Clause B.1.2
    # Source: Bureau of Indian Standards (BIS) (δ correlation based on accepted practice: Tomlinson)
    # Units: Force in kN
    delta_deg = GeotechnicalConfig.DEFAULT_DELTA_FACTOR * phi_deg
    delta_rad = math.radians(delta_deg)
    as_area = perimeter * thickness
    return K * sigma_avg * math.tan(delta_rad) * as_area


def calculate_clay_tip(cohesion: float, area: float) -> float:
    # Clay net ultimate end bearing resistance
    # Formula: Qp = Nc * Cu * Ap  where Nc = 9.0
    # Engineering Reference: IS 2911 (Part 1/Section 2) Clause B.2.1
    # Source: Bureau of Indian Standards (BIS) (Based on Skempton's Nc bearing capacity factor)
    # Units: Force in kN
    return GeotechnicalConfig.SKEMPTON_NC * cohesion * area


def calculate_sand_tip(overburden: float, nq: float, area: float) -> float:
    # Base resistance calculated using overburden stress and bearing factor Nq
    # Formula: Qp = σ'_v * Nq * Ap
    # Engineering Reference: IS 2911 (Part 1/Section 2) Clause B.1.2
    # Source: Bureau of Indian Standards (BIS) (Nq formula based on accepted practice: Vesic / Reissner)
    # Units: Force in kN
    return overburden * nq * area


def calculate_allowable_capacity(qu: float, safety_factor: float = GeotechnicalConfig.FACTOR_OF_SAFETY) -> float:
    # Allowable pile capacity calculated using a factor of safety
    # Formula: Qa = Qu / FS
    # Engineering Reference: IS 2911 (Part 1/Section 2) Clause 6.1
    # Source: Bureau of Indian Standards (BIS)
    # Units: Force in kN
    return qu / safety_factor


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Pile Capacity Calculator API",
    description="Computes shaft resistance, end bearing, ultimate and allowable pile capacity.",
    version="1.0.0",
    docs_url=None,   # Disable default docs to override with cdnjs
    redoc_url=None,  # Disable default redoc
)

@app.on_event("startup")
def on_startup():
    init_db()

# CORS configuration
origins_env = os.getenv("ALLOWED_ORIGINS", "")
frontend_url = os.getenv("FRONTEND_URL", "")
env_origins = [
    origin.strip().rstrip("/")
    for origin in (origins_env + "," + frontend_url).split(",")
    if origin.strip()
]

# Standard local development and default production origins
default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000",
    "https://pile-capacity-calculator.vercel.app"
]

allowed_origins = list(set(default_origins + env_origins))
allowed_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup diagnostics logging and CORS self-test
def run_cors_self_test():
    import re
    print("=" * 80)
    print("PILE CAPACITY API - STARTUP DIAGNOSTICS & CORS SELF-TEST")
    backend_url = os.getenv("RENDER_EXTERNAL_URL", "http://localhost:8000")
    print(f"Backend URL:          {backend_url}")
    print(f"Allowed Origins:      {allowed_origins}")
    print(f"Allowed Origin Regex: {allowed_origin_regex}")
    print(f"Environment Variables: ALLOWED_ORIGINS={os.getenv('ALLOWED_ORIGINS')}")
    print("-" * 80)
    
    test_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "https://pile-capacity-calculator.vercel.app",
        "https://pile-capacity-calculator-eight.vercel.app",
        "https://pile-cap-git-xxxxxxxx.vercel.app",
        "https://some-unauthorized-domain.com"
    ]
    
    compiled_regex = re.compile(allowed_origin_regex) if allowed_origin_regex else None
    
    for origin in test_origins:
        matched_explicit = origin in allowed_origins
        matched_regex = bool(compiled_regex.fullmatch(origin)) if compiled_regex else False
        is_allowed = matched_explicit or matched_regex
        status = "ALLOWED" if is_allowed else "DENIED"
        details = []
        if matched_explicit: details.append("explicit list")
        if matched_regex:    details.append("regex match")
        details_str = f" ({', '.join(details)})" if details else ""
        print(f"Origin: {origin:<50} -> {status}{details_str}")
        
    print("Loaded successfully.")
    print("=" * 80)

@app.on_event("startup")
def startup_event():
    run_cors_self_test()


@app.get("/", summary="Root endpoint")
def root():
    return {"status": "ok", "message": "Pile Capacity Calculator API is running."}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "2.3.2"
    }


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui.css",
    )


# ─── Verification & Input Validations ────────────────────────────────────────

def validate_inputs(diameter: float, layers: List[dict], tip: dict):
    """Performs strict engineering validation checks. Raises HTTP 422 for invalid states."""
    if diameter <= 0:
        raise HTTPException(status_code=422, detail="Pile diameter must be greater than 0.")
    if diameter < 0.05:
        raise HTTPException(status_code=422, detail="Pile diameter cannot be less than 0.05m (5 cm) for physical stability.")
    
    for i, raw in enumerate(layers):
        soil_type = raw.get("soilType", "")
        thickness = raw.get("thickness")
        if thickness is None:
            raise HTTPException(status_code=422, detail=f"Layer {i+1} thickness is required.")
        try:
            thickness_val = float(thickness)
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Layer {i+1} thickness must be a numeric value.")
        if thickness_val <= 0:
            raise HTTPException(status_code=422, detail=f"Layer {i+1} thickness must be greater than 0.")
            
        if soil_type == "clay":
            alpha = raw.get("alpha")
            cohesion = raw.get("cohesion")
            if alpha is None or cohesion is None:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Clay) alpha and cohesion are required.")
            try:
                alpha_val = float(alpha)
                cohesion_val = float(cohesion)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Clay) alpha and cohesion must be numeric values.")
            if alpha_val <= 0 or alpha_val > 1:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Clay) alpha must be between 0 and 1 (exclusive of 0).")
            if cohesion_val <= 0:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Clay) cohesion must be greater than 0.")
                
        elif soil_type == "sand":
            phi = raw.get("phi")
            K = raw.get("K")
            if phi is None or K is None:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand) phi and K are required.")
            try:
                phi_val = float(phi)
                K_val = float(K)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand) phi and K must be numeric values.")
            if phi_val <= 0 or phi_val > GeotechnicalConfig.MAX_REASONABLE_PHI:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand) phi must be in the range (0, 45].")
            if K_val <= 0:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand) K coefficient must be greater than 0.")
                
            # Check model subfields
            ld = thickness_val / diameter
            if ld < 15:
                ovTop = raw.get("ovTop")
                ovBottom = raw.get("ovBottom")
                if ovTop is None or ovBottom is None:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D < 15) overburden pressures (ovTop, ovBottom) are required.")
                try:
                    ovTop_val = float(ovTop)
                    ovBottom_val = float(ovBottom)
                except ValueError:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D < 15) overburden pressures must be numeric values.")
                if ovTop_val < 0 or ovBottom_val < 0:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D < 15) overburden pressures must be greater than or equal to 0.")
            else:
                bulkUnit = raw.get("bulkUnit")
                submergedUnit = raw.get("submergedUnit")
                waterTableDepth = raw.get("waterTableDepth")
                if bulkUnit is None or submergedUnit is None or waterTableDepth is None:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D >= 15) bulkUnit, submergedUnit, and waterTableDepth are required.")
                try:
                    bulk_val = float(bulkUnit)
                    sub_val = float(submergedUnit)
                    wt_val = float(waterTableDepth)
                except ValueError:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D >= 15) unit weights must be numeric values.")
                if bulk_val <= 0 or sub_val <= 0:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D >= 15) bulkUnit and submergedUnit must be greater than 0.")
                if wt_val < 0:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D >= 15) waterTableDepth must be greater than or equal to 0.")
        else:
            raise HTTPException(status_code=422, detail=f"Layer {i+1}: Unknown soil type '{soil_type}'.")

    # Validate tip
    tip_type = tip.get("soilType", "")
    if tip_type == "clay":
        cohesion = tip.get("cohesion")
        if cohesion is None:
            raise HTTPException(status_code=422, detail="Pile tip (Clay) cohesion is required.")
        try:
            cohesion_val = float(cohesion)
        except ValueError:
            raise HTTPException(status_code=422, detail="Pile tip (Clay) cohesion must be a numeric value.")
        if cohesion_val <= 0:
            raise HTTPException(status_code=422, detail="Pile tip (Clay) cohesion must be greater than 0.")
    elif tip_type == "sand":
        overburden = tip.get("overburden")
        if overburden is None or overburden == "":
            raise HTTPException(status_code=422, detail="Pile tip (Sand) overburden is required.")
        try:
            overburden_val = float(overburden)
        except ValueError:
            raise HTTPException(status_code=422, detail="Pile tip (Sand) overburden must be a numeric value.")
        if overburden_val <= 0:
            raise HTTPException(status_code=422, detail="Pile tip (Sand) overburden must be greater than 0.")

        nq = tip.get("nq")
        if nq is None or nq == "":
            raise HTTPException(status_code=422, detail="Pile tip (Sand) Nq is required.")
        try:
            nq_val = float(nq)
        except ValueError:
            raise HTTPException(status_code=422, detail="Pile tip (Sand) Nq must be a numeric value.")
        if nq_val <= 0:
            raise HTTPException(status_code=422, detail="Pile tip (Sand) Nq must be greater than 0.")
    else:
        raise HTTPException(status_code=422, detail=f"Pile tip: Unknown soil type '{tip_type}'.")


def get_uncapped_stress_at_depth(depth: float, points: List[tuple]) -> float:
    """Linearly interpolates effective overburden pressure along depth-stress points."""
    if depth <= 0:
        return 0.0
    for i in range(len(points) - 1):
        z1, s1 = points[i]
        z2, s2 = points[i+1]
        if z1 <= depth <= z2:
            if z2 > z1:
                return s1 + (depth - z1) / (z2 - z1) * (s2 - s1)
            return s1
    return points[-1][1]


# ─── Endpoint Handler ────────────────────────────────────────────────────────

@app.post("/calculate", response_model=CalculateResponse, summary="Calculate pile capacity")
def calculate(req: CalculateRequest):
    start_time = time.perf_counter()
    
    # 1. Perform strict input validations
    validate_inputs(req.diameter, req.layers, req.tip)

    diameter = req.diameter
    perimeter = pile_perimeter(diameter)
    area = pile_tip_area(diameter)

    warnings: List[str] = []
    
    # 2. Check pile geometry warnings
    if diameter > 1.5:
        warnings.append(f"Engineering Warning: Large diameter pile (diameter = {diameter}m > 1.5m).")
    if diameter < 0.3:
        warnings.append(f"Engineering Warning: Small diameter pile (diameter = {diameter}m < 0.3m).")
    
    # 3. Compute cumulative uncapped effective overburden stress profile
    stress_points = [(0.0, 0.0)]  # list of (depth_from_surface, effective_stress)
    current_depth = 0.0

    for i, raw in enumerate(req.layers):
        soil_type = raw.get("soilType", "")
        thickness = float(raw.get("thickness", 0))

        stress_top = stress_points[-1][1]
        
        # Soft/Stiff Clay warnings
        if soil_type == "clay":
            cohesion = float(raw.get("cohesion", 0))
            alpha = float(raw.get("alpha", 0))
            if cohesion > 500.0:
                warnings.append(f"Engineering Warning: Clay cohesion Cu = {cohesion} kPa is unusually high (> 500 kPa).")
            if cohesion < 25.0:
                warnings.append(f"Engineering Warning: Very soft clay layer detected in Layer {i+1} (Cu = {cohesion} kPa < 25 kPa).")
            if cohesion > 150.0:
                warnings.append(f"Engineering Warning: Very stiff clay layer detected in Layer {i+1} (Cu = {cohesion} kPa > 150 kPa).")
            if alpha > 1.0:
                warnings.append(f"Engineering Warning: Adhesion factor alpha exceeds 1.0 in Layer {i+1}.")
                
            stress_bottom = stress_top + GeotechnicalConfig.DEFAULT_CLAY_UNIT_WEIGHT * thickness
            
        # Loose/Dense Sand warnings
        elif soil_type == "sand":
            phi = float(raw.get("phi", 0))
            K = float(raw.get("K", 0))
            if phi > GeotechnicalConfig.MAX_REASONABLE_PHI:
                warnings.append(f"Engineering Warning: Friction angle phi = {phi}° exceeds normal limit of 45°.")
            if phi > 40.0:
                warnings.append(f"Engineering Warning: Very dense sand layer detected in Layer {i+1} (friction angle = {phi}° > 40°).")
            if phi < 30.0:
                warnings.append(f"Engineering Warning: Very loose sand layer detected in Layer {i+1} (friction angle = {phi}° < 30°).")
            if K > 3.0:
                warnings.append(f"Engineering Warning: Lateral coefficient K = {K} exceeds typical limit of 3.0 in Layer {i+1}.")
                
            ld = thickness / diameter
            if ld < 15:
                stress_bottom = float(raw.get("ovBottom", 0))
            else:
                bulk = float(raw.get("bulkUnit", 0))
                sub = float(raw.get("submergedUnit", 0))
                wt = float(raw.get("waterTableDepth", 0))

                # Water table intersection warning
                if 0 < wt < thickness:
                    warnings.append(f"Engineering Warning: Ground water table intersects the pile inside Layer {i+1} at depth {wt}m.")
                
                dry_depth = min(wt, thickness)
                wet_depth = thickness - dry_depth
                layer_contribution = bulk * dry_depth + sub * wet_depth
                stress_bottom = stress_top + layer_contribution
        else:
            stress_bottom = stress_top

        stress_points.append((current_depth + thickness, stress_bottom))
        current_depth += thickness

    # Slenderness ratio warning
    slenderness = current_depth / diameter
    if slenderness > 30.0:
        warnings.append(f"Engineering Warning: Pile slenderness ratio is unusually high (L/D = {slenderness:.1f} > 30).")

    # 4. Compute critical depth capping stress limit
    Dc = GeotechnicalConfig.CRITICAL_DEPTH_FACTOR * diameter
    critical_stress = get_uncapped_stress_at_depth(Dc, stress_points)

    if current_depth > Dc:
        warnings.append(f"Engineering Warning: Critical depth exceeded. Overburden stress capped beyond depth {Dc:.2f}m.")

    def get_capped_stress_at_depth(z: float) -> float:
        """Capped overburden pressure using Critical Depth method (IS 2911 B.1.2)"""
        return min(get_uncapped_stress_at_depth(z, stress_points), critical_stress)

    layer_results: List[LayerResult] = []
    total_qs = 0.0
    layer_z_top = 0.0
    
    # Formula traces if debug is enabled
    layer_traces = []

    # ── Process each layer for Shaft Resistance ─────────────────────────────
    for i, raw in enumerate(req.layers):
        soil_type = raw.get("soilType", "")
        thickness = float(raw.get("thickness", 0))
        layer_z_bottom = layer_z_top + thickness

        # Intermediate variables mapping
        avg_sigma = 0.0
        delta = None
        tan_delta = None

        if soil_type == "clay":
            try:
                layer = ClayLayer(**raw)
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Layer {i+1} (Clay) parsing: {e}")
            qs = calculate_clay_shaft(layer.alpha, layer.cohesion, perimeter, thickness)
            
            # Unit skin friction check
            unit_qs = qs / (perimeter * thickness) if thickness > 0 else 0.0
            if unit_qs > 150.0:
                warnings.append(f"Engineering Warning: Layer {i+1} unit skin friction stress ({unit_qs:.2f} kPa) exceeds typical limit of 150 kPa.")
            
            if req.debugEngineering:
                layer_traces.append({
                    "layer": i + 1,
                    "soilType": "clay",
                    "formula": "Qs = α * Cu * As",
                    "reference": explain_calculation("IS2911_P1S2_B22"),
                    "inputs": {"alpha": layer.alpha, "cohesion": layer.cohesion, "perimeter": round(perimeter, 4), "thickness": thickness, "As": round(perimeter * thickness, 4)},
                    "result": round(qs, 3)
                })

        elif soil_type == "sand":
            ld = thickness / diameter
            if ld < 15:
                try:
                    layer = SandLayerLDLow(**raw)
                except Exception as e:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D<15) parsing: {e}")
                avg_sigma = (layer.ovTop + layer.ovBottom) / 2.0
                qs = calculate_sand_shaft(layer.K, avg_sigma, layer.phi, perimeter, thickness)
                delta = GeotechnicalConfig.DEFAULT_DELTA_FACTOR * layer.phi
                tan_delta = math.tan(math.radians(delta))
            else:
                try:
                    layer = SandLayerLDHigh(**raw)
                except Exception as e:
                    raise HTTPException(status_code=422, detail=f"Layer {i+1} (Sand L/D>=15) parsing: {e}")
                sigma_top_capped = get_capped_stress_at_depth(layer_z_top)
                sigma_bottom_capped = get_capped_stress_at_depth(layer_z_bottom)
                avg_sigma = (sigma_top_capped + sigma_bottom_capped) / 2.0
                qs = calculate_sand_shaft(layer.K, avg_sigma, layer.phi, perimeter, thickness)
                delta = GeotechnicalConfig.DEFAULT_DELTA_FACTOR * layer.phi
                tan_delta = math.tan(math.radians(delta))
                
            # Unit skin friction check
            unit_qs = qs / (perimeter * thickness) if thickness > 0 else 0.0
            if unit_qs > 150.0:
                warnings.append(f"Engineering Warning: Layer {i+1} unit skin friction stress ({unit_qs:.2f} kPa) exceeds typical limit of 150 kPa.")
            
            if req.debugEngineering:
                layer_traces.append({
                    "layer": i + 1,
                    "soilType": "sand",
                    "formula": "Qs = K * σ'_v_avg * tan(δ) * As",
                    "reference": explain_calculation("IS2911_P1S2_B12_SHAFT"),
                    "inputs": {"K": layer.K, "avgOverburden": round(avg_sigma, 3), "phi": layer.phi, "delta": round(delta, 2), "tanDelta": round(tan_delta, 4), "As": round(perimeter * thickness, 4)},
                    "result": round(qs, 3)
                })
        else:
            raise HTTPException(status_code=422, detail=f"Layer {i+1}: Unknown soilType.")

        qs = round(qs, 3)
        total_qs += qs

        skin_clay = qs if soil_type == "clay" else 0.0
        skin_sand = qs if soil_type == "sand" else 0.0

        layer_results.append(
            LayerResult(
                layer=i + 1,
                soilType=soil_type,
                thickness=thickness,
                skinFrictionClay=skin_clay,
                skinFrictionSand=skin_sand,
                shaftResistance=qs,
                area=round(perimeter * thickness, 4),
                perimeter=round(perimeter, 4),
                avgEffectiveStress=round(avg_sigma, 3) if soil_type == "sand" else None,
                delta=round(delta, 2) if delta is not None else None,
                tanDelta=round(tan_delta, 4) if tan_delta is not None else None,
                depth=round(layer_z_bottom, 2),
                cumulativeShaftResistance=round(total_qs, 3),
            )
        )
        layer_z_top = layer_z_bottom

    # ── Tip bearing (Qp) ─────────────────────────────────────────────────────
    tip_raw = req.tip
    tip_type = tip_raw.get("soilType", "")
    
    computed_nq = None
    tip_overburden_val = None
    tip_trace = {}

    if tip_type == "clay":
        try:
            tip = ClayTip(**tip_raw)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Pile tip (Clay) parsing: {e}")
        qp = calculate_clay_tip(tip.cohesion, area)
        
        # Unit base resistance check
        unit_qp = qp / area if area > 0 else 0.0
        if unit_qp > 15000.0:
            warnings.append(f"Engineering Warning: Tip unit end bearing pressure ({unit_qp:.2f} kPa) exceeds typical limit of 15,000 kPa.")
            
        if req.debugEngineering:
            tip_trace = {
                "formula": "Qp = Nc * Cu * Ap",
                "reference": explain_calculation("IS2911_P1S2_B21"),
                "inputs": {"Nc": GeotechnicalConfig.SKEMPTON_NC, "cohesion": tip.cohesion, "Ap": round(area, 4)},
                "result": round(qp, 3)
            }

    elif tip_type == "sand":
        try:
            tip = SandTip(**tip_raw)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Pile tip (Sand) parsing: {e}")
        
        tip_overburden_val = tip.overburden
        computed_nq = tip.nq
        
        last_layer = req.layers[-1]
        phi_tip = float(last_layer.get("phi", 30))
        
        qp = calculate_sand_tip(tip_overburden_val, computed_nq, area)
        
        # Unit base resistance check
        unit_qp = qp / area if area > 0 else 0.0
        if unit_qp > 15000.0:
            warnings.append(f"Engineering Warning: Tip unit end bearing pressure ({unit_qp:.2f} kPa) exceeds typical limit of 15,000 kPa.")
            
        if req.debugEngineering:
            tip_trace = {
                "formula": "Qp = overburden_tip * Nq * Ap",
                "reference": "User-defined manual end bearing design values",
                "inputs": {"userEffectiveOverburden": round(tip_overburden_val, 3), "userNq": round(computed_nq, 4), "Ap": round(area, 4)},
                "result": round(qp, 3)
            }
    else:
        raise HTTPException(status_code=422, detail=f"Tip: Unknown soilType.")

    qp = round(qp, 3)
    qu = round(total_qs + qp, 3)
    qa = round(calculate_allowable_capacity(qu, GeotechnicalConfig.FACTOR_OF_SAFETY), 3)

    # 5. Physical Reasonableness Checks
    if qa > qu:
        warnings.append("Internal Capacity Check: Allowable capacity Qa is larger than Ultimate capacity Qu. (unphysical)")
    if qu < qp:
        warnings.append("Internal Capacity Check: Ultimate capacity Qu is less than End Bearing Qp. (unphysical)")
    if total_qs < 0:
        warnings.append("Engineering Warning: Calculated total shaft resistance Qs is negative.")
    if any(pt[1] < 0 for pt in stress_points):
        warnings.append("Engineering Warning: Negative effective overburden stress detected.")

    # 6. Structured console logging
    calc_time_ms = (time.perf_counter() - start_time) * 1000.0
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    uncapped_stress = get_uncapped_stress_at_depth(current_depth, stress_points)
    capped_stress = get_capped_stress_at_depth(current_depth)
    
    print(f"[{now_str}] PILE CAPACITY CALCULATION LOG:")
    print(f"  Pile Diameter:          {diameter} m")
    print(f"  Pile Radius:            {diameter / 2.0} m")
    print(f"  Tip Area (Ap):          {area:.6f} sq.m")
    print(f"  Tip Depth:              {current_depth} m")
    print(f"  Critical Depth (Dc):    {Dc} m")
    print(f"  Uncapped Stress at Tip: {uncapped_stress:.3f} kPa")
    print(f"  Capped Stress at Tip:   {capped_stress:.3f} kPa")
    if tip_type == "sand":
        print(f"  Friction Angle (phi):   {phi_tip} deg")
        print(f"  Calculated Nq:          {computed_nq:.4f}")
        print(f"  Nq Formula Used:        Nq = exp(pi*tan(phi)) * tan2(45 + phi/2)")
        print(f"  Qp Formula Used:        Qp = overburden_tip * Nq * Ap")
    else:
        print(f"  Cohesion at Tip (Cu):   {tip.cohesion} kPa")
        print(f"  Qp Formula Used:        Qp = Nc * Cu * Ap (Nc = {GeotechnicalConfig.SKEMPTON_NC})")
    print(f"  Final End Bearing Qp:   {qp:.3f} kN")
    print(f"  Skin Friction Qs:       {total_qs:.3f} kN")
    print(f"  Ultimate Capacity Qu:   {qu:.3f} kN")
    print(f"  Allowable Capacity Qa:  {qa:.3f} kN")
    print(f"  Execution Time:         {calc_time_ms:.2f} ms")
    print("-" * 80)

    # Build intermediateCalculations dict for response
    intermediate_calc = {
        "pilePerimeter": round(perimeter, 4),
        "pileTipArea": round(area, 4),
        "criticalDepth": round(Dc, 2),
        "criticalStress": round(critical_stress, 3),
        "calculationTimeMs": round(calc_time_ms, 2)
    }
    if computed_nq is not None:
        intermediate_calc["calculatedNq"] = round(computed_nq, 4)
    if tip_overburden_val is not None:
        intermediate_calc["tipEffectiveOverburden"] = round(tip_overburden_val, 3)

    # Return ordered calculation history (Step 3)
    if req.debugEngineering:
        history = [
            {"step": 1, "action": "Calculate pile perimeter", "formula": "C = π * D", "result": round(perimeter, 4), "unit": "m"},
            {"step": 2, "action": "Calculate pile cross-sectional base area", "formula": "Ap = π * D² / 4", "result": round(area, 4), "unit": "m²"},
            {"step": 3, "action": "Evaluate layer-by-layer shaft skin friction Qs", "layerTraces": layer_traces, "totalQs": round(total_qs, 3), "unit": "kN"},
            {"step": 4, "action": "Evaluate tip end bearing capacity Qp", "trace": tip_trace, "totalQp": round(qp, 3), "unit": "kN"},
            {"step": 5, "action": "Sum skin friction and base resistance to find ultimate capacity", "formula": "Qu = ΣQs + Qp", "result": round(qu, 3), "unit": "kN"},
            {"step": 6, "action": "Apply factor of safety to find allowable capacity", "formula": "Qa = Qu / FS", "result": round(qa, 3), "unit": "kN"}
        ]
        intermediate_calc["calculationSequenceHistory"] = history

    # Build designSummary dict
    summary_obj = DesignSummary(
        assumptions=[
            "Homogeneous soil conditions within each defined soil layer.",
            "Static vertical axial loading conditions only; dynamic/seismic effects are ignored.",
            "Vertical bored cast-in-situ concrete pile profile.",
            "Single isolated pile capacity; group efficiencies are ignored.",
            "Negative skin friction (downdrag forces) is not considered.",
            "Settlement and differential settlement analysis is not included."
        ],
        references=[
            "IS 2911 (Part 1/Section 2) for general bored concrete pile formulas.",
            "Reissner (1924) & Vesic (1973) bearing capacity factor Nq formula.",
            "Tomlinson's interface friction δ = 0.75φ correlation for concrete piles in sand."
        ],
        limitations=[
            "This software is intended for preliminary geotechnical design and educational purposes.",
            "Final foundation design should always be verified using detailed site investigation and applicable standards.",
            "Capacity calculations do not replace the necessity of routine static pile load tests on site."
        ],
        disclaimer="The software is intended for preliminary geotechnical design and educational purposes. Final foundation design should always be verified using detailed site investigation, applicable design standards, and the judgment of a qualified geotechnical engineer."
    )

    return CalculateResponse(
        layerResults=layer_results,
        Qp=qp,
        Qu=qu,
        Qa=qa,
        warnings=warnings,
        intermediateCalculations=intermediate_calc,
    )


# ─── Safe Bearing Capacity (IS 6403:1981) Endpoint ───────────────────────────

@app.post("/sbc/calculate", response_model=SbcResponse, summary="Calculate safe bearing capacity (IS 6403)")
def calculate_sbc_route(req: SbcRequest):
    return calculate_sbc(req)

# ─── Include Footing Router ───
app.include_router(footing.router)

# ─── Include Soil Router ───
app.include_router(soil.router)

# ─── Include Under-Reamed Router ───
app.include_router(under_reamed.router)

# ─── Include Projects Router ───
app.include_router(projects.router)

# ─── Include Boreholes Router ───
app.include_router(boreholes.router)

# ─── Include Foundation Engineering Module Routers ───
app.include_router(spt_soil.router)
app.include_router(adhesion_factor.router)
app.include_router(nq.router)


