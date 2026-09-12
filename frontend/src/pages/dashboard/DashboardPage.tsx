import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  History,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Download,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { scanApi } from '../../services/api';
import { ComplianceScanRecord } from '../../types';
import { AuroraCore } from '../../components/3d/AuroraCore';

export const DashboardPage: React.FC = () => {
  const [scans, setScans] = useState<ComplianceScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await scanApi.listScans();
      setScans(res.scans || []);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to Compliance Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const totalScans = scans.length;
  const compliantCount = scans.filter(s => s.status === 'COMPLIANT').length;
  const needsVerificationCount = scans.filter(s => s.status === 'NEEDS_VERIFICATION').length;
  const potentialIssueCount = scans.filter(s => s.status === 'POTENTIAL_ISSUE').length;

  const handleDownloadPdf = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = await scanApi.getReportPdfBlobUrl(scanId);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurora_shield_report_${scanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Section with 3D Aurora Core */}
      <div className="relative rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-6 sm:p-10 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SIH 2026 ENTERPRISE COMPLIANCE ENGINE v2.0</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-['Space_Grotesk'] leading-tight">
              Universal Packaged Product{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Compliance Scanner
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Automate multi-angle OCR, AI structured data extraction, cross-label discrepancy detection,
              and 100% deterministic regulatory checks aligned with the Legal Metrology Act and FSSAI guidelines.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/scan/new"
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_25px_rgba(0,242,254,0.4)] transition-all transform hover:-translate-y-0.5"
              >
                <ScanLine className="w-4 h-4" />
                <span>START NEW SCAN</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/history"
                className="flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-all"
              >
                <History className="w-4 h-4" />
                <span>Audit Registry</span>
              </Link>
            </div>
          </div>

          {/* 3D Visual Core Widget */}
          <div className="w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0 relative">
            <AuroraCore
              state={potentialIssueCount > 0 ? 'POTENTIAL_ISSUE' : 'COMPLIANT'}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Scans</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-['Space_Grotesk']">{totalScans}</div>
          <p className="text-[11px] text-slate-400 mt-1">Multi-angle label analyses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Compliant</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-['Space_Grotesk']">{compliantCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">100% verified regulatory fit</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-amber-500/20 bg-slate-950/70 p-5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Needs Verification</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-['Space_Grotesk']">{needsVerificationCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting human sign-off</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-rose-500/20 bg-slate-950/70 p-5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Potential Issues</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 font-['Space_Grotesk']">{potentialIssueCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Discrepancy / Rule flags</p>
        </motion.div>
      </div>

      {/* Recent Scans Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Compliance Scans</h2>
            <p className="text-xs text-slate-400">
              Audit records from universal retail packaging inspections
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchScans}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/history"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center text-rose-400 text-sm">
            <p>{error}</p>
            <button
              onClick={fetchScans}
              className="mt-3 px-4 py-1.5 rounded bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300"
            >
              Retry Connection
            </button>
          </div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <ScanLine className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm">No scans logged in the audit registry yet.</p>
            <Link
              to="/scan/new"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-cyan-500 text-slate-950"
            >
              <span>Create First Scan</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Product & Category</th>
                  <th className="py-3.5 px-4">Compliance Status</th>
                  <th className="py-3.5 px-4">Quality & Score</th>
                  <th className="py-3.5 px-4">Type / Source</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scans.map(scan => {
                  const isIssue = scan.status === 'POTENTIAL_ISSUE';
                  const isVerified = scan.status === 'COMPLIANT';
                  const isNeedsVer = scan.status === 'NEEDS_VERIFICATION';

                  return (
                    <tr
                      key={scan.id}
                      className="hover:bg-slate-900/40 transition-colors group cursor-pointer"
                      onClick={() => (window.location.href = `/scan/${scan.id}`)}
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center space-x-2">
                          <span>{scan.productName}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[11px] text-slate-400">{scan.category}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full font-mono text-[10px] font-semibold uppercase tracking-wider ${
                            isIssue
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                              : isVerified
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {scan.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-200">{scan.overallScore}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                scan.overallScore >= 80 ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${scan.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {scan.isDemoSample ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 uppercase">
                            Sample Demo Data
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider bg-slate-800 text-slate-300 uppercase">
                            Live Inspection
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(scan.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/scan/${scan.id}`}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            Inspect
                          </Link>
                          <button
                            onClick={e => handleDownloadPdf(scan.id, e)}
                            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                            title="Download PDF Audit Report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
