import React, { useEffect, useState } from 'react';
import {
  Settings,
  User,
  ShieldCheck,
  Server,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { scanApi } from '../../services/api';
import { isSupabaseConfigured } from '../../services/auth';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [healthStatus, setHealthStatus] = useState<any | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkBackend = async () => {
    try {
      setCheckingHealth(true);
      const res = await scanApi.checkHealth();
      setHealthStatus(res);
    } catch {
      setHealthStatus({ status: 'unreachable' });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] flex items-center space-x-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>System & Security Settings</span>
        </h1>
        <p className="text-xs text-slate-400">
          Manage officer credentials, inspect decoupled backend connectivity, and verify system integrity
        </p>
      </div>

      {/* Officer Profile Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-5 shadow-xl">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-sm">
            {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'O'}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{user?.fullName || 'Compliance Officer'}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px]">OFFICER ID</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5">{user?.id || 'AUTH_ACTIVE'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px]">SECURITY ROLE</span>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">REGULATORY AUDITOR (TIER 1)</div>
          </div>
        </div>
      </div>

      {/* Backend & API Connectivity */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Decoupled REST Engine Health</h2>
          </div>

          <button
            onClick={checkBackend}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            <span>Ping Backend</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[10px]">API ENDPOINT</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                healthStatus?.status === 'ok'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/30'
              }`}
            >
              {healthStatus?.status === 'ok' ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[10px]">SUPABASE AUTH CLOUD</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">
                {isSupabaseConfigured ? 'MANAGED SUPABASE INSTANCE' : 'LOCAL SECURE STORAGE FALLBACK'}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {isSupabaseConfigured ? 'CONNECTED' : 'ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Regulatory Rule Standard Reference */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Statutory Compliance Guidelines Integrated</span>
        </h3>
        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
          <li>Legal Metrology Act, 2009 (Packaged Commodities Rules)</li>
          <li>FSSAI Food Safety and Standards (Packaging and Labelling) Regulations, 2020</li>
          <li>Consumer Protection (Direct Selling & E-Commerce) Rules</li>
          <li>ISO/IEC 15415 & 15416 Barcode & Print Quality Standards</li>
        </ul>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={signOut}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Officer Session</span>
        </button>
      </div>

    </div>
  );
};
