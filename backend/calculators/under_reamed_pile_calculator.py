import math
from schemas.under_reamed import UnderReamedRequest, UnderReamedResponse, UnderReamedGeometry, UnderReamedCapacity

def calculate_under_reamed_pile(req: UnderReamedRequest) -> UnderReamedResponse:
    D = req.D
    Cp = req.Cp
    Ca_dash = req.Ca_dash
    Ca = req.Ca

    Du = 2.5 * D
    Ap = (math.pi * D * D) / 4
    Nc = 9.0

    Aa = (math.pi * (Du * Du - D * D)) / 4

    L1 = 1.5 * Du
    formula_used = f"L1 = 1.5 * Du (since D = {D:.3f} m <= 0.30 m)"
    if D > 0.3:
        L1 = 1.25 * Du
        formula_used = f"L1 = 1.25 * Du (since D = {D:.3f} m > 0.30 m)"

    AB_dash = math.pi * Du * L1

    alpha = req.alpha if req.alpha is not None else 0.5

    l = max(2 * Du, 1.75)
    l2 = l - 2 * D

    As = math.pi * D * l2

    Qu = (Ap * Nc * Cp) + (Aa * Nc * Ca_dash) + (Ca_dash * AB_dash) + (alpha * Ca * As)

    FS = 2.5
    Qa = Qu / FS

    le = 0.3
    Ase = math.pi * D * le

    sf_additional = Ase * alpha * Cp

    Qa_total = (Qu + sf_additional) / FS
    Qa_increase = Qa_total - Qa

    geometry = UnderReamedGeometry(
        Du=round(Du, 4),
        Ap=round(Ap, 4),
        Aa=round(Aa, 4),
        L1=round(L1, 4),
        AB_dash=round(AB_dash, 4),
        l=round(l, 4),
        l2=round(l2, 4),
        As=round(As, 4),
        Ase=round(Ase, 4)
    )

    capacity = UnderReamedCapacity(
        Qu=round(Qu, 2),
        Qa=round(Qa, 2),
        additionalShaftFriction=round(sf_additional, 2),
        Qa_total=round(Qa_total, 2),
        Qa_increase=round(Qa_increase, 2)
    )

    engineering_notes = {
        "bearingCapacityFactorNc": Nc,
        "adhesionFactorAlpha": alpha,
        "factorOfSafetyFS": FS,
        "bulbHeightFormula": formula_used,
        "criticalLengthL": round(l, 4),
        "shaftExtensionLe": le
    }

    inputs = {
        "trialPit": req.trialPit,
        "D": round(D, 3),
        "Cp": round(Cp, 2),
        "Ca_dash": round(Ca_dash, 2),
        "Ca": round(Ca, 2)
    }

    return UnderReamedResponse(
        inputs=inputs,
        geometry=geometry,
        capacity=capacity,
        engineeringNotes=engineering_notes
    )
