import numpy as np
from scipy.interpolate import interp1d

class AdhesionFactorCalculator:
    def __init__(self):
        self.cohesion_values = np.array([0, 25, 50, 75, 100, 125, 150])
        self.alpha_concrete = np.array([1.00, 0.85, 0.70, 0.55, 0.40, 0.25, 0.10])
        self.alpha_all = np.array([1.00, 0.75, 0.55, 0.40, 0.28, 0.18, 0.10])
        
        self.interp_concrete = interp1d(self.cohesion_values, self.alpha_concrete, 
                                        kind='cubic', fill_value='extrapolate')
        self.interp_all = interp1d(self.cohesion_values, self.alpha_all, 
                                   kind='cubic', fill_value='extrapolate')
    
    def get_alpha(self, cohesion, pile_type='concrete'):
        out_of_range = False
        warning_msg = None
        
        if cohesion < 0:
            cohesion = abs(cohesion)
            
        if cohesion > 150:
            out_of_range = True
            warning_msg = f"Cohesion = {cohesion:.1f} kPa is beyond the graph range (0-150 kPa). Extrapolation was used."
            
        if pile_type.lower() == 'concrete':
            alpha = float(self.interp_concrete(cohesion))
        elif pile_type.lower() == 'all':
            alpha = float(self.interp_all(cohesion))
        else:
            raise ValueError("pile_type must be 'concrete' or 'all'")
            
        alpha = max(0.0, min(1.0, alpha))
        return alpha, out_of_range, warning_msg

def calculate_adhesion_factor(cohesion: float, pile_type: str):
    calc = AdhesionFactorCalculator()
    alpha, out_of_range, warning_msg = calc.get_alpha(cohesion, pile_type)
    return alpha, out_of_range, warning_msg
