import sqlite3
import json
import uuid
import datetime
from models.project import get_db_connection

def dict_from_row(row):
    d = dict(row)
    # Parse JSON fields if present
    for json_field in ['inputs', 'results', 'engineering_notes']:
        if json_field in d and d[json_field]:
            try:
                d[json_field] = json.loads(d[json_field])
            except:
                pass
    return d

def get_id_from_uuid(cursor, project_uuid):
    cursor.execute("SELECT id FROM projects WHERE uuid = ? AND is_deleted = 0", (project_uuid,))
    row = cursor.fetchone()
    if not row:
        raise ValueError("Project not found")
    return row['id']

def get_projects(search=None, status=None, sort_by=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT p.*, s.site_name, s.site_coordinates, s.ground_level, s.groundwater_level,
           s.weather, s.elevation, s.site_notes, COUNT(r.id) as calculations_count 
    FROM projects p
    LEFT JOIN site_information s ON p.id = s.project_id
    LEFT JOIN reports r ON p.id = r.project_id
    WHERE p.is_deleted = 0
    """
    params = []
    
    if search:
        query += " AND (p.name LIKE ? OR p.client_name LIKE ? OR p.location LIKE ? OR p.project_number LIKE ?)"
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param, search_param])
        
    if status:
        query += " AND p.status = ?"
        params.append(status)
        
    query += " GROUP BY p.id"
    
    # Sorting
    if sort_by == 'name':
        query += " ORDER BY p.name ASC"
    elif sort_by == 'created':
        query += " ORDER BY p.created_at DESC"
    elif sort_by == 'modified':
        query += " ORDER BY p.modified_at DESC"
    else:
        query += " ORDER BY p.modified_at DESC"
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict_from_row(row) for row in rows]

def get_project_by_id(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT p.*, s.site_name, s.site_coordinates, s.ground_level, s.groundwater_level,
           s.weather, s.elevation, s.site_notes, COUNT(r.id) as calculations_count 
    FROM projects p
    LEFT JOIN site_information s ON p.id = s.project_id
    LEFT JOIN reports r ON p.id = r.project_id
    WHERE p.id = ? AND p.is_deleted = 0
    GROUP BY p.id
    """, (project_id,))
    row = cursor.fetchone()
    conn.close()
    
    return dict_from_row(row) if row else None

def get_project_by_uuid(project_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT p.*, s.site_name, s.site_coordinates, s.ground_level, s.groundwater_level,
           s.weather, s.elevation, s.site_notes, COUNT(r.id) as calculations_count 
    FROM projects p
    LEFT JOIN site_information s ON p.id = s.project_id
    LEFT JOIN reports r ON p.id = r.project_id
    WHERE p.uuid = ? AND p.is_deleted = 0
    GROUP BY p.id
    """, (project_uuid,))
    row = cursor.fetchone()
    conn.close()
    
    return dict_from_row(row) if row else None

def get_project_by_number(project_number):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM projects WHERE project_number = ? AND is_deleted = 0", (project_number,))
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None

def create_project(p):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    project_uuid = str(uuid.uuid4())
    
    cursor.execute("""
    INSERT INTO projects (
        uuid, name, project_number, client_name, consultant, location, latitude, longitude,
        description, status, created_at, modified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        project_uuid, p.name, p.project_number, p.client_name, p.consultant, p.location, p.latitude, p.longitude,
        p.description, p.status or 'Draft', now, now
    ))
    project_id = cursor.lastrowid
    
    # Initialize empty site information
    cursor.execute("""
    INSERT INTO site_information (
        project_id, site_name, site_coordinates, ground_level, groundwater_level, weather, elevation, site_notes
    ) VALUES (?, '', '', 0.0, 0.0, '', 0.0, '');
    """, (project_id,))
    
    conn.commit()
    conn.close()
    
    return project_uuid

def update_project(project_uuid, p):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    cursor.execute("""
    UPDATE projects SET
        name = ?, client_name = ?, consultant = ?, location = ?, latitude = ?, longitude = ?,
        description = ?, status = ?, modified_at = ?
    WHERE uuid = ? AND is_deleted = 0
    """, (
        p.name, p.client_name, p.consultant, p.location, p.latitude, p.longitude,
        p.description, p.status or 'Draft', now, project_uuid
    ))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return success

