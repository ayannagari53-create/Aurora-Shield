import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { scanApi } from '../../services/api';
import { ComplianceScanRecord } from '../../types';

export const HistoryPage: React.FC = () => {
  const [scans, setScans] = useState<ComplianceScanRecord[]>([]);
  const [filteredScans, setFilteredScans] = useState<ComplianceScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchScans = async () => {
    try {
      setLoading(true);
      const res = await scanApi.listScans();
      setScans(res.scans || []);
      setFilteredScans(res.scans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  useEffect(() => {
    let result = scans;

    if (selectedStatus !== 'ALL') {
      result = result.filter(s => s.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s => s.productName?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q)
      );
    }

    setFilteredScans(result);
  }, [searchQuery, selectedStatus, scans]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this audit record?')) return;
    try {
      await scanApi.deleteScan(id);
      setScans(scans.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete scan');
    }
  };

  const handleDownloadPdf = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = await scanApi.getReportPdfBlobUrl(id);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurora_shield_report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] flex items-center space-x-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Compliance Audit Registry</span>
          </h1>
          <p className="text-xs text-slate-400">
            Historical logs of all packaging compliance analyses, human verifications, and regulatory decisions
          </p>
        </div>

        <button
          onClick={fetchScans}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category, or audit ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Compliance States</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="NEEDS_VERIFICATION">Needs Verification</option>
            <option value="POTENTIAL_ISSUE">Potential Issue</option>
          </select>
        </div>
      </div>

      {/* Grid of Scans */}
      {loading ? (
        <div className="py-20 text-center text-cyan-400 font-mono text-xs">LOADING REGISTRY ENTRIES...</div>
      ) : filteredScans.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3">
          <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm text-slate-300">No records matching query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScans.map(scan => {
            const isIssue = scan.status === 'POTENTIAL_ISSUE';
            const isCompliant = scan.status === 'COMPLIANT';

            return (
              <div
                key={scan.id}
                onClick={() => (window.location.href = `/scan/${scan.id}`)}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-lg group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isIssue
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : isCompliant
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {scan.status.replace('_', ' ')}
                    </span>

                    {scan.isDemoSample && (
                      <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                        Sample Demo
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {scan.productName}
                  </h3>
                  <div className="text-xs text-slate-400">{scan.category}</div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Score</span>
                    <span className="font-mono font-bold text-white">{scan.overallScore}/100</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Images Evaluated</span>
                    <span className="font-mono text-cyan-400">{scan.images?.length || 0} Panels</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Date: {new Date(scan.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={e => handleDownloadPdf(scan.id, e)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
                    title="Download Report PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={e => handleDelete(scan.id, e)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/scan/${scan.id}`}
                    onClick={e => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center space-x-1"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
