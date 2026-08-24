from fastapi.testclient import TestClient
from main import app
import pytest

# Use existing DB for quick smoke test assuming we have a project or we can just mock the 404
client = TestClient(app)

def test_foundation_preferences_not_found():
    # Attempt on a non-existent project uuid
    res = client.get("/projects/non_existent_uuid/foundation-preferences")
    assert res.status_code == 404

def test_foundation_preferences_validation():
    # 1. Create a project
    proj_res = client.post("/projects", json={
        "name": "Validation Test Project",
        "project_number": "VTP-001",
        "client_name": "Test Client",
        "location": "Test Location"
    })
    
    # If the project number is already taken (e.g. from previous test runs), we could get 400.
    # In that case, we can just fetch the first project from the DB.
    if proj_res.status_code == 200:
        p_uuid = proj_res.json()["uuid"]
    else:
        # fetch existing
        list_res = client.get("/projects")
        assert list_res.status_code == 200
        p_uuid = list_res.json()[0]["uuid"]

    # 2. Attempt to put an invalid body (active=True, but value=None)
    res = client.put(f"/projects/{p_uuid}/foundation-preferences", json={
        "adhesion_factor": {
            "active": True
            # missing value
        }
    })
    # Should fail validation inside the service layer
    assert res.status_code == 422
    err_msg = res.json()["detail"]
    assert "cannot be active" in err_msg.lower() or "value error" in err_msg.lower()

def test_under_reamed_alpha():
    # Verify the backend accepts alpha and passes it correctly
    payload = {
        "trialPit": "BH-01",
        "D": 0.3,
        "Cp": 50.0,
        "Ca_dash": 40.0,
        "Ca": 30.0,
        "alpha": 0.75
    }
    res = client.post("/under-reamed/calculate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["engineeringNotes"]["adhesionFactorAlpha"] == 0.75
    
    # Check default alpha
    payload_no_alpha = dict(payload)
    del payload_no_alpha["alpha"]
    res_no = client.post("/under-reamed/calculate", json=payload_no_alpha)
    assert res_no.status_code == 200
    assert res_no.json()["engineeringNotes"]["adhesionFactorAlpha"] == 0.5

