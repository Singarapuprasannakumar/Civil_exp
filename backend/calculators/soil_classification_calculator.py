from typing import Dict, Any, Optional
from schemas.soil import SoilRequest, SoilResponse

SOIL_PROPERTIES_DATABASE = {
    "GW": {
        "Permeability_when_Compacted": "Pervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Excellent",
        "Compressibility_when_Compacted_and_Saturated": "Negligible",
        "Workability_as_Construction_Matterial": "Excellent",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "1",
        "Foundations-Seepage_important": "1",
        "Foundations-Seepage_not_important": "1",
        "Roadways_Surfacing": "–"
    },
    "GP": {
        "Permeability_when_Compacted": "Very pervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Good",
        "Compressibility_when_Compacted_and_Saturated": "Negligible",
        "Workability_as_Construction_Matterial": "Good",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "2",
        "Foundations-Seepage_important": "2",
        "Foundations-Seepage_not_important": "2",
        "Roadways_Surfacing": "–"
    },
    "GM": {
        "Permeability_when_Compacted": "Semipervious to impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Good",
        "Compressibility_when_Compacted_and_Saturated": "Negligible",
        "Workability_as_Construction_Matterial": "Good",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "4",
        "Rolled_Earth_Dams_core": "4",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "4",
        "Foundations-Seepage_not_important": "4",
        "Roadways_Surfacing": "–"
    },
    "GC": {
        "Permeability_when_Compacted": "Impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Good to fair",
        "Compressibility_when_Compacted_and_Saturated": "Very low",
        "Workability_as_Construction_Matterial": "Good to fair",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "1",
        "Rolled_Earth_Dams_core": "1",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "1",
        "Foundations-Seepage_not_important": "1",
        "Roadways_Surfacing": "Good"
    },
    "SW": {
        "Permeability_when_Compacted": "Pervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Excellent",
        "Compressibility_when_Compacted_and_Saturated": "Negligible",
        "Workability_as_Construction_Matterial": "Excellent",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "2",
        "Foundations-Seepage_important": "3",
        "Foundations-Seepage_not_important": "3",
        "Roadways_Surfacing": "–"
    },
    "SP": {
        "Permeability_when_Compacted": "Pervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Good",
        "Compressibility_when_Compacted_and_Saturated": "Negligible",
        "Workability_as_Construction_Matterial": "Good",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "3",
        "Foundations-Seepage_important": "5",
        "Foundations-Seepage_not_important": "4",
        "Roadways_Surfacing": "–"
    },
    "SM": {
        "Permeability_when_Compacted": "Semipervious to impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Good",
        "Compressibility_when_Compacted_and_Saturated": "Negligible",
        "Workability_as_Construction_Matterial": "Good",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "5",
        "Rolled_Earth_Dams_core": "3",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "5",
        "Foundations-Seepage_not_important": "4",
        "Roadways_Surfacing": "–"
    },
    "SC": {
        "Permeability_when_Compacted": "Impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Good to fair",
        "Compressibility_when_Compacted_and_Saturated": "Very low",
        "Workability_as_Construction_Matterial": "Good to fair",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "2",
        "Rolled_Earth_Dams_core": "2",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "2",
        "Foundations-Seepage_not_important": "2",
        "Roadways_Surfacing": "Fair to Good"
    },
    "ML": {
        "Permeability_when_Compacted": "Semipervious to impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Fair",
        "Compressibility_when_Compacted_and_Saturated": "Low",
        "Workability_as_Construction_Matterial": "Fair",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "6",
        "Rolled_Earth_Dams_core": "6",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "6",
        "Foundations-Seepage_not_important": "5",
        "Roadways_Surfacing": "Poor"
    },
    "ML (or) OL": {
        "Permeability_when_Compacted": "Semipervious to impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Fair to poor",
        "Compressibility_when_Compacted_and_Saturated": "Low to medium",
        "Workability_as_Construction_Matterial": "Fair to poor",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "–",
        "Foundations-Seepage_not_important": "–",
        "Roadways_Surfacing": "Not suitable"
    },
    "CL": {
        "Permeability_when_Compacted": "Impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Fair",
        "Compressibility_when_Compacted_and_Saturated": "Medium",
        "Workability_as_Construction_Matterial": "Good to fair",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "3",
        "Rolled_Earth_Dams_core": "3",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "3",
        "Foundations-Seepage_not_important": "3",
        "Roadways_Surfacing": "Fair"
    },
    "CL-ML": {
        "Permeability_when_Compacted": "Impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Fair",
        "Compressibility_when_Compacted_and_Saturated": "Low to medium",
        "Workability_as_Construction_Matterial": "Good to fair",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "3",
        "Rolled_Earth_Dams_core": "3",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "3",
        "Foundations-Seepage_not_important": "3",
        "Roadways_Surfacing": "Fair"
    },
    "CI": {
        "Permeability_when_Compacted": "Impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Fair",
        "Compressibility_when_Compacted_and_Saturated": "Medium",
        "Workability_as_Construction_Matterial": "Fair",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "3",
        "Rolled_Earth_Dams_core": "3",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "3",
        "Foundations-Seepage_not_important": "3",
        "Roadways_Surfacing": "Fair"
    },
    "MI (or) OI": {
        "Permeability_when_Compacted": "Impervious to semipervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Poor",
        "Compressibility_when_Compacted_and_Saturated": "Medium to high",
        "Workability_as_Construction_Matterial": "Poor",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "–",
        "Foundations-Seepage_not_important": "–",
        "Roadways_Surfacing": "Not suitable"
    },
    "CH": {
        "Permeability_when_Compacted": "Impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Poor",
        "Compressibility_when_Compacted_and_Saturated": "High",
        "Workability_as_Construction_Matterial": "Poor",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "5",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "5",
        "Foundations-Seepage_not_important": "5",
        "Roadways_Surfacing": "Poor"
    },
    "MH (or) OH": {
        "Permeability_when_Compacted": "Semipervious to impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Poor",
        "Compressibility_when_Compacted_and_Saturated": "High",
        "Workability_as_Construction_Matterial": "Poor",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "–",
        "Foundations-Seepage_not_important": "–",
        "Roadways_Surfacing": "Not suitable"
    },
    "OL": {
        "Permeability_when_Compacted": "Semipervious to impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Poor",
        "Compressibility_when_Compacted_and_Saturated": "Medium",
        "Workability_as_Construction_Matterial": "Poor",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "–",
        "Foundations-Seepage_not_important": "–",
        "Roadways_Surfacing": "Not suitable"
    },
    "OH": {
        "Permeability_when_Compacted": "Impervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Poor",
        "Compressibility_when_Compacted_and_Saturated": "High",
        "Workability_as_Construction_Matterial": "Poor",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "–",
        "Foundations-Seepage_not_important": "–",
        "Roadways_Surfacing": "Not suitable"
    },
    "Pt": {
        "Permeability_when_Compacted": "Pervious",
        "Shearing_Strength_when_Compacted_and_Saturated": "Very poor",
        "Compressibility_when_Compacted_and_Saturated": "Very high",
        "Workability_as_Construction_Matterial": "Poor",
        "Rolled_Earth_Dams_Homogeneous_Embankment(1-14)": "–",
        "Rolled_Earth_Dams_core": "–",
        "Rolled_Earth_Dams_shell": "–",
        "Foundations-Seepage_important": "–",
        "Foundations-Seepage_not_important": "–",
        "Roadways_Surfacing": "Not suitable"
    }
}

