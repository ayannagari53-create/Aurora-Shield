import React, { useEffect, useState } from 'react';
import { FileText, Download, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { scanApi } from '../../services/api';
import { ReportItem } from '../../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await scanApi.listReports();
      setReports(res.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = async (scanId: string, name: string) => {
    try {
      const url = await scanApi.getReportPdfBlobUrl(scanId);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurora_shield_${name.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Official Audit Reports (PDF)</span>
          </h1>
          <p className="text-xs text-slate-400">
            Exportable regulatory compliance certificates and evidence briefs generated with vector precision
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-cyan-400 font-mono text-xs">QUERYING REPORT VAULT...</div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-950/60 text-slate-400">
          No audit reports generated yet. Run a compliance scan to create reports.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map(rep => {
            const isIssue = rep.status === 'POTENTIAL_ISSUE';
            const isCompliant = rep.status === 'COMPLIANT';

            return (
              <div
                key={rep.id}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800">
                      <FileText className="w-5 h-5" />
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isIssue
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : isCompliant
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {rep.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{rep.productName}</h3>
                    <p className="text-xs text-slate-400">{rep.category}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Compliance Score</span>
                    <span className="font-bold text-white">{rep.overallScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Issues Documented</span>
                    <span className="text-rose-400">{rep.issueCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Generated: {new Date(rep.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(rep.scanId, rep.productName)}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.2)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF Report</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
