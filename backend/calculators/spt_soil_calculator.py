import math

def get_clay_properties(N):
    """
    Determine qu and cohesion for clays based on SPT N-value.
    Returns: (consistency, qu_value, cohesion_value, recommendation)
    """
    ranges = [
        (0, 2),      # Very soft
        (2.01, 4),   # Soft
        (4.01, 8),   # Medium
        (8.01, 15),  # Stiff
        (15.01, 30), # Very stiff
        (30.01, 50)  # Hard
    ]
    
    qu_values = [
        (0, 25),
        (25, 50),
        (50, 100),
        (100, 200),
        (200, 400),
        (400, 500)
    ]
    
    consistencies = [
        "Very soft",
        "Soft",
        "Medium",
        "Stiff",
        "Very stiff",
        "Hard"
    ]
    
    consistency = None
    qu = 0.0
    
    for i, (n_low, n_high) in enumerate(ranges):
        if n_low <= N <= n_high:
            consistency = consistencies[i]
            if n_high == n_low:
                qu = qu_values[i][0]
            else:
                fraction = (N - n_low) / (n_high - n_low)
                qu = qu_values[i][0] + fraction * (qu_values[i][1] - qu_values[i][0])
            break
            
    # Handle N outside ranges
    if N < 0:
        consistency = "Below range"
        qu = 0
    elif N > 50:
        consistency = "Hard"
        qu = 500 + (N - 50) * 5
    
    cohesion = qu / 2

    # Recommendations
    rec = ""
    if qu < 25:
        rec = "Very soft clay - low bearing capacity. Recommendation: Deep foundation or soil improvement needed."
    elif qu < 50:
        rec = "Soft clay - moderate bearing capacity. Recommendation: Consider shallow foundation with caution."
    elif qu < 100:
        rec = "Medium clay - fair bearing capacity. Recommendation: Suitable for shallow foundations."
    elif qu < 200:
        rec = "Stiff clay - good bearing capacity. Recommendation: Good for shallow foundations."
    elif qu < 400:
        rec = "Very stiff clay - high bearing capacity. Recommendation: Excellent for foundations."
    else:
        rec = "Hard clay - very high bearing capacity. Recommendation: Ideal for all types of foundations."
        
    return consistency, round(qu, 2), round(cohesion, 2), rec


def get_sand_phi_meyerhof(N):
    if N <= 4:
        phi = 28 + (N / 4) * 2
    else:
        phi = 25 + 0.15 * N
    return round(phi, 2)

def get_sand_phi_peck(N):
    if N < 0:
        return 28
    elif N < 50:
        phi = 27.1 + 0.3 * N - 0.00054 * N * N
        return round(phi, 2)
    else:
        phi = 27.1 + 0.3 * 50 - 0.00054 * 2500 + (N - 50) * 0.1
        return round(min(phi, 45), 2)

def get_sand_phi_dunham(N):
    if N < 0:
        return 28
    else:
        phi = 28 + 0.36 * N
        return round(min(phi, 48), 2)

def get_sand_phi_hatanaka(N):
    if N < 0:
        return 28
    else:
        phi = math.sqrt(20 * N) + 20
        return round(min(phi, 50), 2)

def get_sand_phi_interpolated(N):
    ranges = [
        (0, 4),      # Very loose
        (4.01, 10),  # Loose
        (10.01, 30), # Medium
        (30.01, 50), # Dense
        (50.01, 100) # Very dense
    ]
    phi_values = [
        (28, 30),
        (30, 34),
        (34, 38),
        (38, 42),
        (42, 46)
    ]
    for i, (n_low, n_high) in enumerate(ranges):
        if n_low <= N <= n_high:
            if n_high == n_low:
                phi = phi_values[i][0]
            else:
                fraction = (N - n_low) / (n_high - n_low)
                phi = phi_values[i][0] + fraction * (phi_values[i][1] - phi_values[i][0])
            return round(phi, 2)
    
    if N < 0:
        return 28
    elif N > 100:
        phi = 46 + (N - 100) * 0.05
        return round(min(phi, 50), 2)
    return None

def get_sand_density(N):
    if N <= 4:
        return "Very loose"
    elif 4 < N <= 10:
        return "Loose"
    elif 10 < N <= 30:
        return "Medium dense"
    elif 30 < N <= 50:
        return "Dense"
    else:
        return "Very dense"
