from fastapi import APIRouter
from schemas.spt_soil import (
    SptSoilRequest, SptSoilResponse, SptClayResponse, 
    SptSandResponse, SptPhiEstimate
)
from calculators.spt_soil_calculator import (
    get_clay_properties,
    get_sand_phi_interpolated,
    get_sand_phi_peck,
    get_sand_phi_meyerhof,
    get_sand_phi_dunham,
    get_sand_phi_hatanaka,
    get_sand_density
)

router = APIRouter(prefix="/spt-soil", tags=["Foundation Engineering"])

@router.post("/calculate", response_model=SptSoilResponse)
def calculate_spt_properties(req: SptSoilRequest):
    if req.soilType == "clay":
        consistency, qu, cohesion, rec = get_clay_properties(req.nValue)
        data = SptClayResponse(
            soilType="clay",
            nValue=req.nValue,
            consistency=consistency or "Unknown",
            qu=qu,
            cohesion=cohesion,
            recommendation=rec
        )
        return SptSoilResponse(data=data)
    else:
        # Sand
        N = req.nValue
        density = get_sand_density(N)
        
        phi_interp = get_sand_phi_interpolated(N)
        phi_peck = get_sand_phi_peck(N)
        phi_meyerhof = get_sand_phi_meyerhof(N)
        phi_dunham = get_sand_phi_dunham(N)
        phi_hatanaka = get_sand_phi_hatanaka(N)
        
        estimates = []
        if phi_interp is not None:
            estimates.append(SptPhiEstimate(method="Interpolated", formula="Table lookup", phi=phi_interp))
        if phi_peck is not None:
            estimates.append(SptPhiEstimate(method="Peck et al. (1974)", formula="φ = 27.1 + 0.3N - 0.00054N²", phi=phi_peck))
        if phi_meyerhof is not None:
            estimates.append(SptPhiEstimate(method="Meyerhof (1956)", formula="φ = 25 + 0.15N", phi=phi_meyerhof))
        if phi_dunham is not None:
            estimates.append(SptPhiEstimate(method="Dunham (1954)", formula="φ = 28 + 0.36N", phi=phi_dunham))
        if phi_hatanaka is not None:
            estimates.append(SptPhiEstimate(method="Hatanaka & Uchida (1996)", formula="φ = √(20N) + 20", phi=phi_hatanaka))
            
        phi_values = [p.phi for p in estimates]
        
        if not phi_values:
            phi_values = [28.0]
            
        phi_avg = sum(phi_values) / len(phi_values)
        phi_conservative = min(phi_values)
        
        rec = ""
        if phi_conservative < 30:
            rec = "Loose sand - low shear strength. Recommendation: Compaction or deep foundation needed."
        elif phi_conservative < 34:
            rec = "Loose to medium sand. Recommendation: Consider compaction before construction."
        elif phi_conservative < 38:
            rec = "Medium dense sand - good shear strength. Recommendation: Suitable for most foundations."
        elif phi_conservative < 42:
            rec = "Dense sand - high shear strength. Recommendation: Excellent for foundations."
        else:
            rec = "Very dense sand - very high shear strength. Recommendation: Ideal for all types of foundations."
            
        data = SptSandResponse(
            soilType="sand",
            nValue=req.nValue,
            relativeDensity=density,
            phiEstimates=estimates,
            averagePhi=round(phi_avg, 2),
            conservativePhi=phi_conservative,
            minPhi=min(phi_values),
            maxPhi=max(phi_values),
            recommendation=rec
        )
        return SptSoilResponse(data=data)
