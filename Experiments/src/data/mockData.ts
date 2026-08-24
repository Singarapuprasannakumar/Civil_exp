import { SoilTest, Project, Sample, Equipment, ReportItem, NotificationItem } from '../types';

export const mockSoilTests: SoilTest[] = [
  {
    id: 1,
    num: '01',
    title: 'Moisture Content',
    desc: 'Determine the moisture content of soil sample using oven drying method.',
    iconName: 'Droplet',
    category: 'Index Properties',
    status: 'Active',
    standard: 'ASTM D2216 / IS 2720 Part 2',
    inputs: [
      { label: 'Container Mass M1', key: 'm1', unit: 'g', defaultValue: 25.4 },
      { label: 'Wet Soil + Container M2', key: 'm2', unit: 'g', defaultValue: 142.8 },
      { label: 'Dry Soil + Container M3', key: 'm3', unit: 'g', defaultValue: 124.6 }
    ]
  },
  {
    id: 2,
    num: '02',
    title: 'Specific Gravity',
    desc: 'Determine specific gravity of soil particles using pycnometer bottle.',
    iconName: 'Scale',
    category: 'Index Properties',
    status: 'Active',
    standard: 'ASTM D854 / IS 2720 Part 3',
    inputs: [
      { label: 'Pycnometer Mass M1', key: 'm1', unit: 'g', defaultValue: 450.0 },
      { label: 'Pycnometer + Dry Soil M2', key: 'm2', unit: 'g', defaultValue: 950.0 },
      { label: 'Pycnometer + Soil + Water M3', key: 'm3', unit: 'g', defaultValue: 1580.0 },
      { label: 'Pycnometer + Water M4', key: 'm4', unit: 'g', defaultValue: 1265.0 }
    ]
  },
  {
    id: 3,
    num: '03',
    title: 'Liquid Limit',
    desc: 'Determine liquid limit using Casagrande percussion cup apparatus.',
    iconName: 'TestTube2',
    category: 'Index Properties',
    status: 'Active',
    standard: 'ASTM D4318 / IS 2720 Part 5',
    inputs: [
      { label: 'Number of Blows N', key: 'blows', unit: 'blows', defaultValue: 25 },
      { label: 'Container Mass M1', key: 'm1', unit: 'g', defaultValue: 22.1 },
      { label: 'Wet Soil + Container M2', key: 'm2', unit: 'g', defaultValue: 68.4 },
      { label: 'Dry Soil + Container M3', key: 'm3', unit: 'g', defaultValue: 54.2 }
    ]
  },
  {
    id: 4,
    num: '04',
    title: 'Plastic Limit',
    desc: 'Determine plastic limit by 3mm thread rolling technique.',
    iconName: 'PenTool',
    category: 'Index Properties',
    status: 'Active',
    standard: 'ASTM D4318 / IS 2720 Part 5',
    inputs: [
      { label: 'Container Mass M1', key: 'm1', unit: 'g', defaultValue: 18.5 },
      { label: 'Wet Soil + Container M2', key: 'm2', unit: 'g', defaultValue: 42.3 },
      { label: 'Dry Soil + Container M3', key: 'm3', unit: 'g', defaultValue: 38.1 }
    ]
  },
  {
    id: 5,
    num: '05',
    title: 'Shrinkage Limit',
    desc: 'Determine shrinkage limit using mercury displacement method.',
    iconName: 'Layers',
    category: 'Index Properties',
    status: 'Active',
    standard: 'ASTM D4943 / IS 2720 Part 6',
    inputs: [
      { label: 'Wet Soil Volume V1', key: 'v1', unit: 'cm³', defaultValue: 30.2 },
      { label: 'Dry Soil Volume V2', key: 'v2', unit: 'cm³', defaultValue: 18.4 },
      { label: 'Initial Water Content w1', key: 'w1', unit: '%', defaultValue: 42.5 }
    ]
  },
  {
    id: 6,
    num: '06',
    title: 'Differential Free Swell Index',
    desc: 'Determine Free Swell Index (DFSI) for expansive clay assessment.',
    iconName: 'Activity',
    category: 'Classification',
    status: 'Active',
    standard: 'IS 2720 Part 40',
    inputs: [
      { label: 'Volume in Kerosene Vk', key: 'vk', unit: 'cm³', defaultValue: 10.0 },
      { label: 'Volume in Water Vw', key: 'vw', unit: 'cm³', defaultValue: 18.5 }
    ]
  },
  {
    id: 7,
    num: '07',
    title: 'Sand Replacement Method',
    desc: 'Determine field dry density using sand pouring cylinder method.',
    iconName: 'Cone',
    category: 'Field',
    status: 'Active',
    standard: 'ASTM D1556 / IS 2720 Part 28',
    inputs: [
      { label: 'Mass of Excavated Soil M', key: 'm', unit: 'g', defaultValue: 2850.0 },
      { label: 'Mass of Sand in Cone Mc', key: 'mc', unit: 'g', defaultValue: 420.0 },
      { label: 'Density of Calibrated Sand', key: 'rho_s', unit: 'g/cm³', defaultValue: 1.42 }
    ]
  },
  {
    id: 8,
    num: '08',
    title: 'Core Cutter Method',
    desc: 'Determine field dry density using cylindrical core cutter apparatus.',
    iconName: 'Cylinder',
    category: 'Field',
    status: 'Active',
    standard: 'IS 2720 Part 29',
    inputs: [
      { label: 'Core Cutter Volume V', key: 'v', unit: 'cm³', defaultValue: 1000.0 },
      { label: 'Mass of Empty Cutter M1', key: 'm1', unit: 'g', defaultValue: 980.0 },
      { label: 'Cutter + Wet Soil M2', key: 'm2', unit: 'g', defaultValue: 2950.0 }
    ]
  },
  {
    id: 9,
    num: '09',
    title: 'Sieve Analysis',
    desc: 'Particle size distribution analysis by dry and wet sieving.',
    iconName: 'Filter',
    category: 'Classification',
    status: 'Active',
    standard: 'ASTM D422 / IS 2720 Part 4',
    inputs: [
      { label: 'Total Sample Dry Weight', key: 'w_total', unit: 'g', defaultValue: 500.0 },
      { label: 'Retained on 4.75mm Sieve', key: 'w_475', unit: 'g', defaultValue: 45.0 },
      { label: 'Retained on 2.00mm Sieve', key: 'w_200', unit: 'g', defaultValue: 85.0 },
      { label: 'Retained on 0.075mm Sieve', key: 'w_075', unit: 'g', defaultValue: 240.0 }
    ]
  },
  {
    id: 10,
    num: '10',
    title: 'IS Light Compaction Test',
    desc: 'Determine compaction characteristics & optimum moisture content (OMC).',
    iconName: 'Hammer',
    category: 'Compaction',
    status: 'Active',
    standard: 'ASTM D698 / IS 2720 Part 7',
    inputs: [
      { label: 'Mold Volume V', key: 'v', unit: 'cm³', defaultValue: 1000.0 },
      { label: 'Max Dry Density MDD', key: 'mdd', unit: 'g/cm³', defaultValue: 1.84 },
      { label: 'Optimum Moisture Content OMC', key: 'omc', unit: '%', defaultValue: 14.2 }
    ]
  },
  {
    id: 11,
    num: '11',
    title: 'Falling Head Permeability Test',
    desc: 'Determine coefficient of permeability (k) for fine-grained clays.',
    iconName: 'Gauge',
    category: 'Permeability',
    status: 'Active',
    standard: 'ASTM D2434 / IS 2720 Part 17',
    inputs: [
      { label: 'Standpipe Cross Area a', key: 'a', unit: 'cm²', defaultValue: 0.5 },
      { label: 'Sample Height L', key: 'l', unit: 'cm', defaultValue: 12.5 },
      { label: 'Sample Cross Area A', key: 'area', unit: 'cm²', defaultValue: 78.5 },
      { label: 'Initial Head h1', key: 'h1', unit: 'cm', defaultValue: 100.0 },
      { label: 'Final Head h2', key: 'h2', unit: 'cm', defaultValue: 40.0 },
      { label: 'Time Elapsed t', key: 't', unit: 's', defaultValue: 1800 }
    ]
  },
  {
    id: 12,
    num: '12',
    title: 'Constant Head Permeability Test',
    desc: 'Determine coefficient of permeability (k) for coarse sands and gravels.',
    iconName: 'Waves',
    category: 'Permeability',
    status: 'Active',
    standard: 'ASTM D2434 / IS 2720 Part 17',
    inputs: [
      { label: 'Discharge Volume Q', key: 'q', unit: 'cm³', defaultValue: 450.0 },
      { label: 'Head Difference h', key: 'h', unit: 'cm', defaultValue: 50.0 },
      { label: 'Sample Area A', key: 'area', unit: 'cm²', defaultValue: 78.5 },
      { label: 'Sample Length L', key: 'l', unit: 'cm', defaultValue: 15.0 },
      { label: 'Time t', key: 't', unit: 's', defaultValue: 300 }
    ]
  },
  {
    id: 13,
    num: '13',
    title: 'Direct Shear Test',
    desc: 'Determine shear strength parameters: Cohesion (c) and Angle of Friction (φ).',
    iconName: 'MoveHorizontal',
    category: 'Strength',
    status: 'Active',
    standard: 'ASTM D3080 / IS 2720 Part 13',
    inputs: [
      { label: 'Normal Stress 1', key: 'sig1', unit: 'kPa', defaultValue: 50 },
      { label: 'Shear Stress Peak 1', key: 'tau1', unit: 'kPa', defaultValue: 42 },
      { label: 'Normal Stress 2', key: 'sig2', unit: 'kPa', defaultValue: 100 },
      { label: 'Shear Stress Peak 2', key: 'tau2', unit: 'kPa', defaultValue: 75 }
    ]
  },
  {
    id: 14,
    num: '14',
    title: 'UCS Test',
    desc: 'Unconfined compressive strength (qu) test for cohesive soil specimens.',
    iconName: 'ArrowDownToLine',
    category: 'Strength',
    status: 'Active',
    standard: 'ASTM D2166 / IS 2720 Part 10',
    inputs: [
      { label: 'Specimen Diameter D', key: 'd', unit: 'mm', defaultValue: 38.0 },
      { label: 'Specimen Height L', key: 'l', unit: 'mm', defaultValue: 76.0 },
      { label: 'Peak Load P', key: 'p', unit: 'N', defaultValue: 285.0 }
    ]
  },
  {
    id: 15,
    num: '15',
    title: 'Vane Shear Test',
    desc: 'Determine undrained shear strength of soft sensitive clay.',
    iconName: 'Compass',
    category: 'Strength',
    status: 'Active',
    standard: 'ASTM D2573 / IS 2720 Part 30',
    inputs: [
      { label: 'Torque T', key: 'torque', unit: 'N·m', defaultValue: 12.4 },
      { label: 'Vane Height H', key: 'h', unit: 'mm', defaultValue: 100.0 },
      { label: 'Vane Diameter D', key: 'd', unit: 'mm', defaultValue: 50.0 }
    ]
  },
  {
    id: 16,
    num: '16',
    title: 'California Bearing Ratio (CBR)',
    desc: 'California Bearing Ratio test for pavement subgrade evaluation.',
    iconName: 'ShieldCheck',
    category: 'Compaction',
    status: 'Active',
    standard: 'ASTM D1883 / IS 2720 Part 16',
    inputs: [
      { label: 'Load at 2.5mm Penetration', key: 'p25', unit: 'kgf', defaultValue: 98.0 },
      { label: 'Load at 5.0mm Penetration', key: 'p50', unit: 'kgf', defaultValue: 142.0 },
      { label: 'Swell Percentage', key: 'swell', unit: '%', defaultValue: 0.8 }
    ]
  }
];

