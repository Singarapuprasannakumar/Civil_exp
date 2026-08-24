import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "projects_v2.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Enable foreign keys support
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # 1. Create projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        project_number TEXT NOT NULL UNIQUE,
        client_name TEXT NOT NULL,
        consultant TEXT,
        location TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        description TEXT,
        status TEXT DEFAULT 'Draft',
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        created_by TEXT DEFAULT 'Consultant Engineer',
        updated_by TEXT DEFAULT 'Consultant Engineer'
    );
    """)
    
    # 2. Create site_information table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS site_information (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER UNIQUE NOT NULL,
        site_name TEXT,
        site_coordinates TEXT,
        ground_level REAL,
        groundwater_level REAL,
        weather TEXT,
        elevation REAL,
        site_notes TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """)
    
    # 3. Create calculations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        project_id INTEGER NOT NULL,
        module TEXT NOT NULL,
        calculation_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        inputs TEXT NOT NULL,
        results TEXT NOT NULL,
        version TEXT DEFAULT '1.0',
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """)
    
    # 4. Create reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        project_id INTEGER NOT NULL,
        module TEXT NOT NULL,
        report_number INTEGER NOT NULL,
        engineer TEXT NOT NULL,
        created_at TEXT NOT NULL,
        inputs TEXT NOT NULL,
        results TEXT NOT NULL,
        engineering_notes TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """)
    
    # 5. Create project_activity table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS project_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        user_name TEXT DEFAULT 'Consultant Engineer',
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """)
    
    # 6. Create boreholes table (with status, is_deleted, deleted_at)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS boreholes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        location TEXT,
        ground_level REAL DEFAULT 0.0,
        termination_depth REAL DEFAULT 0.0,
        groundwater_depth REAL,
        drilling_method TEXT,
        remarks TEXT,
        status TEXT DEFAULT 'Draft',
        is_deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """)
    
    # 7. Create soil_layers table (with layer_order, version, created/updated timestamps)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS soil_layers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        borehole_id INTEGER NOT NULL,
        from_depth REAL NOT NULL,
        to_depth REAL NOT NULL,
        layer_order INTEGER NOT NULL,
        soil_type TEXT NOT NULL,
        description TEXT,
        uscs_classification TEXT,
        is_1498_classification TEXT,
        aashto_classification TEXT,
        unit_weight REAL,
        cohesion REAL,
        friction_angle REAL,
        moisture_content REAL,
        permeability REAL,
        color TEXT DEFAULT '#8d6e63',
        version TEXT DEFAULT '1.0',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (borehole_id) REFERENCES boreholes (id) ON DELETE CASCADE
    );
    """)
    
    # 8. Create spt_records table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS spt_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        borehole_id INTEGER NOT NULL,
        depth REAL NOT NULL,
        n_value INTEGER NOT NULL,
        corrected_n REAL,
        FOREIGN KEY (borehole_id) REFERENCES boreholes (id) ON DELETE CASCADE
    );
    """)
    
    # 9. Create groundwater_logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS groundwater_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        borehole_id INTEGER NOT NULL,
        measured_date TEXT NOT NULL,
        water_depth REAL NOT NULL,
        remarks TEXT,
        FOREIGN KEY (borehole_id) REFERENCES boreholes (id) ON DELETE CASCADE
    );
    """)
    
    # 10. Create attachments placeholder table (v2.3)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        project_id INTEGER NOT NULL,
        borehole_id INTEGER,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (borehole_id) REFERENCES boreholes (id) ON DELETE CASCADE
    );
    """)
    
    # 11. Create foundation preferences table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS foundation_preferences (
        project_id INTEGER PRIMARY KEY,
        adhesion_factor_value REAL,
        adhesion_factor_active INTEGER DEFAULT 0,
        adhesion_factor_source TEXT,
        adhesion_factor_confirmed_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """)
    
    conn.commit()
    conn.close()
