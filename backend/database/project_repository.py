import sqlite3
import json
import datetime
from models.project import get_db_connection

def dict_from_row(row):
    d = dict(row)
    # Parse inputs, results, and notes if they are in reports rows
    if 'inputs' in d:
        d['inputs'] = json.loads(d['inputs'])
    if 'results' in d:
        d['results'] = json.loads(d['results'])
    if 'engineering_notes' in d and d['engineering_notes']:
        d['engineering_notes'] = json.loads(d['engineering_notes'])
    return d

def get_projects(search=None, status=None, sort_by=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT p.*, COUNT(r.id) as calculations_count 
    FROM projects p
    LEFT JOIN reports r ON p.id = r.project_id
    """
    params = []
    where_clauses = []
    
    if search:
        where_clauses.append("(p.name LIKE ? OR p.client_name LIKE ? OR p.location LIKE ? OR p.project_number LIKE ?)")
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param, search_param])
        
    if status:
        where_clauses.append("p.status = ?")
        params.append(status)
        
    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)
        
    query += " GROUP BY p.id"
    
    # Sorting
    if sort_by == 'name':
        query += " ORDER BY p.name ASC"
    elif sort_by == 'created':
        query += " ORDER BY p.created_at DESC"
    elif sort_by == 'modified':
        query += " ORDER BY p.modified_at DESC"
    else:
        query += " ORDER BY p.modified_at DESC" # default sort by modified date
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_project_by_id(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT p.*, COUNT(r.id) as calculations_count 
    FROM projects p
    LEFT JOIN reports r ON p.id = r.project_id
    WHERE p.id = ?
    GROUP BY p.id
    """, (project_id,))
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None

def get_project_by_number(project_number):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM projects WHERE project_number = ?", (project_number,))
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None

def create_project(p):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO projects (
        name, project_number, client_name, consultant, location, latitude, longitude,
        description, structure_type, foundation_type, design_code, units, status,
        created_at, modified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        p.name, p.project_number, p.client_name, p.consultant, p.location, p.latitude, p.longitude,
        p.description, p.structure_type, p.foundation_type, p.design_code, p.units or 'metric', p.status or 'Draft',
        now, now
    ))
    project_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return project_id

def update_project(project_id, p):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    cursor.execute("""
    UPDATE projects SET
        name = ?, client_name = ?, consultant = ?, location = ?, latitude = ?, longitude = ?,
        description = ?, structure_type = ?, foundation_type = ?, design_code = ?, status = ?,
        modified_at = ?
    WHERE id = ?
    """, (
        p.name, p.client_name, p.consultant, p.location, p.latitude, p.longitude,
        p.description, p.structure_type, p.foundation_type, p.design_code, p.status or 'Draft',
        now, project_id
    ))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return success

def delete_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Enable foreign keys so cascade delete works
    cursor.execute("PRAGMA foreign_keys = ON;")
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return success

def update_site_info(project_id, s):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    cursor.execute("""
    UPDATE projects SET
        site_name = ?, site_coordinates = ?, ground_level = ?, groundwater_level = ?,
        weather = ?, elevation = ?, site_notes = ?, modified_at = ?
    WHERE id = ?
    """, (
        s.site_name, s.site_coordinates, s.ground_level, s.groundwater_level,
        s.weather, s.elevation, s.site_notes, now, project_id
    ))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return success

def save_report(project_id, r):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
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
    conn.close()
    return r.id

def get_reports(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict_from_row(row) for row in rows]

def delete_report(project_id, report_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM reports WHERE id = ? AND project_id = ?", (report_id, project_id))
    success = cursor.rowcount > 0
    
    if success:
        now = datetime.datetime.now().isoformat()
        cursor.execute("UPDATE projects SET modified_at = ? WHERE id = ?", (now, project_id))
        
    conn.commit()
    conn.close()
    return success