export const mockSamples: Sample[] = [
  {
    id: 'SMP-2026-001',
    sampleNumber: 'S-2026-BH01-01',
    projectId: 'PRJ-2026-001',
    projectName: 'NH-16 Expressway Expansion',
    boreholeId: 'BH-01',
    boreholeNo: 'BH-01',
    depth: '3.5m - 4.0m',
    soilDescription: 'Silty Clay of Medium Plasticity (CI), Reddish Brown',
    stage: 'Testing',
    verificationStatus: 'Calculated',
    receivedDate: '2026-07-28',
    assignedEngineer: 'Dr. Rajesh Sharma, PE',
    tests: [
      { testNum: '01', testName: 'Moisture Content', status: 'Completed', resultSummary: 'w = 18.35%' },
      { testNum: '03', testName: 'Liquid Limit', status: 'Completed', resultSummary: 'LL = 42.0%' },
      { testNum: '04', testName: 'Plastic Limit', status: 'Completed', resultSummary: 'PL = 24.0%' },
      { testNum: '13', testName: 'Direct Shear Test', status: 'In Progress' },
      { testNum: '16', testName: 'CBR Test', status: 'Pending' }
    ]
  },
  {
    id: 'SMP-2026-002',
    sampleNumber: 'S-2026-BH02-04',
    projectId: 'PRJ-2026-001',
    projectName: 'NH-16 Expressway Expansion',
    boreholeId: 'BH-02',
    boreholeNo: 'BH-02',
    depth: '6.0m - 6.5m',
    soilDescription: 'Dense Well-Graded Sand with Gravel (SW-GW)',
    stage: 'Verified',
    verificationStatus: 'Verified',
    receivedDate: '2026-07-25',
    assignedEngineer: 'Ananya Verma, Lead Geotechnical',
    tests: [
      { testNum: '01', testName: 'Moisture Content', status: 'Completed', resultSummary: 'w = 11.20%' },
      { testNum: '02', testName: 'Specific Gravity', status: 'Completed', resultSummary: 'Gs = 2.65' },
      { testNum: '09', testName: 'Sieve Analysis', status: 'Completed', resultSummary: 'Cu = 6.2, Cc = 1.4' },
      { testNum: '12', testName: 'Constant Head Permeability', status: 'Completed', resultSummary: 'k = 3.2×10⁻³ cm/s' }
    ]
  },
  {
    id: 'SMP-2026-003',
    sampleNumber: 'S-2026-BH03-02',
    projectId: 'PRJ-2026-002',
    projectName: 'Metro Line 4 Elevated Viaduct Foundation',
    boreholeId: 'BH-03',
    boreholeNo: 'BH-03',
    depth: '12.0m - 12.5m',
    soilDescription: 'Soft Stiff Black Cotton Clay (CH), High Swell',
    stage: 'Approved',
    verificationStatus: 'Approved',
    receivedDate: '2026-07-20',
    assignedEngineer: 'Priya Das, Geotechnical Specialist',
    tests: [
      { testNum: '01', testName: 'Moisture Content', status: 'Completed', resultSummary: 'w = 34.50%' },
      { testNum: '06', testName: 'DFSI', status: 'Completed', resultSummary: 'FSI = 85% (Very High)' },
      { testNum: '14', testName: 'UCS Test', status: 'Completed', resultSummary: 'qu = 145 kPa' }
    ]
  }
];

