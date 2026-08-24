from fastapi import APIRouter, HTTPException
from typing import List
from schemas.borehole import (
    BoreholeCreate, BoreholeUpdate, BoreholeResponse,
    SoilLayerCreate, SoilLayerResponse,
    SptRecordCreate, SptRecordResponse,
    GroundwaterLogCreate, GroundwaterLogResponse
)
from services import borehole_service

router = APIRouter(tags=["boreholes"])

# Boreholes CRUD under projects
@router.get("/projects/{project_uuid}/boreholes", response_model=List[BoreholeResponse], summary="List all boreholes for a project")
def list_boreholes_route(project_uuid: str):
    try:
        return borehole_service.list_boreholes(project_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/projects/{project_uuid}/boreholes", response_model=str, status_code=201, summary="Create a new borehole for a project")
def create_borehole_route(project_uuid: str, req: BoreholeCreate):
    try:
        return borehole_service.create_borehole(project_uuid, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/boreholes/{borehole_uuid}", response_model=BoreholeResponse, summary="Get details of a single borehole")
def get_borehole_route(borehole_uuid: str):
    try:
        return borehole_service.get_borehole(borehole_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/boreholes/{borehole_uuid}", summary="Update borehole details")
def update_borehole_route(borehole_uuid: str, req: BoreholeUpdate):
    try:
        success = borehole_service.update_borehole(borehole_uuid, req)
        if not success:
            raise HTTPException(status_code=400, detail="Borehole update failed")
        return {"success": True, "message": "Borehole details updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/boreholes/{borehole_uuid}", summary="Delete borehole and all linked records")
def delete_borehole_route(borehole_uuid: str):
    try:
        success = borehole_service.delete_borehole(borehole_uuid)
        if not success:
            raise HTTPException(status_code=400, detail="Borehole deletion failed")
        return {"success": True, "message": "Borehole deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Soil Layers CRUD
@router.get("/boreholes/{borehole_uuid}/layers", response_model=List[SoilLayerResponse], summary="List soil layers for a borehole ordered by depth")
def list_soil_layers_route(borehole_uuid: str):
    try:
        return borehole_service.list_soil_layers(borehole_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/boreholes/{borehole_uuid}/layers", response_model=str, status_code=201, summary="Create a new soil layer")
def create_soil_layer_route(borehole_uuid: str, req: SoilLayerCreate):
    try:
        return borehole_service.create_soil_layer(borehole_uuid, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/boreholes/{borehole_uuid}/layers/{layer_uuid}", summary="Update soil layer details")
def update_soil_layer_route(borehole_uuid: str, layer_uuid: str, req: SoilLayerCreate):
    try:
        success = borehole_service.update_soil_layer(borehole_uuid, layer_uuid, req)
        if not success:
            raise HTTPException(status_code=400, detail="Layer update failed")
        return {"success": True, "message": "Soil layer updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/boreholes/{borehole_uuid}/layers/{layer_uuid}", summary="Delete a soil layer")
def delete_soil_layer_route(borehole_uuid: str, layer_uuid: str):
    try:
        success = borehole_service.delete_soil_layer(layer_uuid, borehole_uuid)
        if not success:
            raise HTTPException(status_code=400, detail="Layer deletion failed")
        return {"success": True, "message": "Soil layer deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/boreholes/{borehole_uuid}/layers/bulk", response_model=List[str], summary="Bulk save soil layers (overwrites existing)")
def bulk_save_soil_layers_route(borehole_uuid: str, req: List[SoilLayerCreate]):
    try:
        return borehole_service.bulk_save_soil_layers(borehole_uuid, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/boreholes/{borehole_uuid}/warnings", response_model=List[str], summary="Get soil strata warnings (such as gaps or boundaries)")
def get_strata_warnings_route(borehole_uuid: str):
    try:
        return borehole_service.get_strata_warnings(borehole_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# SPT Records CRUD
@router.get("/boreholes/{borehole_uuid}/spt", response_model=List[SptRecordResponse], summary="List all SPT records for a borehole")
def list_spt_records_route(borehole_uuid: str):
    try:
        return borehole_service.list_spt_records(borehole_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/boreholes/{borehole_uuid}/spt", response_model=str, status_code=201, summary="Create a new SPT record")
def create_spt_record_route(borehole_uuid: str, req: SptRecordCreate):
    try:
        return borehole_service.create_spt_record(borehole_uuid, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/boreholes/{borehole_uuid}/spt/{spt_uuid}", summary="Update SPT record details")
def update_spt_record_route(borehole_uuid: str, spt_uuid: str, req: SptRecordCreate):
    try:
        success = borehole_service.update_spt_record(borehole_uuid, spt_uuid, req)
        if not success:
            raise HTTPException(status_code=400, detail="SPT update failed")
        return {"success": True, "message": "SPT record updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/boreholes/{borehole_uuid}/spt/{spt_uuid}", summary="Delete an SPT record")
def delete_spt_record_route(borehole_uuid: str, spt_uuid: str):
    try:
        success = borehole_service.delete_spt_record(borehole_uuid, spt_uuid)
        if not success:
            raise HTTPException(status_code=400, detail="SPT deletion failed")
        return {"success": True, "message": "SPT record deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Groundwater Logs CRUD
@router.get("/boreholes/{borehole_uuid}/groundwater", response_model=List[GroundwaterLogResponse], summary="List all groundwater depth measurements")
def list_groundwater_logs_route(borehole_uuid: str):
    try:
        return borehole_service.list_groundwater_logs(borehole_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/boreholes/{borehole_uuid}/groundwater", response_model=str, status_code=201, summary="Log a groundwater measurement")
def create_groundwater_log_route(borehole_uuid: str, req: GroundwaterLogCreate):
    try:
        return borehole_service.create_groundwater_log(borehole_uuid, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/boreholes/{borehole_uuid}/groundwater/{log_uuid}", summary="Delete groundwater log entry")
def delete_groundwater_log_route(borehole_uuid: str, log_uuid: str):
    try:
        success = borehole_service.delete_groundwater_log(borehole_uuid, log_uuid)
        if not success:
            raise HTTPException(status_code=400, detail="Groundwater log entry deletion failed")
        return {"success": True, "message": "Groundwater log entry deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
