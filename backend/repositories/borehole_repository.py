import sqlite3
import uuid
import datetime
from models.project import get_db_connection

def dict_from_row(row):
    return dict(row) if row else None

def get_project_id_by_uuid(cursor, project_uuid):
    cursor.execute("SELECT id FROM projects WHERE uuid = ? AND is_deleted = 0", (project_uuid,))
    row = cursor.fetchone()
    if not row:
        raise ValueError("Project not found")
    return row['id']

def get_borehole_id_by_uuid(cursor, borehole_uuid):
    cursor.execute("SELECT id FROM boreholes WHERE uuid = ? AND is_deleted = 0", (borehole_uuid,))
    row = cursor.fetchone()
    if not row:
        raise ValueError("Borehole not found")
    return row['id']

def create_borehole(project_uuid, b):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    borehole_uuid = str(uuid.uuid4())
    try:
        project_id = get_project_id_by_uuid(cursor, project_uuid)
        cursor.execute("""
        INSERT INTO boreholes (
            uuid, project_id, name, location, ground_level, termination_depth, groundwater_depth, 
            drilling_method, remarks, status, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);
        """, (
            borehole_uuid, project_id, b.name, b.location, b.ground_level or 0.0,
            b.termination_depth or 0.0, b.groundwater_depth, b.drilling_method, b.remarks, b.status or 'Draft'
        ))
        conn.commit()
        return borehole_uuid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_boreholes_by_project(project_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        project_id = get_project_id_by_uuid(cursor, project_uuid)
        cursor.execute("""
        SELECT b.*, 
               (SELECT COUNT(*) FROM soil_layers WHERE borehole_id = b.id) as layers_count,
               (SELECT COUNT(*) FROM spt_records WHERE borehole_id = b.id) as spt_count
        FROM boreholes b
        WHERE b.project_id = ? AND b.is_deleted = 0
        ORDER BY b.name ASC
        """, (project_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def get_borehole_by_uuid(borehole_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
        SELECT b.*, 
               (SELECT COUNT(*) FROM soil_layers WHERE borehole_id = b.id) as layers_count,
               (SELECT COUNT(*) FROM spt_records WHERE borehole_id = b.id) as spt_count
        FROM boreholes b
        WHERE b.uuid = ? AND b.is_deleted = 0
        """, (borehole_uuid,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def update_borehole(borehole_uuid, b):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
        UPDATE boreholes SET
            name = ?, location = ?, ground_level = ?, termination_depth = ?, 
            groundwater_depth = ?, drilling_method = ?, remarks = ?, status = ?
        WHERE uuid = ? AND is_deleted = 0
        """, (
            b.name, b.location, b.ground_level or 0.0, b.termination_depth or 0.0,
            b.groundwater_depth, b.drilling_method, b.remarks, b.status or 'Draft',
            borehole_uuid
        ))
        success = cursor.rowcount > 0
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def soft_delete_borehole(borehole_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    try:
        cursor.execute("""
        UPDATE boreholes SET
            is_deleted = 1,
            deleted_at = ?
        WHERE uuid = ? AND is_deleted = 0
        """, (now, borehole_uuid))
        success = cursor.rowcount > 0
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# Soil Layers CRUD
def create_soil_layer(borehole_uuid, l):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    layer_uuid = str(uuid.uuid4())
    now = datetime.datetime.now().isoformat()
    try:
        borehole_id = get_borehole_id_by_uuid(cursor, borehole_uuid)
        cursor.execute("""
        INSERT INTO soil_layers (
            uuid, borehole_id, from_depth, to_depth, layer_order, soil_type, description, 
            uscs_classification, is_1498_classification, aashto_classification,
            unit_weight, cohesion, friction_angle, moisture_content, permeability, 
            color, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '1.0', ?, ?);
        """, (
            layer_uuid, borehole_id, l.from_depth, l.to_depth, l.layer_order, l.soil_type, l.description,
            l.uscs_classification, l.is_1498_classification, l.aashto_classification,
            l.unit_weight, l.cohesion, l.friction_angle, l.moisture_content, l.permeability,
            l.color or '#8d6e63', now, now
        ))
        conn.commit()
        return layer_uuid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_soil_layers(borehole_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        borehole_id = get_borehole_id_by_uuid(cursor, borehole_uuid)
        cursor.execute("SELECT * FROM soil_layers WHERE borehole_id = ? ORDER BY layer_order ASC, from_depth ASC", (borehole_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def update_soil_layer(layer_uuid, l):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    try:
        # Get old version
        cursor.execute("SELECT version FROM soil_layers WHERE uuid = ?", (layer_uuid,))
        row = cursor.fetchone()
        old_version = row['version'] if row else '1.0'
        new_version = str(round(float(old_version) + 1.0, 1))
        
        cursor.execute("""
        UPDATE soil_layers SET
            from_depth = ?, to_depth = ?, layer_order = ?, soil_type = ?, description = ?, 
            uscs_classification = ?, is_1498_classification = ?, aashto_classification = ?,
            unit_weight = ?, cohesion = ?, friction_angle = ?, moisture_content = ?, permeability = ?, 
            color = ?, version = ?, updated_at = ?
        WHERE uuid = ?
        """, (
            l.from_depth, l.to_depth, l.layer_order, l.soil_type, l.description,
            l.uscs_classification, l.is_1498_classification, l.aashto_classification,
            l.unit_weight, l.cohesion, l.friction_angle, l.moisture_content, l.permeability,
            l.color or '#8d6e63', new_version, now, layer_uuid
        ))
        success = cursor.rowcount > 0
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def delete_soil_layer(layer_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM soil_layers WHERE uuid = ?", (layer_uuid,))
        success = cursor.rowcount > 0
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def bulk_save_soil_layers(borehole_uuid, layers):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    try:
        borehole_id = get_borehole_id_by_uuid(cursor, borehole_uuid)
        # Clear old layers
        cursor.execute("DELETE FROM soil_layers WHERE borehole_id = ?", (borehole_id,))
        
        # Save new layers list
        saved_uuids = []
        for l in layers:
            layer_uuid = str(uuid.uuid4())
            cursor.execute("""
            INSERT INTO soil_layers (
                uuid, borehole_id, from_depth, to_depth, layer_order, soil_type, description, 
                uscs_classification, is_1498_classification, aashto_classification,
                unit_weight, cohesion, friction_angle, moisture_content, permeability, 
                color, version, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '1.0', ?, ?);
            """, (
                layer_uuid, borehole_id, l.from_depth, l.to_depth, l.layer_order, l.soil_type, l.description,
                l.uscs_classification, l.is_1498_classification, l.aashto_classification,
                l.unit_weight, l.cohesion, l.friction_angle, l.moisture_content, l.permeability,
                l.color or '#8d6e63', now, now
            ))
            saved_uuids.append(layer_uuid)
            
        conn.commit()
        return saved_uuids
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# SPT Records CRUD
def create_spt_record(borehole_uuid, s):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    record_uuid = str(uuid.uuid4())
    try:
        borehole_id = get_borehole_id_by_uuid(cursor, borehole_uuid)
        cursor.execute("""
        INSERT INTO spt_records (
            uuid, borehole_id, depth, n_value, corrected_n
        ) VALUES (?, ?, ?, ?, ?);
        """, (
            record_uuid, borehole_id, s.depth, s.n_value, s.corrected_n
        ))
        conn.commit()
        return record_uuid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_spt_records(borehole_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        borehole_id = get_borehole_id_by_uuid(cursor, borehole_uuid)
        cursor.execute("SELECT * FROM spt_records WHERE borehole_id = ? ORDER BY depth ASC", (borehole_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def update_spt_record(spt_uuid, s):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
        UPDATE spt_records SET
            depth = ?, n_value = ?, corrected_n = ?
        WHERE uuid = ?
        """, (
            s.depth, s.n_value, s.corrected_n, spt_uuid
        ))
        success = cursor.rowcount > 0
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def delete_spt_record(spt_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM spt_records WHERE uuid = ?", (spt_uuid,))
        success = cursor.rowcount > 0
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# Groundwater Logs CRUD
def create_groundwater_log(borehole_uuid, w):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    log_uuid = str(uuid.uuid4())
    try:
        borehole_id = get_borehole_id_by_uuid(cursor, borehole_uuid)
        cursor.execute("""
        INSERT INTO groundwater_logs (
            uuid, borehole_id, measured_date, water_depth, remarks
        ) VALUES (?, ?, ?, ?, ?);
        """, (
            log_uuid, borehole_id, w.measured_date, w.water_depth, w.remarks
        ))
        conn.commit()
        return log_uuid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_groundwater_logs(borehole_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        borehole_id = get_borehole_id_by_uuid(cursor, borehole_uuid)
        cursor.execute("SELECT * FROM groundwater_logs WHERE borehole_id = ? ORDER BY measured_date DESC", (borehole_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def delete_groundwater_log(log_uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM groundwater_logs WHERE uuid = ?", (log_uuid,))
        success = cursor.rowcount > 0
        conn.commit()
        return success
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