export const mockProjects: Project[] = [
  {
    id: 'PRJ-2026-001',
    name: 'NH-16 Expressway Expansion',
    client: 'National Highways Authority of India (NHAI)',
    location: 'Km 142+500 to 186+200, Section B',
    engineer: 'Dr. Rajesh Sharma, PE',
    status: 'In Progress',
    deadline: '2026-09-15',
    createdDate: '2026-07-01',
    sampleCount: 24,
    completedTests: 18,
    totalTests: 24,
    boreholes: [
      { id: 'BH-01', boreholeNo: 'BH-01', depth: '15m', elevation: '+12.5m', waterTableDepth: '2.4m', samples: [mockSamples[0]] },
      { id: 'BH-02', boreholeNo: 'BH-02', depth: '18m', elevation: '+14.1m', waterTableDepth: '3.1m', samples: [mockSamples[1]] }
    ]
  },
  {
    id: 'PRJ-2026-002',
    name: 'Metro Line 4 Elevated Viaduct Foundation',
    client: 'L&T Construction Infrastructure',
    location: 'Pier P-102 to P-145, Station Sector 5',
    engineer: 'Ananya Verma, Lead Geotechnical',
    status: 'In Progress',
    deadline: '2026-08-30',
    createdDate: '2026-07-10',
    sampleCount: 16,
    completedTests: 12,
    totalTests: 16,
    boreholes: [
      { id: 'BH-03', boreholeNo: 'BH-03', depth: '25m', elevation: '+8.2m', waterTableDepth: '1.8m', samples: [mockSamples[2]] }
    ]
  },
  {
    id: 'PRJ-2026-003',
    name: 'Offshore Petroleum Tank Farm Foundation',
    client: 'Indian Oil Corporation Ltd (IOCL)',
    location: 'Paradip Port Terminal Dock Area',
    engineer: 'Vikramaditya Rao, Chief Consultant',
    status: 'Under Review',
    deadline: '2026-08-10',
    createdDate: '2026-06-15',
    sampleCount: 12,
    completedTests: 12,
    totalTests: 12,
    boreholes: []
  },
  {
    id: 'PRJ-2026-004',
    name: 'Coastal Earthen Dam Embankment Stability',
    client: 'State Irrigation & Water Resources Board',
    location: 'Kalinganagar River Basin Dyke',
    engineer: 'Priya Das, Geotechnical Specialist',
    status: 'On Hold',
    deadline: '2026-10-01',
    createdDate: '2026-07-20',
    sampleCount: 8,
    completedTests: 3,
    totalTests: 8,
    boreholes: []
  }
];

