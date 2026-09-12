import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password recovery link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050811] relative overflow-hidden px-4 py-12">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_25px_rgba(0,242,254,0.25)] mb-3">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent font-['Space_Grotesk']">
            AURORA SHIELD
          </h1>
          <p className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase mt-1">
            Credential Recovery
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
        >
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-100 mb-2">Recovery Email Dispatched</h2>
              <p className="text-xs text-slate-400 mb-6">
                Instructions to reset your access key have been sent to <span className="text-cyan-300 font-mono">{email}</span>.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-100 mb-2">Reset Officer Password</h2>
              <p className="text-xs text-slate-400 mb-5">
                Enter your registered officer email address to receive secure reset credentials.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="officer@regulatory.gov.in"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Dispatching...' : 'Send Recovery Instructions'}</span>
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
