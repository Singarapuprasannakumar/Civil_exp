from repositories import borehole_repository, project_repository

def get_project_by_borehole_uuid(borehole_uuid):
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    if not b:
        raise ValueError("Borehole not found")
    return project_repository.get_project_by_id(b['project_id'])

# Validation helpers
def validate_geotechnical_properties(from_depth, to_depth, cohesion, unit_weight, friction_angle, moisture_content):
    if from_depth < 0:
        raise ValueError("Start depth 'from_depth' must be greater than or equal to 0.0m.")
    if to_depth <= from_depth:
        raise ValueError("End depth 'to_depth' must be strictly greater than 'from_depth'.")
    if cohesion is not None and cohesion < 0:
        raise ValueError("Cohesion must be greater than or equal to 0.0 kN/m².")
    if unit_weight is not None and unit_weight <= 0:
        raise ValueError("Unit weight must be strictly greater than 0.0 kN/m³.")
    if friction_angle is not None and (friction_angle < 0.0 or friction_angle > 90.0):
        raise ValueError("Friction angle must be between 0.0 and 90.0 degrees.")
    if moisture_content is not None and (moisture_content < 0.0 or moisture_content > 100.0):
        raise ValueError("Moisture content must be between 0.0% and 100.0%.")

def check_layer_overlap(existing_layers, from_d, to_d, exclude_uuid=None):
    for l in existing_layers:
        if exclude_uuid and l['uuid'] == exclude_uuid:
            continue
        max_start = max(from_d, l['from_depth'])
        min_end = min(to_d, l['to_depth'])
        if max_start < min_end:
            raise ValueError(f"Strata overlap detected: Layer depth {from_d}m to {to_d}m overlaps with existing layer {l['from_depth']}m to {l['to_depth']}m ({l['soil_type']}).")

def get_strata_warnings(borehole_uuid):
    layers = borehole_repository.get_soil_layers(borehole_uuid)
    warnings = []
    if not layers:
        return ["No soil layers defined for this borehole."]
        
    if layers[0]['from_depth'] > 0.0:
        warnings.append(f"Strata profile does not start at ground level (0.0m). Starts at {layers[0]['from_depth']}m instead.")
        
    for i in range(len(layers) - 1):
        curr_to = layers[i]['to_depth']
        next_from = layers[i+1]['from_depth']
        if curr_to < next_from:
            warnings.append(f"Gap detected in soil profile between depth {curr_to}m and {next_from}m.")
            
    return warnings

def list_boreholes(project_uuid):
    return borehole_repository.get_boreholes_by_project(project_uuid)

def get_borehole(borehole_uuid):
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    if not b:
        raise ValueError("Borehole not found")
    return b

def create_borehole(project_uuid, b):
    p = project_repository.get_project_by_uuid(project_uuid)
    if not p:
        raise ValueError("Project not found")
        
    bh_uuid = borehole_repository.create_borehole(project_uuid, b)
    project_repository.log_activity(
        p['id'],
        'borehole_created',
        f"Created Borehole {b.name} (ground level {b.ground_level or 0.0}m)."
    )
    return bh_uuid

def update_borehole(borehole_uuid, b):
    proj = get_project_by_borehole_uuid(borehole_uuid)
    success = borehole_repository.update_borehole(borehole_uuid, b)
    if success:
        project_repository.log_activity(
            proj['id'],
            'borehole_updated',
            f"Updated Borehole {b.name} parameters."
        )
    return success

def delete_borehole(borehole_uuid):
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    success = borehole_repository.soft_delete_borehole(borehole_uuid)
    if success:
        project_repository.log_activity(
            proj['id'],
            'borehole_deleted',
            f"Deleted Borehole {b['name']}."
        )
    return success

# Soil Layers Services
def list_soil_layers(borehole_uuid):
    return borehole_repository.get_soil_layers(borehole_uuid)

def create_soil_layer(borehole_uuid, l):
    validate_geotechnical_properties(l.from_depth, l.to_depth, l.cohesion, l.unit_weight, l.friction_angle, l.moisture_content)
    existing = borehole_repository.get_soil_layers(borehole_uuid)
    check_layer_overlap(existing, l.from_depth, l.to_depth)
    
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    layer_uuid = borehole_repository.create_soil_layer(borehole_uuid, l)
    
    project_repository.log_activity(
        proj['id'],
        'layers_updated',
        f"Added soil layer {l.from_depth}m to {l.to_depth}m ({l.soil_type}) to Borehole {b['name']}."
    )
    return layer_uuid