export const mockEquipment: Equipment[] = [
  {
    id: 'EQP-01',
    name: 'Digital Thermostatic Moisture Oven',
    model: 'Memmert UN55 Lab',
    serial: 'MM-2024-8841',
    status: 'Ready',
    operator: 'Rajesh Kumar',
    hoursUsed: 1420,
    temperature: '105.4°C',
    lastCalibrated: '2026-05-10',
    nextCalibration: '2026-11-10',
    healthScore: 98,
    utilizationRate: 84
  },
  {
    id: 'EQP-02',
    name: 'Motorized Casagrande Liquid Limit Device',
    model: 'GeoTest LL-200',
    serial: 'GT-9921-X',
    status: 'Busy',
    operator: 'Ankita Verma',
    hoursUsed: 890,
    lastCalibrated: '2026-04-15',
    nextCalibration: '2026-10-15',
    healthScore: 92,
    utilizationRate: 78
  },
  {
    id: 'EQP-03',
    name: 'Automatic Triaxial & UCS Compression Machine (50kN)',
    model: 'ELE International Tritest 50',
    serial: 'ELE-50KN-2023',
    status: 'Calibration Due',
    operator: 'Suresh Das',
    hoursUsed: 2150,
    lastCalibrated: '2025-08-01',
    nextCalibration: '2026-08-01',
    healthScore: 85,
    utilizationRate: 91
  },
  {
    id: 'EQP-04',
    name: 'Electromagnetic Sieve Shaker with Frequency Control',
    model: 'Humboldt H-4325',
    serial: 'HB-7721-S',
    status: 'Running',
    operator: 'Rohan Naik',
    hoursUsed: 1100,
    lastCalibrated: '2026-06-20',
    nextCalibration: '2026-12-20',
    healthScore: 96,
    utilizationRate: 65
  },
  {
    id: 'EQP-05',
    name: 'Falling & Constant Head Permeability Apparatus Set',
    model: 'Wykeham Farrance Perm-Flex',
    serial: 'WF-PF-301',
    status: 'Idle',
    operator: 'Priya Das',
    hoursUsed: 620,
    lastCalibrated: '2026-03-12',
    nextCalibration: '2026-09-12',
    healthScore: 94,
    utilizationRate: 42
  }
];

