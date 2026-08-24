import math
from schemas.sbc import SbcRequest, SbcResponse, SbcBearingFactors, SbcCorrectionFactors, SbcResults

def calculate_sbc(req: SbcRequest) -> SbcResponse:
    MAX = 180
    E = 2.72
    
    cohesion = req.cohesion
    phi = req.phi
    D = req.D
    B = req.B
    L = req.L
    wt = req.wt
    footing_type = req.footingType
    failure = 2 if req.failureType == "local" else 1
    gamma = req.gamma
    gamma_sub = req.gammaSub
    alpha = req.alpha
    FS = req.FS

    z1 = math.pi / MAX

    if failure == 2:
        cohesion = 2.0 * cohesion / 3.0
        temp = 0.67 * phi * z1
        phi = math.atan(temp) / z1

    x = (math.pi / MAX) * phi

    k = math.tan(45.0 * z1 + x / 2.0)
    k1 = math.pi * math.tan(x)

    Nq = (k ** 2) * (E ** k1)

    if phi == 0:
        Nc = 5.14
        Nq = 1.0
        Nr = 0.0
    else:
        Nc = (Nq - 1.0) / math.tan(x)
        Nr = 2.0 * (Nq + 1.0) * math.tan(x)

    if wt <= D:
        q = gamma * wt + gamma_sub * (D - wt)
        Rw2 = 0.5
    elif D < wt < (D + B):
        q = gamma * D
        Rw2 = 0.5 * (1.0 + (wt - D) / B)
    else:
        q = gamma * D
        Rw2 = 1.0

    Nphi = k ** 2

    dc = 1.0 + (0.2 * D / B) * math.sqrt(Nphi)

    if phi < 10.0:
        dq = 1.0
        dr = 1.0
    else:
        dq = 1.0 + (0.1 * D / B) * math.sqrt(Nphi)
        dr = dq

    s1 = 1.0 - (alpha / 90.0)

    ic = s1 ** 2
    iq = ic

    if phi == 0:
        ir = 1.0
    else:
        s2 = 1.0 - (alpha / phi) if phi > 0 else 1.0
        ir = (s2 ** 2) if s2 >= 0 else 0.0

    if footing_type == "square":
        sc = 1.3
        sq = 1.2
        sr = 0.8
    elif footing_type == "rectangular":
        sc = 1.0 + (0.2 * B / L)
        sq = 1.0 + (0.2 * B / L)
        sr = 1.0 - (0.4 * B / L)
    elif footing_type == "circular":
        sc = 1.3
        sq = 1.2
        sr = 0.6
    else: # strip
        sc = 1.0
        sq = 1.0
        sr = 1.0

    qnu = (
        cohesion * Nc * sc * dc * ic
        + q * (Nq - 1.0) * sq * dq * iq
        + 0.5 * gamma * B * Nr * Rw2
    )

    qs = (qnu / FS) + q
    qs_ton = qs / 9.81

    # Keep track of the original input params
    inputs_dict = {
        "trialPit": req.trialPit,
        "cohesion": req.cohesion,
        "phi": req.phi,
        "D": req.D,
        "B": req.B,
        "L": req.L,
        "wt": req.wt,
        "footingType": footing_type,
        "failureType": req.failureType,
        "gamma": req.gamma,
        "gammaSub": req.gammaSub,
        "alpha": req.alpha,
        "FS": req.FS
    }

    return SbcResponse(
        inputs=inputs_dict,
        bearingFactors=SbcBearingFactors(Nc=Nc, Nq=Nq, Nr=Nr),
        correctionFactors=SbcCorrectionFactors(dc=dc, dq=dq, dr=dr, sc=sc, sq=sq, sr=sr, Rw2=Rw2),
        results=SbcResults(ultimateBearingCapacity=qnu, safeBearingCapacity=qs, safeBearingCapacityTon=qs_ton)
    )
