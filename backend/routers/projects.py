from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, SiteInfoUpdate, 
    CalculationSave, CalculationResponse, ReportSave, ReportResponse, ActivityResponse
)
from services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=List[ProjectResponse], summary="List and search non-deleted projects")
def list_projects_route(
    search: Optional[str] = Query(None, description="Search by name, client, location, or number"),
    status: Optional[str] = Query(None, description="Filter by status (Draft, Completed, etc.)"),
    sort_by: Optional[str] = Query(None, description="Sort options: name, created, modified")
):
    return project_service.get_projects(search, status, sort_by)

@router.post("", response_model=str, status_code=201, summary="Create a new engineering project")
def create_project_route(req: ProjectCreate):
    try:
        return project_service.create_project(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{project_uuid}", response_model=ProjectResponse, summary="Get project parameters by UUID")
def get_project_route(project_uuid: str):
    try:
        return project_service.get_project(project_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{project_uuid}", summary="Update project general details")
def update_project_route(project_uuid: str, req: ProjectUpdate):
    try:
        success = project_service.update_project(project_uuid, req)
        if not success:
            raise HTTPException(status_code=400, detail="Update parameters failed")
        return {"success": True, "message": "Project general parameters updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{project_uuid}", summary="Soft-delete project from active dashboard")
def delete_project_route(project_uuid: str):
    try:
        success = project_service.delete_project(project_uuid)
        if not success:
            raise HTTPException(status_code=400, detail="Soft-deletion failed")
        return {"success": True, "message": "Project soft-deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{project_uuid}/site-info", summary="Update project site investigation details")
def update_site_info_route(project_uuid: str, req: SiteInfoUpdate):
    try:
        success = project_service.update_site_info(project_uuid, req)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update site details")
        return {"success": True, "message": "Site details updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{project_uuid}/calculations", response_model=str, status_code=201, summary="Save calculation run trial history")
def save_calculation_route(project_uuid: str, req: CalculationSave):
    try:
        return project_service.save_calculation(project_uuid, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{project_uuid}/calculations", response_model=List[CalculationResponse], summary="List all saved calculation trials for a project")
def get_calculations_route(project_uuid: str):
    try:
        return project_service.get_calculations(project_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{project_uuid}/reports", response_model=str, status_code=201, summary="Save calculation report under project")
def save_report_route(project_uuid: str, req: ReportSave):
    try:
        return project_service.save_report(project_uuid, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{project_uuid}/reports", response_model=List[ReportResponse], summary="List all calculation reports for a project")
def get_reports_route(project_uuid: str):
    try:
        return project_service.get_reports(project_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{project_uuid}/reports/{report_id}", summary="Delete calculation report from project history")
def delete_report_route(project_uuid: str, report_id: str):
    try:
        success = project_service.delete_report(project_uuid, report_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to delete report")
        return {"success": True, "message": "Report deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{project_uuid}/activities", response_model=List[ActivityResponse], summary="Get project activity logs history timeline")
def get_activities_route(project_uuid: str):
    try:
        return project_service.get_activities(project_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

from schemas.project import FoundationPreferencesUpdate, FoundationPreferencesResponse

@router.get("/{project_uuid}/foundation-preferences", response_model=Optional[FoundationPreferencesResponse], summary="Get persistent foundation analysis preferences")
def get_foundation_preferences_route(project_uuid: str):
    try:
        prefs = project_service.get_foundation_preferences(project_uuid)
        # If pref is None, FastAPI will safely return null (Optional typing)
        return prefs
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{project_uuid}/foundation-preferences", summary="Update foundation analysis preferences like Adhesion Factor")
def update_foundation_preferences_route(project_uuid: str, req: FoundationPreferencesUpdate):
    try:
        success = project_service.update_foundation_preferences(project_uuid, req)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update foundation preferences")
        return {"success": True, "message": "Foundation preferences updated successfully"}
    except ValueError as e:
        # If it's a validation error (value must be not none when active)
        if "Adhesion factor cannot be active" in str(e):
             raise HTTPException(status_code=422, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
