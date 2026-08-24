from repositories import project_repository

def get_projects(search=None, status=None, sort_by=None):
    return project_repository.get_projects(search, status, sort_by)

def get_project(project_uuid):
    p = project_repository.get_project_by_uuid(project_uuid)
    if not p:
        raise ValueError("Project not found")
    return p

def create_project(p):
    existing = project_repository.get_project_by_number(p.project_number)
    if existing:
        raise ValueError(f"Project number '{p.project_number}' already exists. It must be unique.")
    
    project_uuid = project_repository.create_project(p)
    new_project = project_repository.get_project_by_uuid(project_uuid)
    
    # Log activity
    project_repository.log_activity(
        new_project['id'],
        'created',
        f"Project created with number {p.project_number} and location {p.location}."
    )
    
    return project_uuid

def update_project(project_uuid, p):
    curr = get_project(project_uuid)
    success = project_repository.update_project(project_uuid, p)
    if success:
        project_repository.log_activity(
            curr['id'],
            'updated',
            f"Project parameters updated: {p.name}."
        )
    return success

def delete_project(project_uuid):
    curr = get_project(project_uuid)
    success = project_repository.soft_delete_project(project_uuid)
    if success:
        project_repository.log_activity(
            curr['id'],
            'deleted',
            f"Project marked as deleted."
        )
    return success

def update_site_info(project_uuid, s):
    curr = get_project(project_uuid)
    success = project_repository.update_site_info(project_uuid, s)
    if success:
        project_repository.log_activity(
            curr['id'],
            'updated_site',
            f"Site investigation information updated for site: {s.site_name or 'unnamed'}."
        )
    return success

def save_calculation(project_uuid, c):
    curr = get_project(project_uuid)
    calc_uuid = project_repository.save_calculation(project_uuid, c)
    project_repository.log_activity(
        curr['id'],
        'calculation_run',
        f"Ran calculation trial: {c.calculation_name} using {c.module} module (v{c.version})."
    )
    return calc_uuid

def get_calculations(project_uuid):
    return project_repository.get_calculations(project_uuid)

def save_report(project_uuid, r):
    curr = get_project(project_uuid)
    report_id = project_repository.save_report(project_uuid, r)
    project_repository.log_activity(
        curr['id'],
        'report_saved',
        f"Saved engineering report #{r.report_number} for {r.module} module."
    )
    return report_id

def get_reports(project_uuid):
    return project_repository.get_reports(project_uuid)

def delete_report(project_uuid, report_id):
    curr = get_project(project_uuid)
    success = project_repository.delete_report(project_uuid, report_id)
    if success:
        project_repository.log_activity(
            curr['id'],
            'report_deleted',
            f"Deleted report ID: {report_id} from project history."
        )
    return success

def get_activities(project_uuid):
    return project_repository.get_activities(project_uuid)

def get_foundation_preferences(project_uuid):
    # Verify project exists
    get_project(project_uuid)
    return project_repository.get_foundation_preferences(project_uuid)

def update_foundation_preferences(project_uuid, prefs):
    curr = get_project(project_uuid)
    
    # Validation logic according to requirement:
    val = prefs.adhesion_factor.value
    active = prefs.adhesion_factor.active
    
    if active and val is None:
        raise ValueError("Adhesion factor cannot be active without a numeric value.")
        
    success = project_repository.update_foundation_preferences(project_uuid, prefs)
    if success:
        stat_str = f"Active, α={val}" if active else "Inactive"
        project_repository.log_activity(
            curr['id'],
            'updated_preferences',
            f"Updated Foundation Preferences. Adhesion Factor: {stat_str}."
        )
    return success