def get_engineering_properties(symbol: str) -> Dict[str, str]:
    if symbol in SOIL_PROPERTIES_DATABASE:
        return SOIL_PROPERTIES_DATABASE[symbol]
    
    if "-" in symbol:
        parts = symbol.split("-")
        p1 = SOIL_PROPERTIES_DATABASE.get(parts[0], {})
        p2 = SOIL_PROPERTIES_DATABASE.get(parts[1], {})
        
        combined = {}
        for key in SOIL_PROPERTIES_DATABASE["GW"].keys():
            val1 = p1.get(key, "–")
            val2 = p2.get(key, "–")
            if val1 == val2:
                combined[key] = val1
            else:
                combined[key] = f"{val1} to {val2}" if val1 != "–" and val2 != "–" else (val1 if val1 != "–" else val2)
        return combined
        
    return {k: "–" for k in SOIL_PROPERTIES_DATABASE["GW"].keys()}

def coarse_grained_category_1(fines: float, gravel: float, sand: float, cu: float = 5.0, cc: float = 2.0) -> str:
    """Category-1: fines < 5%"""
    if gravel >= sand:
        if 4 <= cu <= 6:
            if 1 <= cc <= 3:
                return "GW"
            else:
                return "GP"
        else:
            return "GP"
    else:  # sand > gravel
        if cu >= 6:
            if 1 <= cc <= 3:
                return "SW"
            else:
                return "SP"
        else:
            return "SP"

def coarse_grained_category_2(fines: float, gravel: float, sand: float, wl: float, wp: float) -> str:
    """Category-2: fines > 12%"""
    Ip = 0.73 * (wl - 20)
    Ip1 = wl - wp
    difIp = Ip1 - Ip
    
    if gravel >= sand:
        if Ip > 7 and difIp > 0:
            return "GC"
        else:
            return "GM"
    else:  # sand > gravel
        if Ip > 7 and difIp > 0:
            return "SC"
        else:
            return "SM"

