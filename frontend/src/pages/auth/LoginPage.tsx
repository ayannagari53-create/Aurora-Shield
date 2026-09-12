import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/auth';
import { AuroraCore } from '../../components/3d/AuroraCore';

export const LoginPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050811] relative overflow-hidden px-4 py-12">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[130px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-purple-600/15 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,242,254,0.3)] mb-4">
            <ShieldCheck className="w-9 h-9 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent font-['Space_Grotesk']">
            AURORA SHIELD
          </h1>
          <p className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase mt-1">
            Universal Packaged Product Compliance Scanner
          </p>
        </div>

        {/* 3D Core Mini Preview */}
        <div className="h-28 -my-2 flex items-center justify-center">
          <AuroraCore size={140} state="SCANNING" />
        </div>

        {/* Glassmorphic Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-100">Sign In to Workspace</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 bg-cyan-950/40">
              AUDIT v2.0
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Officer Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@regulatory.gov.in"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>



          <p className="mt-5 text-center text-xs text-slate-400">
            Don't have an officer account?{' '}
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Create Account
            </Link>
          </p>
        </motion.div>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Smart India Hackathon 2026 Ready • Production Architecture
          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={async () => {
              // Initiate Google OAuth flow using Supabase
              try {
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                  }
                });
              } catch (err) {
                console.error('Google login failed:', err);
              }
            }}
            className="w-full mt-4 py-2.5 px-4 rounded-lg font-semibold text-sm bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(255,0,0,0.3)] transition-all flex items-center justify-center space-x-2"
          >
            <span>Continue with Google</span>
          </button>
        </p>
      </div>
    </div>
  );
};
