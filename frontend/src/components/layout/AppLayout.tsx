import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ShieldCheck, Cpu, CheckCircle2, Lock } from 'lucide-react';
import { CustomCursor } from '../CustomCursor';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#050811] text-slate-100 relative overflow-x-hidden">
    <CustomCursor />
      {/* Background Aurora Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[150px]"></div>
      </div>

      {/* Top Protocol Status Bar */}
      <div className="relative z-50 bg-slate-950/90 border-b border-cyan-500/10 text-[11px] font-mono py-1 px-4 text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            REGULATORY ENGINE: ACTIVE
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">
            RULES: FSSAI (2020) & LM (PACKAGED COMMODITIES) RULES
          </span>
        </div>
        <div className="flex items-center space-x-2 text-cyan-400/90">
          <Cpu className="w-3 h-3" />
          <span className="tracking-wide">AI ASSISTS • HUMAN VERIFIES • RULES DECIDE</span>
        </div>
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-8 px-4 sm:px-6 lg:px-8 mt-16 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">AURORA SHIELD</span>
            <span className="text-slate-600">•</span>
            <span>Universal Packaged Product Compliance Scanner</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              100% Deterministic Rule Enforcement
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Enterprise Audit Trail
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Built for Smart India Hackathon 2026
          </div>
        </div>
      </footer>
    </div>
  );
};