def update_soil_layer(borehole_uuid, layer_uuid, l):
    validate_geotechnical_properties(l.from_depth, l.to_depth, l.cohesion, l.unit_weight, l.friction_angle, l.moisture_content)
    existing = borehole_repository.get_soil_layers(borehole_uuid)
    check_layer_overlap(existing, l.from_depth, l.to_depth, exclude_uuid=layer_uuid)
    
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    success = borehole_repository.update_soil_layer(layer_uuid, l)
    if success:
        project_repository.log_activity(
            proj['id'],
            'layers_updated',
            f"Updated soil strata layer to {l.from_depth}m - {l.to_depth}m ({l.soil_type}) in Borehole {b['name']}."
        )
    return success

def delete_soil_layer(layer_uuid, borehole_uuid):
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    success = borehole_repository.delete_soil_layer(layer_uuid)
    if success:
        project_repository.log_activity(
            proj['id'],
            'layers_updated',
            f"Removed soil strata layer from Borehole {b['name']} profile."
        )
    return success

def bulk_save_soil_layers(borehole_uuid, layers):
    sorted_layers = sorted(layers, key=lambda x: x.from_depth)
    for i in range(len(sorted_layers)):
        l = sorted_layers[i]
        validate_geotechnical_properties(l.from_depth, l.to_depth, l.cohesion, l.unit_weight, l.friction_angle, l.moisture_content)
        if i < len(sorted_layers) - 1:
            if sorted_layers[i].to_depth > sorted_layers[i+1].from_depth:
                raise ValueError(f"Strata overlap in bulk payload: Layer {sorted_layers[i].from_depth}m-{sorted_layers[i].to_depth}m overlaps with next layer starting at {sorted_layers[i+1].from_depth}m.")
                
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    saved_uuids = borehole_repository.bulk_save_soil_layers(borehole_uuid, sorted_layers)
    
    project_repository.log_activity(
        proj['id'],
        'layers_updated',
        f"Re-aligned soil strata layers list (bulk saved {len(layers)} layers) in Borehole {b['name']}."
    )
    return saved_uuids

# SPT Records Services
def list_spt_records(borehole_uuid):
    return borehole_repository.get_spt_records(borehole_uuid)

def create_spt_record(borehole_uuid, s):
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    spt_uuid = borehole_repository.create_spt_record(borehole_uuid, s)
    project_repository.log_activity(
        proj['id'],
        'spt_added',
        f"Logged SPT blow count N={s.n_value} at depth {s.depth}m in Borehole {b['name']}."
    )
    return spt_uuid

def update_spt_record(borehole_uuid, spt_uuid, s):
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    success = borehole_repository.update_spt_record(spt_uuid, s)
    if success:
        project_repository.log_activity(
            proj['id'],
            'spt_added',
            f"Updated SPT record at depth {s.depth}m (N={s.n_value}) in Borehole {b['name']}."
        )
    return success

def delete_spt_record(borehole_uuid, spt_uuid):
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    success = borehole_repository.delete_spt_record(spt_uuid)
    if success:
        project_repository.log_activity(
            proj['id'],
            'spt_added',
            f"Removed SPT record from Borehole {b['name']} log."
        )
    return success

# Groundwater Logs Services
def list_groundwater_logs(borehole_uuid):
    return borehole_repository.get_groundwater_logs(borehole_uuid)

def create_groundwater_log(borehole_uuid, w):
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    log_uuid = borehole_repository.create_groundwater_log(borehole_uuid, w)
    project_repository.log_activity(
        proj['id'],
        'groundwater_logged',
        f"Recorded groundwater level measurement: {w.water_depth}m on {w.measured_date} in Borehole {b['name']}."
    )
    return log_uuid

def delete_groundwater_log(borehole_uuid, log_uuid):
    proj = get_project_by_borehole_uuid(borehole_uuid)
    b = borehole_repository.get_borehole_by_uuid(borehole_uuid)
    success = borehole_repository.delete_groundwater_log(log_uuid)
    if success:
        project_repository.log_activity(
            proj['id'],
            'groundwater_logged',
            f"Deleted groundwater level measurement log from Borehole {b['name']}."
        )
    return success
