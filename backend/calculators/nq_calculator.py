import numpy as np
from scipy.interpolate import interp1d

class NqCalculator:
    def __init__(self):
        self.phi_values = np.array([20, 25, 30, 32, 35, 37, 40, 42, 45])
        self.nq_values = np.array([
            8.0, 15.0, 30.0, 39.7, 60.0, 85.0, 120.0, 165.0, 250.0
        ])
        self.interp = interp1d(self.phi_values, self.nq_values, 
                               kind='cubic', fill_value='extrapolate')
        
        log_nq = np.log10(self.nq_values)
        self.interp_log = interp1d(self.phi_values, log_nq, 
                                   kind='linear', fill_value='extrapolate')

    def get_nq(self, phi: float):
        out_of_range = False
        warning_msg = None
        if phi < 20 or phi > 45:
            out_of_range = True
            warning_msg = f"phi={phi}° is outside the IS:2911 range (20°-45°). Results are extrapolated."
            
        nq = float(self.interp(phi))
        log_nq_val = self.interp_log(phi)
        nq_log = float(10 ** log_nq_val)
        
        diff = abs(nq - nq_log)
        
        return nq, nq_log, diff, out_of_range, warning_msg

def calculate_nq_factor(phi: float):
    calc = NqCalculator()
    return calc.get_nq(phi)
