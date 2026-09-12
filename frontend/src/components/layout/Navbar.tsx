import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ScanLine,
  History,
  FileText,
  Settings,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: ShieldCheck },
    { name: 'New Scan', path: '/scan/new', icon: ScanLine },
    { name: 'History', path: '/history', icon: History },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/15 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3 group">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.25)] group-hover:shadow-[0_0_25px_rgba(0,242,254,0.45)] transition-all">
            <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent font-['Space_Grotesk']">
              AURORA SHIELD
            </span>
            <span className="text-[9px] font-mono tracking-widest text-cyan-500/80 uppercase -mt-0.5">
              COMPLIANCE INTELLIGENCE
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                    : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & CTA */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/scan/new"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all hover:scale-105"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>START SCAN</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/60 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs text-slate-300 max-w-[100px] truncate hidden lg:inline">
                {user?.fullName || user?.email?.split('@')[0]}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950/95 border border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-800/80">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'Compliance User'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile & Security</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-cyan-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 py-4 space-y-2 backdrop-blur-2xl">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300"
            >
              <link.icon className="w-4 h-4" />
              <span>{link.name}</span>
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