def coarse_grained_category_3(fines: float, gravel: float, sand: float, cu: float, cc: float, wl: float, wp: float) -> str:
    """Category-3: 5% <= fines <= 12%"""
    Ip = 0.73 * (wl - 20)
    Ip1 = wl - wp
    difIp = Ip1 - Ip
    
    if gravel >= sand:
        is_well = (cu > 4) and (1 <= cc <= 3)
        if is_well:
            return "GW-GC" if difIp > 0 else "GW-GM"
        else:
            return "GP-GC" if difIp > 0 else "GP-GM"
    else:  # sand > gravel
        is_well = (cu > 6) and (1 <= cc <= 3)
        if is_well:
            return "SW-SC" if difIp > 0 else "SW-SM"
        else:
            return "SP-SC" if difIp > 0 else "SP-SM"

def fine_grained_classification(wl: float, wp: float) -> str:
    """Fine-grained classification"""
    Ip = 0.73 * (wl - 20)
    Ip1 = wl - wp
    difIp = Ip1 - Ip
    
    if wl > 50:
        if difIp > 0:
            return "CH"
        else:
            return "MH (or) OH"
    elif 35 < wl <= 50:
        if difIp > 0:
            return "CI"
        else:
            return "MI (or) OI"
    elif 10.0 <= wl <= 25.48:
        if 4 <= Ip1 <= 7:
            return "CL-ML"
        else:
            return "CL" if difIp > 0 else "ML (or) OL"
    elif 25.48 < wl <= 29.59:
        if difIp > 0 and Ip1 <= 7:
            return "CL-ML"
        else:
            return "CL" if difIp > 0 else "ML (or) OL"
    else:
        if difIp > 0:
            return "CL"
        else:
            return "ML (or) OL"

def classify_soil(req: SoilRequest) -> Dict[str, Any]:
    fines = req.fines
    wl = req.wl
    wp = req.wp
    cu = req.cu
    cc = req.cc
    
    inputs_echo = {
        "fines": fines,
        "gravel": req.gravel,
        "wl": wl,
        "wp": wp,
        "cu": cu,
        "cc": cc
    }
    
    if fines < 50:
        soil_type = "Coarse-Grained Soil"
        gravel = req.gravel if req.gravel is not None else 0.0
        sand = max(0.0, 100.0 - fines - gravel)
        inputs_echo["gravel"] = gravel
        inputs_echo["sand"] = sand
        
        if fines < 5:
            # Cu and Cc might not be provided in UI, default to standard values to run
            cu_val = cu if cu is not None else 5.0
            cc_val = cc if cc is not None else 2.0
            symbol = coarse_grained_category_1(fines, gravel, sand, cu_val, cc_val)
            category = "Coarse soil, fines < 5%"
        elif fines > 12:
            wl_val = wl if wl is not None else 0.0
            wp_val = wp if wp is not None else 0.0
            symbol = coarse_grained_category_2(fines, gravel, sand, wl_val, wp_val)
            category = "Coarse soil, fines > 12%"
        else:
            cu_val = cu if cu is not None else 5.0
            cc_val = cc if cc is not None else 2.0
            wl_val = wl if wl is not None else 0.0
            wp_val = wp if wp is not None else 0.0
            symbol = coarse_grained_category_3(fines, gravel, sand, cu_val, cc_val, wl_val, wp_val)
            category = "Coarse soil, 5% ≤ fines ≤ 12%"
    else:
        soil_type = "Fine-Grained Soil"
        wl_val = wl if wl is not None else 0.0
        wp_val = wp if wp is not None else 0.0
        symbol = fine_grained_classification(wl_val, wp_val)
        category = "Fine soil, fines ≥ 50%"
        
    properties = get_engineering_properties(symbol)
    
    # Calculate plasticity index if wl and wp exist
    pi_val = None
    if wl is not None and wp is not None:
        pi_val = max(0.0, wl - wp)
        
    notes = {
        "classificationMethod": "IS 1498:1970 / USCS standard",
        "isClassification": f"Group Symbol: {symbol}",
        "soilCategory": category,
        "plasticity": f"PI = {pi_val:.1f}%" if pi_val is not None else "Non-plastic",
        "recommendedApplications": f"Suitability ratings: core={properties.get('Rolled_Earth_Dams_core', '–')}, shell={properties.get('Rolled_Earth_Dams_shell', '–')}",
        "remarks": f"Soil classified as {symbol} ({soil_type}) based on fine fraction of {fines:.1f}%."
    }
    
    return {
        "inputs": inputs_echo,
        "soilType": soil_type,
        "groupSymbol": symbol,
        "engineeringProperties": properties,
        "notes": notes
    }
