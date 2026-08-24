import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  RefreshCw, 
  Calculator, 
  Plus, 
  Trash2,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
} from 'chart.js';
import { Scatter, Line } from 'react-chartjs-2';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
);

interface Observation {
  id: string;
  specimen: number;
  normalStress: number;
  hdr: number;
  prr: number;
}

export const DirectShearPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // Test Information State
  const [testInfo, setTestInfo] = useState({
    regdNo: 'REG-001',
    lch: 0.01,
    pc: 0.15,
    L: 60.0,
    B: 60.0,
    D: 25.0
  });

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTestInfo(prev => ({
      ...prev,
      [name]: name === 'regdNo' ? value : parseFloat(value) || 0
    }));
  };

  // Observations State
  const [observations, setObservations] = useState<Observation[]>([
    { id: '1', specimen: 1, normalStress: 50, hdr: 0, prr: 0 },
    { id: '2', specimen: 1, normalStress: 50, hdr: 20, prr: 10 },
    { id: '3', specimen: 1, normalStress: 50, hdr: 40, prr: 18 },
    { id: '4', specimen: 1, normalStress: 50, hdr: 60, prr: 22 },
    { id: '5', specimen: 2, normalStress: 100, hdr: 0, prr: 0 },
    { id: '6', specimen: 2, normalStress: 100, hdr: 20, prr: 15 },
    { id: '7', specimen: 2, normalStress: 100, hdr: 40, prr: 28 },
    { id: '8', specimen: 2, normalStress: 100, hdr: 60, prr: 35 },
    { id: '9', specimen: 3, normalStress: 150, hdr: 0, prr: 0 },
    { id: '10', specimen: 3, normalStress: 150, hdr: 20, prr: 20 },
    { id: '11', specimen: 3, normalStress: 150, hdr: 40, prr: 38 },
    { id: '12', specimen: 3, normalStress: 150, hdr: 60, prr: 48 },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddObservation = () => {
    setObservations(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        specimen: prev.length > 0 ? prev[prev.length - 1].specimen : 1,
        normalStress: prev.length > 0 ? prev[prev.length - 1].normalStress : 50,
        hdr: 0,
        prr: 0
      }
    ]);
  };

  const handleRemoveObservation = (id: string) => {
    setObservations(prev => prev.filter(obs => obs.id !== id));
  };

  const handleObservationChange = (id: string, field: keyof Observation, value: number) => {
    setObservations(prev => prev.map(obs => 
      obs.id === id ? { ...obs, [field]: value } : obs
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    const processData = (data: any[]) => {
      const newObs: Observation[] = [];
      data.forEach((row: any) => {
        // Handle different column names flexibly based on python script requirements
        const spec = parseFloat(row['Specimen'] || row['specimen'] || row['Specimen No'] || '1');
        const normal = parseFloat(row['Normal Stress'] || row['Normal Stress (kPa)'] || row['normalStress'] || '0');
        const hdr = parseFloat(row['HDR'] || row['hdr'] || '0');
        const prr = parseFloat(row['PRR'] || row['prr'] || '0');
        
        if (!isNaN(spec) && !isNaN(normal) && !isNaN(hdr) && !isNaN(prr)) {
          newObs.push({
            id: Date.now().toString() + Math.random().toString(),
            specimen: spec,
            normalStress: normal,
            hdr,
            prr
          });
        }
      });
      if (newObs.length > 0) {
        setObservations(newObs);
      } else {
        alert("No valid data found in file. Ensure columns are named: Specimen, Normal Stress, HDR, PRR");
      }
    };

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          processData(results.data);
        },
        error: (error: any) => {
          console.error("Error parsing CSV:", error);
          alert("Error parsing CSV file.");
        }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processData(data);
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Please upload a .csv or .xlsx file.");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculations
  const calculatedData = useMemo(() => {
    const A0 = testInfo.L * testInfo.B;
    const V = testInfo.L * testInfo.B * testInfo.D;

    const rows = observations.map(obs => {
      const shearDef = obs.hdr * testInfo.lch;
      const shearLoad = obs.prr * testInfo.pc;
      const correctedArea = A0 * (1 - shearDef / testInfo.L);
      
      let tau = 0;
      let valid = true;
      if (correctedArea <= 0) {
        valid = false;
      } else {
        tau = (shearLoad * 1000) / correctedArea;
      }

      return {
        ...obs,
        shearDef,
        shearLoad,
        correctedArea,
        tau,
        valid
      };
    });

    // Group by specimen
    const specimensMap = new Map<number, typeof rows>();
    rows.forEach(r => {
      if (!specimensMap.has(r.specimen)) {
        specimensMap.set(r.specimen, []);
      }
      specimensMap.get(r.specimen)?.push(r);
    });

    const specimenResults: Array<{
      specimen: number;
      normalStress: number;
      peakTau: number;
      dataPoints: {x: number, y: number}[];
    }> = [];

    Array.from(specimensMap.keys()).sort((a, b) => a - b).forEach(spec => {
      const group = specimensMap.get(spec) || [];
      const validGroup = group.filter(g => g.valid);
      
      if (validGroup.length > 0) {
        const normalStress = validGroup[0].normalStress;
        let peakTau = 0;
        const dataPoints: {x: number, y: number}[] = [];
        
        validGroup.forEach(g => {
          if (g.tau > peakTau) peakTau = g.tau;
          dataPoints.push({ x: g.shearDef, y: g.tau });
        });
        
        dataPoints.sort((a, b) => a.x - b.x);
        
        specimenResults.push({
          specimen: spec,
          normalStress,
          peakTau,
          dataPoints
        });
      }
    });

    // Linear Regression (Failure Envelope)
    let c = 0;
    let phi = 0;
    
    if (specimenResults.length >= 2) {
      const n = specimenResults.length;
      const sumX = specimenResults.reduce((sum, r) => sum + r.normalStress, 0);
      const sumY = specimenResults.reduce((sum, r) => sum + r.peakTau, 0);
      const sumXY = specimenResults.reduce((sum, r) => sum + r.normalStress * r.peakTau, 0);
      const sumX2 = specimenResults.reduce((sum, r) => sum + r.normalStress * r.normalStress, 0);
      
      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      c = (sumY - m * sumX) / n;
      phi = Math.atan(m) * (180 / Math.PI);
    } else if (specimenResults.length === 1) {
      // Not enough points for regression, assume origin if c=0, but we can't really do regression
    }

    return {
      A0,
      V,
      rows,
      specimenResults,
      c,
      phi
    };
  }, [observations, testInfo]);


  // Chart Options
  const specimenChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Shear Stress vs Shear Deformation' }
    },
    scales: {
      x: { 
        title: { display: true, text: 'Shear Deformation (mm)' } 
      },
      y: { 
        title: { display: true, text: 'Shear Stress (kPa)' },
        beginAtZero: true
      }
    }
  };

  const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed'];

  const specimenChartData = {
    datasets: calculatedData.specimenResults.map((sr, idx) => ({
      label: `Specimen ${sr.specimen} (σ = ${sr.normalStress} kPa)`,
      data: sr.dataPoints,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      showLine: true,
      tension: 0.4
    }))
  };

  // Failure Envelope Data
  let maxSigma = 0;
  let maxTau = 0;
  calculatedData.specimenResults.forEach(sr => {
    if (sr.normalStress > maxSigma) maxSigma = sr.normalStress;
    if (sr.peakTau > maxTau) maxTau = sr.peakTau;
  });
  const maxAxis = Math.max(maxSigma, maxTau) * 1.2;

  const failureEnvelopeOptions = {
    responsive: true,
    aspectRatio: 1,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Failure Envelope' }
    },
    scales: {
      x: {
        title: { display: true, text: 'Normal Stress (kPa)' },
        min: 0,
        max: maxAxis
      },
      y: {
        title: { display: true, text: 'Peak Shear Stress (kPa)' },
        min: 0,
        max: maxAxis
      }
    }
  };

  const failureEnvelopeData = {
    datasets: [
      {
        type: 'scatter' as const,
        label: 'Peak Shear Stress',
        data: calculatedData.specimenResults.map(sr => ({ x: sr.normalStress, y: sr.peakTau })),
        backgroundColor: '#dc2626',
        pointRadius: 6,
      },
      {
        type: 'line' as const,
        label: 'Failure Envelope',
        data: [
          { x: 0, y: calculatedData.c },
          { x: maxAxis, y: calculatedData.c + maxAxis * Math.tan(calculatedData.phi * Math.PI / 180) }
        ],
        borderColor: '#2563eb',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      }
    ]
  };


  // Exports
  const handleExportCSV = () => {
    const headers = [
      "Regd. No.",
      "Specimen No.",
      "Normal Stress (kPa)",
      "HDR",
      "Shear Deformation (mm)",
      "PRR",
      "Shear Load (kN)",
      "Corrected Area (mm²)",
      "Shear Stress (kPa)"
    ];

    const csvRows = [headers];

    calculatedData.rows.forEach(r => {
      if (r.valid) {
        csvRows.push([
          testInfo.regdNo,
          r.specimen.toString(),
          r.normalStress.toString(),
          r.hdr.toFixed(3),
          r.shearDef.toFixed(3),
          r.prr.toFixed(3),
          r.shearLoad.toFixed(3),
          r.correctedArea.toFixed(3),
          r.tau.toFixed(3)
        ]);
      }
    });

    csvRows.push([]);
    csvRows.push(["", "", "", "", "", "", "", "Cohesion, c (kPa)", calculatedData.c.toFixed(3)]);
    csvRows.push(["", "", "", "", "", "", "", "Angle of shearing resistance, φ (degrees)", calculatedData.phi.toFixed(3)]);

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Direct_Shear_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span>Dashboard</span>
              <span>/</span>
              <span className="font-medium text-slate-900">Direct Shear Test</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Direct Shear Test</h1>
          </div>
        </div>

        {/* Experiment Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Experiment 13: Direct Shear Test</h2>
              <p className="text-slate-500 mt-1">IS 2720 Part 13</p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              Geotechnical
            </div>
          </div>
          <p className="text-slate-600 mt-4 max-w-3xl">
            Determine the shear strength parameters of a soil specimen under direct shear. This test 
            obtains the cohesion (c) and the angle of shearing resistance (φ) by testing specimens 
            at different normal stresses and measuring the peak shear stress.
          </p>
        </div>

        {/* Test Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Test Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Registration No.</label>
              <input
                type="text"
                name="regdNo"
                value={testInfo.regdNo}
                onChange={handleInfoChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Least Count (mm/div)</label>
              <input
                type="number"
                name="lch"
                step="0.01"
                value={testInfo.lch}
                onChange={handleInfoChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proving Ring Constant (kN/div)</label>
              <input
                type="number"
                name="pc"
                step="0.01"
                value={testInfo.pc}
                onChange={handleInfoChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Length, L (mm)</label>
              <input
                type="number"
                name="L"
                step="0.1"
                value={testInfo.L}
                onChange={handleInfoChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Breadth, B (mm)</label>
              <input
                type="number"
                name="B"
                step="0.1"
                value={testInfo.B}
                onChange={handleInfoChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Depth, D (mm)</label>
              <input
                type="number"
                name="D"
                step="0.1"
                value={testInfo.D}
                onChange={handleInfoChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Observation Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Observation Table</h3>
            <div className="flex space-x-3">
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </button>
              <button
                onClick={handleAddObservation}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Specimen No</th>
                  <th className="px-4 py-3">Normal Stress (kPa)</th>
                  <th className="px-4 py-3">HDR (div)</th>
                  <th className="px-4 py-3">PRR (div)</th>
                  <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((obs) => (
                  <tr key={obs.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={obs.specimen}
                        onChange={(e) => handleObservationChange(obs.id, 'specimen', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={obs.normalStress}
                        onChange={(e) => handleObservationChange(obs.id, 'normalStress', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="1"
                        value={obs.hdr}
                        onChange={(e) => handleObservationChange(obs.id, 'hdr', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="1"
                        value={obs.prr}
                        onChange={(e) => handleObservationChange(obs.id, 'prr', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveObservation(obs.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {observations.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No observations added. Add a row or upload an excel/csv file.
              </div>
            )}
          </div>
        </div>

        {/* Calculation Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Calculation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
            <p>Initial Area (A₀): <span className="font-medium text-slate-800">{calculatedData.A0.toFixed(2)} mm²</span></p>
            <p>Initial Volume (V): <span className="font-medium text-slate-800">{calculatedData.V.toFixed(2)} mm³</span></p>
          </div>
          
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Specimen</th>
                  <th className="px-4 py-3">Norm. Stress</th>
                  <th className="px-4 py-3">Shear Def (mm)</th>
                  <th className="px-4 py-3">Shear Load (kN)</th>
                  <th className="px-4 py-3">Corr. Area (mm²)</th>
                  <th className="px-4 py-3">Shear Stress (kPa)</th>
                </tr>
              </thead>
              <tbody>
                {calculatedData.rows.map((r, idx) => (
                  <tr key={idx} className={`border-b border-slate-100 ${!r.valid ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-2">{r.specimen}</td>
                    <td className="px-4 py-2">{r.normalStress}</td>
                    <td className="px-4 py-2">{r.shearDef.toFixed(3)}</td>
                    <td className="px-4 py-2">{r.shearLoad.toFixed(3)}</td>
                    <td className="px-4 py-2">
                      {r.valid ? r.correctedArea.toFixed(2) : 'Invalid (<=0)'}
                    </td>
                    <td className="px-4 py-2 font-medium text-blue-600">
                      {r.valid ? r.tau.toFixed(2) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Specimen Graph & Failure Envelope */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Specimen Graph</h3>
            <div className="h-80">
              <Line data={specimenChartData} options={specimenChartOptions} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Failure Envelope</h3>
            <div className="h-80 flex justify-center">
              <Line data={failureEnvelopeData as any} options={failureEnvelopeOptions} />
            </div>
          </div>
        </div>

        {/* Final Results */}
        <div className="bg-blue-600 rounded-xl shadow-sm p-6 text-white">
          <h3 className="text-lg font-semibold mb-6 opacity-90">Final Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-700/50 rounded-lg p-6 border border-blue-500/30">
              <div className="text-blue-200 text-sm mb-2">Cohesion, c</div>
              <div className="text-4xl font-bold">
                {calculatedData.c.toFixed(3)} <span className="text-xl font-normal opacity-80">kPa</span>
              </div>
            </div>
            <div className="bg-blue-700/50 rounded-lg p-6 border border-blue-500/30">
              <div className="text-blue-200 text-sm mb-2">Angle of Shearing Resistance, φ</div>
              <div className="text-4xl font-bold">
                {calculatedData.phi.toFixed(3)} <span className="text-xl font-normal opacity-80">°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex justify-end space-x-4">
          <button 
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </button>
        </div>

      </div>
    </div>
  );
};
