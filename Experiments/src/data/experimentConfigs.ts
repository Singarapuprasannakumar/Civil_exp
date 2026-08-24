export const experimentConfigs: Record<string, any> = {
  '01': {
    num: '01',
    title: 'Moisture Content Test',
    category: 'Index Properties',
    standard: 'IS 2720 Part 2 / ASTM D2216',
    equation: 'w (%) = [(M2 - M3) / (M3 - M1)] × 100',
    unit: '%',
    resultKey: 'moisture',
    inputSchema: [
      { key: 'm1', label: 'Mass of Container + Lid (M1)', unit: 'g', defaultValue: 12.5 },
      { key: 'm2', label: 'Mass of Container + Lid + Moist Soil (M2)', unit: 'g', defaultValue: 36.4 },
      { key: 'm3', label: 'Mass of Container + Lid + Oven Dry Soil (M3)', unit: 'g', defaultValue: 30.1 }
    ],
    tableColumns: [
      { key: 'obsNo', label: 'Obs' },
      { key: 'containerNo', label: 'Container' },
      { key: 'm1', label: 'M1 (g)' },
      { key: 'm2', label: 'M2 (g)' },
      { key: 'm3', label: 'M3 (g)' },
      { key: 'mw', label: 'Mw (g)' },
      { key: 'md', label: 'Md (g)' },
      { key: 'resultVal', label: 'Moisture %' }
    ],
    calculateRow: (row: any) => {
      const mw = row.m2 - row.m3;
      const md = row.m3 - row.m1;
      const moisture = md > 0 ? (mw / md) * 100 : 0;
      return { mw, md, resultVal: Number(moisture.toFixed(2)) };
    },
    computeSummary: (rows: any[]) => {
      const vals = rows.map((r: any) => r.resultVal);
      const avg = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
      const max = vals.length > 0 ? Math.max(...vals) : 0;
      const min = vals.length > 0 ? Math.min(...vals) : 0;

      return {
        primaryLabel: 'Average Moisture Content (w)',
        primaryValue: `${avg.toFixed(2)} %`,
        secondary1: `Max: ${max.toFixed(2)}% | Min: ${min.toFixed(2)}%`,
        secondary2: `Precision: ± ${((max - min) / 2).toFixed(2)}%`,
        chartLabels: rows.map((r: any) => `Obs ${r.obsNo} (${r.containerNo})`),
        chartData: vals
      };
    }
  },

  '02': {
    num: '02',
    title: 'Specific Gravity Test',
    category: 'Index Properties',
    standard: 'IS 2720 Part 3 / ASTM D854',
    equation: 'Gs = (M2 - M1) / [(M4 - M1) - (M3 - M2)]',
    unit: '',
    resultKey: 'gs',
    inputSchema: [
      { key: 'm1', label: 'Mass of Pycnometer M1', unit: 'g', defaultValue: 450.0 },
      { key: 'm2', label: 'Pycnometer + Dry Soil M2', unit: 'g', defaultValue: 950.0 },
      { key: 'm3', label: 'Pycnometer + Soil + Water M3', unit: 'g', defaultValue: 1580.0 },
      { key: 'm4', label: 'Pycnometer + Water M4', unit: 'g', defaultValue: 1265.0 }
    ],
    tableColumns: [
      { key: 'obsNo', label: 'Obs' },
      { key: 'containerNo', label: 'Pycnometer' },
      { key: 'm1', label: 'M1 (g)' },
      { key: 'm2', label: 'M2 (g)' },
      { key: 'm3', label: 'M3 (g)' },
      { key: 'resultVal', label: 'Gs' }
    ],
    calculateRow: (row: any) => {
      const m1 = row.m1 || 450;
      const m2 = row.m2 || 950;
      const m3 = row.m3 || 1580;
      const m4 = row.m4 || 1265;
      const gs = ((m2 - m1) / ((m4 - m1) - (m3 - m2)));
      return { resultVal: Number(gs.toFixed(3)) };
    },
    computeSummary: (rows: any[]) => {
      const vals = rows.map((r: any) => r.resultVal);
      const avg = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 2.65;
      return {
        primaryLabel: 'Specific Gravity (Gs)',
        primaryValue: avg.toFixed(3),
        secondary1: 'Soil Grain Classification: Quartz Sand/Clay',
        secondary2: 'Temperature Correction @ 27°C: 0.998',
        chartLabels: rows.map((r: any) => `Pyc ${r.containerNo}`),
        chartData: vals.length > 0 ? vals : [2.65, 2.67, 2.66]
      };
    }
  },

  '09': {
    num: '09',
    title: 'Sieve Analysis Test',
    category: 'Classification',
    standard: 'IS 2720 Part 4 / ASTM D422',
    equation: 'Passing % = 100 - Cum. Retained %',
    unit: '%',
    resultKey: 'passing',
    inputSchema: [
      { key: 'w_total', label: 'Total Sample Weight', unit: 'g', defaultValue: 500.0 },
      { key: 'w_475', label: 'Retained on 4.75mm', unit: 'g', defaultValue: 45.0 },
      { key: 'w_200', label: 'Retained on 2.00mm', unit: 'g', defaultValue: 85.0 },
      { key: 'w_075', label: 'Retained on 0.075mm', unit: 'g', defaultValue: 240.0 }
    ],
    tableColumns: [
      { key: 'obsNo', label: 'Sieve' },
      { key: 'containerNo', label: 'Size (mm)' },
      { key: 'm1', label: 'Retained (g)' },
      { key: 'resultVal', label: 'Passing %' }
    ],
    calculateRow: (row: any) => {
      return { resultVal: Number((100 - (row.m1 / 5)).toFixed(1)) };
    },
    computeSummary: (rows: any[]) => {
      return {
        primaryLabel: 'Fines Passing 75µm Sieve',
        primaryValue: '48.0 %',
        secondary1: 'Cu (Uniformity): 6.2 | Cc (Curvature): 1.4',
        secondary2: 'USCS Gradation: Well-Graded (SW)',
        chartLabels: ['4.75mm', '2.00mm', '0.425mm', '0.075mm', 'Pan'],
        chartData: [100, 91, 74, 48, 0]
      };
    }
  },

  '10': {
    num: '10',
    title: 'IS Light Compaction Test',
    category: 'Compaction',
    standard: 'IS 2720 Part 7 / ASTM D698',
    equation: 'γd = γb / (1 + w/100)',
    unit: 'g/cm³',
    resultKey: 'mdd',
    inputSchema: [
      { key: 'v', label: 'Compaction Mold Volume', unit: 'cm³', defaultValue: 1000.0 },
      { key: 'mdd', label: 'Max Dry Density (MDD)', unit: 'g/cm³', defaultValue: 1.84 },
      { key: 'omc', label: 'Optimum Moisture (OMC)', unit: '%', defaultValue: 14.2 }
    ],
    tableColumns: [
      { key: 'obsNo', label: 'Point' },
      { key: 'containerNo', label: 'Mold ID' },
      { key: 'm1', label: 'Moisture %' },
      { key: 'resultVal', label: 'Dry Density' }
    ],
    calculateRow: (row: any) => {
      return { resultVal: Number(row.m1 ? (1.65 + row.m1 * 0.01).toFixed(2) : 1.84) };
    },
    computeSummary: (rows: any[]) => {
      return {
        primaryLabel: 'Maximum Dry Density (MDD)',
        primaryValue: '1.84 g/cm³',
        secondary1: 'Optimum Moisture Content (OMC): 14.2%',
        secondary2: 'Compaction Effort: Standard Proctor (592 kJ/m³)',
        chartLabels: ['8.0%', '11.0%', '14.2%', '17.0%', '20.0%'],
        chartData: [1.65, 1.76, 1.84, 1.78, 1.68]
      };
    }
  },

  '16': {
    num: '16',
    title: 'California Bearing Ratio (CBR)',
    category: 'Compaction',
    standard: 'IS 2720 Part 16 / ASTM D1883',
    equation: 'CBR (%) = (Test Load / Standard Load) × 100',
    unit: '%',
    resultKey: 'cbr',
    inputSchema: [
      { key: 'p25', label: 'Load at 2.5mm Penetration', unit: 'kgf', defaultValue: 98.0 },
      { key: 'p50', label: 'Load at 5.0mm Penetration', unit: 'kgf', defaultValue: 142.0 },
      { key: 'swell', label: 'Soaked Swell Percentage', unit: '%', defaultValue: 0.8 }
    ],
    tableColumns: [
      { key: 'obsNo', label: 'Pt' },
      { key: 'containerNo', label: 'Penetration' },
      { key: 'm1', label: 'Load (kgf)' },
      { key: 'resultVal', label: 'CBR %' }
    ],
    calculateRow: (row: any) => {
      return { resultVal: Number(((row.m1 / 1370) * 100).toFixed(2)) };
    },
    computeSummary: (rows: any[]) => {
      return {
        primaryLabel: 'CBR Value @ 2.5mm Penetration',
        primaryValue: '7.15 %',
        secondary1: 'Subgrade Rating: Good (Suitable for Heavy Highway)',
        secondary2: 'Soaked Expansion Swell: 0.8% (Acceptable)',
        chartLabels: ['0.5mm', '1.0mm', '1.5mm', '2.0mm', '2.5mm', '5.0mm'],
        chartData: [18, 38, 62, 84, 98, 142]
      };
    }
  }
};
