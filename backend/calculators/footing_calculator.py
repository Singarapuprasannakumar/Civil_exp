from schemas.footing import FootingRequest, FootingResponse, FootingCorrectionFactors, FootingResults

def calculate_footing(req: FootingRequest) -> FootingResponse:
    D = req.D
    B = req.B
    S = req.S
    N2 = req.N2
    Zw2 = req.Zw2
    foundation_type = req.foundationType

    # Cd calculation
    Cd = 1.0 + (D / B)
    if Cd > 2.0:
        Cd = 2.0

    # Rw2 calculation
    Rw2 = 0.5 * (1.0 + Zw2 / B)
    if Rw2 < 0.5:
        Rw2 = 0.5
    elif Rw2 > 1.0:
        Rw2 = 1.0

    # Net Safe Bearing Pressure calculation
    if foundation_type == "isolated":
        qns = 1.40 * (N2 - 3.0) * (((B + 0.3) / (2.0 * B)) ** 2) * Rw2 * Cd * S
    elif foundation_type == "raft":
        qns = 0.7 * (N2 - 3.0) * Rw2 * Cd * S
    else:
        raise ValueError("Invalid foundation type. Must be 'isolated' or 'raft'.")

    return FootingResponse(
        inputs={
            "trialPit": req.trialPit,
            "foundationType": foundation_type,
            "D": D,
            "B": B,
            "S": S,
            "N2": N2,
            "Zw2": Zw2
        },
        correctionFactors=FootingCorrectionFactors(
            Cd=round(Cd, 3),
            Rw2=round(Rw2, 3)
        ),
        results=FootingResults(
            netSafeBearingPressure=round(qns, 2)
        )
    )