def soft_delete_project(project_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    cursor.execute("""
    UPDATE projects SET
        is_deleted = 1,
        deleted_at = ?,
        modified_at = ?
    WHERE uuid = ? AND is_deleted = 0
    """, (now, now, project_uuid))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return success

def update_site_info(project_uuid, s):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    try:
        project_id = get_id_from_uuid(cursor, project_uuid)
        cursor.execute("""
        UPDATE site_information SET
            site_name = ?, site_coordinates = ?, ground_level = ?, groundwater_level = ?,
            weather = ?, elevation = ?, site_notes = ?
        WHERE project_id = ?
        """, (
            s.site_name, s.site_coordinates, s.ground_level, s.groundwater_level,
            s.weather, s.elevation, s.site_notes, project_id
        ))
        success = cursor.rowcount > 0
        
        # Update project modified time
        cursor.execute("UPDATE projects SET modified_at = ? WHERE id = ?", (now, project_id))
        
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def save_calculation(project_uuid, c):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    calc_uuid = str(uuid.uuid4())
    try:
        project_id = get_id_from_uuid(cursor, project_uuid)
        cursor.execute("""
        INSERT INTO calculations (
            uuid, project_id, module, calculation_name, created_at, inputs, results, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            calc_uuid, project_id, c.module, c.calculation_name, now,
            json.dumps(c.inputs), json.dumps(c.results), c.version or '1.0'
        ))
        
        # Update project modified time
        cursor.execute("UPDATE projects SET modified_at = ? WHERE id = ?", (now, project_id))
        
        conn.commit()
        return calc_uuid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_calculations(project_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        project_id = get_id_from_uuid(cursor, project_uuid)
        cursor.execute("SELECT * FROM calculations WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]
    finally:
        conn.close()

def save_report(project_uuid, r):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    try:
        project_id = get_id_from_uuid(cursor, project_uuid)
        cursor.execute("""
        INSERT OR REPLACE INTO reports (
            id, project_id, module, report_number, engineer, created_at, inputs, results, engineering_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            r.id, project_id, r.module, r.report_number, r.engineer or 'Consultant Geotechnical Engineer',
            now, json.dumps(r.inputs), json.dumps(r.results), json.dumps(r.engineering_notes) if r.engineering_notes else None
        ))
        
        # Update project modified time
        cursor.execute("UPDATE projects SET modified_at = ? WHERE id = ?", (now, project_id))
        
        conn.commit()
        return r.id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_reports(project_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        project_id = get_id_from_uuid(cursor, project_uuid)
        cursor.execute("SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]
    finally:
        conn.close()

def delete_report(project_uuid, report_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        project_id = get_id_from_uuid(cursor, project_uuid)
        cursor.execute("DELETE FROM reports WHERE id = ? AND project_id = ?", (report_id, project_id))
        success = cursor.rowcount > 0
        
        if success:
            now = datetime.datetime.now().isoformat()
            cursor.execute("UPDATE projects SET modified_at = ? WHERE id = ?", (now, project_id))
            
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def log_activity(project_id, activity_type, description, user_name='Consultant Engineer'):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO project_activity (
        project_id, activity_type, description, created_at, user_name
    ) VALUES (?, ?, ?, ?, ?);
    """, (project_id, activity_type, description, now, user_name))
    conn.commit()
    conn.close()

def get_activities(project_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        project_id = get_id_from_uuid(cursor, project_uuid)
        cursor.execute("SELECT * FROM project_activity WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def get_foundation_preferences(project_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        project_id = get_id_from_uuid(cursor, project_uuid)
        cursor.execute("SELECT * FROM foundation_preferences WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()

def update_foundation_preferences(project_uuid, prefs_update):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        now = datetime.datetime.now().isoformat()
        project_id = get_id_from_uuid(cursor, project_uuid)
        
        pref = prefs_update.adhesion_factor
        val = pref.value
        active = 1 if pref.active else 0
        src = pref.source
        
        cursor.execute("""
        INSERT OR REPLACE INTO foundation_preferences (
            project_id, adhesion_factor_value, adhesion_factor_active, 
            adhesion_factor_source, adhesion_factor_confirmed_at
        ) VALUES (?, ?, ?, ?, ?)
        """, (project_id, val, active, src, now))
        
        # Also update project modified_at
        cursor.execute("UPDATE projects SET modified_at = ? WHERE id = ?", (now, project_id))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

