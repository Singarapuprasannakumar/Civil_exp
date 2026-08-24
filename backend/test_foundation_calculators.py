import pytest
from calculators.spt_soil_calculator import get_clay_properties, get_sand_density, get_sand_phi_interpolated
from calculators.adhesion_factor_calculator import calculate_adhesion_factor
from calculators.nq_calculator import calculate_nq_factor

def test_clay_properties():
    # Test typical value
    c, qu, coh, res = get_clay_properties(3)
    assert c == "Soft"
    assert qu == 37.44
    assert coh == 18.72
    
    # Test boundary condition extended
    c, qu, coh, res = get_clay_properties(60)
    assert c == "Hard"
    assert qu == 550.0

def test_sand_density():
    assert get_sand_density(2) == "Very loose"
    assert get_sand_density(35) == "Dense"

def test_sand_phi_interpolated():
    phi = get_sand_phi_interpolated(20)
    assert phi == 36.0
    phi_high = get_sand_phi_interpolated(110)
    assert phi_high > 46

def test_adhesion_factor():
    alpha, oor, msg = calculate_adhesion_factor(50, 'concrete')
    assert round(alpha, 2) == 0.70
    assert oor is False
    
    alpha, oor, msg = calculate_adhesion_factor(160, 'all')
    assert oor is True
    assert msg is not None

def test_nq_factor():
    nq, log_nq, diff, oor, msg = calculate_nq_factor(35)
    assert round(nq, 1) == 60.0
    assert oor is False
    
    nq, log_nq, diff, oor, msg = calculate_nq_factor(50)
    assert oor is True
    assert msg is not None