export const mockReports: ReportItem[] = [
  {
    id: 'REP-2026-001',
    title: 'Sieve Analysis & Particle Gradation Curve Report',
    projectId: 'PRJ-2026-001',
    projectName: 'NH-16 Expressway Expansion',
    sampleId: 'S-2026-BH02-04',
    clientName: 'National Highways Authority of India (NHAI)',
    engineer: 'Ananya Verma, Lead Geotechnical',
    timestamp: '2026-08-01 09:30 AM',
    status: 'Approved',
    fileSize: '2.4 MB'
  },
  {
    id: 'REP-2026-002',
    title: 'IS Light Compaction & Moisture-Density Curve Report',
    projectId: 'PRJ-2026-001',
    projectName: 'NH-16 Expressway Expansion',
    sampleId: 'S-2026-BH01-01',
    clientName: 'National Highways Authority of India (NHAI)',
    engineer: 'Dr. Rajesh Sharma, PE',
    timestamp: '2026-08-01 08:15 AM',
    status: 'Approved',
    fileSize: '1.8 MB'
  },
  {
    id: 'REP-2026-003',
    title: 'Direct Shear Stress Envelope & Mohr Failure Diagram',
    projectId: 'PRJ-2026-002',
    projectName: 'Metro Line 4 Elevated Viaduct Foundation',
    sampleId: 'S-2026-BH03-02',
    clientName: 'L&T Construction Infrastructure',
    engineer: 'Priya Das, Geotechnical Specialist',
    timestamp: '2026-07-31 04:45 PM',
    status: 'In Review',
    fileSize: '3.1 MB'
  },
  {
    id: 'REP-2026-004',
    title: 'California Bearing Ratio (CBR) Pavement Subgrade Evaluation',
    projectId: 'PRJ-2026-001',
    projectName: 'NH-16 Expressway Expansion',
    sampleId: 'S-2026-BH01-01',
    clientName: 'National Highways Authority of India (NHAI)',
    engineer: 'Dr. Rajesh Sharma, PE',
    timestamp: '2026-07-30 02:20 PM',
    status: 'Approved',
    fileSize: '4.0 MB'
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    title: 'New Borehole Sample Registered',
    message: 'Sample S-2026-BH04-01 from NH-16 Expressway assigned to Dr. Rajesh Sharma.',
    category: 'New Sample',
    timestamp: '10 mins ago',
    read: false
  },
  {
    id: 'NOTIF-02',
    title: 'Calibration Warning: 50kN Compression Frame',
    message: 'Equipment EQP-03 requires recalibration per ISO 17025 standards.',
    category: 'Calibration Due',
    timestamp: '1 hour ago',
    read: false
  },
  {
    id: 'NOTIF-03',
    title: 'Geotechnical Report Approved',
    message: 'Report REP-2026-001 approved by Chief Engineer Ananya Verma.',
    category: 'Report Approved',
    timestamp: '2 hours ago',
    read: true
  },
  {
    id: 'NOTIF-04',
    title: 'AI Prediction Ready: CBR Value',
    message: 'GeoLab AI model predicted 7.2% CBR for Sample S-2026-BH01-01.',
    category: 'AI Prediction Ready',
    timestamp: '4 hours ago',
    read: true
  }
];

export const mockActivity = [
  { id: '1', title: 'Moisture Content test completed', sampleId: 'S-2026-BH01-01', timestamp: '10 mins ago', type: 'completed' },
  { id: '2', title: 'New borehole sample registered', sampleId: 'S-2026-BH04-01', timestamp: '1 hour ago', type: 'pending' },
  { id: '3', title: 'CBR Report generated & signed', sampleId: 'REP-2026-004', timestamp: '3 hours ago', type: 'generated' },
  { id: '4', title: 'Direct Shear test running', sampleId: 'S-2026-BH03-02', timestamp: '5 hours ago', type: 'running' }
];
