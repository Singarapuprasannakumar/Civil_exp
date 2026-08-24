import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, QrCode, FileText } from 'lucide-react';

interface PdfReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const PdfReportPreviewModal: React.FC<PdfReportPreviewModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Official Geotechnical Report PDF Document Preview
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE REPORT CANVAS */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950">
          <div className="bg-white text-slate-900 rounded-xl p-8 shadow-xl border border-slate-200 max-w-2xl mx-auto space-y-6 text-xs">
            {/* REPORT HEADER */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900">GEOLAB AI ENTERPRISE LABORATORIES</h1>
                <p className="text-[11px] text-slate-600">Accredited ISO/IEC 17025 Geotechnical Soil Testing Facility</p>
                <p className="text-[10px] text-slate-500">Report No: <strong>REP-2026-NH16-004</strong> | Date: <strong>01 August 2026</strong></p>
              </div>
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                GeoLab
              </div>
            </div>

            {/* PROJECT METADATA */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Project Name</div>
                <div className="font-bold text-slate-900">NH-16 Expressway Expansion (Km 142+500)</div>
                <div className="text-[10px] text-slate-500 mt-1">Client: National Highways Authority of India</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Borehole & Sample ID</div>
                <div className="font-bold text-slate-900">Sample S-2026-BH01-01 (Depth: 3.5m)</div>
                <div className="text-[10px] text-slate-500 mt-1">Tested By: Dr. Rajesh Sharma, PE</div>
              </div>
            </div>

            {/* TEST RESULTS SUMMARY TABLE */}
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                Standard Soil Mechanics Test Summary (IS 2720 / ASTM)
              </h3>
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Parameter</th>
                    <th className="p-2 border-r border-slate-300">Test Standard</th>
                    <th className="p-2 border-r border-slate-300">Observed Value</th>
                    <th className="p-2">Specification Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-medium">Natural Moisture Content (w)</td>
                    <td className="p-2 border-r border-slate-300">IS 2720 Part 2</td>
                    <td className="p-2 border-r border-slate-300 font-bold text-blue-700">18.35 %</td>
                    <td className="p-2">Optimum ± 2%</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-medium">Liquid Limit (LL)</td>
                    <td className="p-2 border-r border-slate-300">IS 2720 Part 5</td>
                    <td className="p-2 border-r border-slate-300 font-bold text-blue-700">42.00 %</td>
                    <td className="p-2">35% - 50% (CI)</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-medium">Plastic Limit (PL)</td>
                    <td className="p-2 border-r border-slate-300">IS 2720 Part 5</td>
                    <td className="p-2 border-r border-slate-300 font-bold text-blue-700">24.00 %</td>
                    <td className="p-2">Plasticity Index = 18.0</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-medium">California Bearing Ratio (CBR)</td>
                    <td className="p-2 border-r border-slate-300">IS 2720 Part 16</td>
                    <td className="p-2 border-r border-slate-300 font-bold text-blue-700">7.15 %</td>
                    <td className="p-2">Subgrade Grade B (&gt; 5%)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ENGINEER SIGNATURE & QR CODE */}
            <div className="pt-6 border-t border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-slate-800" />
                </div>
                <div className="text-[10px] text-slate-500">
                  <div>Scan QR for Digital Verification</div>
                  <div className="font-bold text-slate-800">ISO 17025 Security Hash #98214</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-slate-900 italic font-serif text-sm">Dr. Rajesh Sharma, PE</div>
                <div className="text-[10px] font-bold text-slate-700 uppercase">Chief Geotechnical Engineer</div>
                <div className="text-[9px] text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> Digitally Signed & Approved
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">Document Status: Official Signed Report</span>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                onShowToast('Printing Report Document...');
                window.print();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>

            <button 
              onClick={() => {
                onShowToast('Downloading Official Report PDF Document...');
                onClose();
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
