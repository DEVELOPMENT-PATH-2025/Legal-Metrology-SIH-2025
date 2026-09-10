import React, { useState } from 'react';
import {
  Scale,
  User,
  BookOpen,
  LogOut,
  Shield,
  BadgeCheck,
  Sun,
  Moon
} from 'lucide-react';
import { UserProfile } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { isFirebaseAuthActive, auth, firebaseConfig } from '../lib/firebase';

export type ActiveAppView = 'welcome' | 'inspections' | 'workspace' | 'oversight' | 'thankyou';

interface NavbarProps {
  currentUser: UserProfile;
  onOpenAuth: (initialTab?: 'login' | 'signup' | 'demo') => void;
  onSignOut: () => void;
  activeView: ActiveAppView;
  onNavigate: (view: ActiveAppView) => void;
  hasActiveInspection?: boolean;
  onOpenScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onSignOut,
  activeView,
  onNavigate
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">

          {/* Brand & Statutory Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => onNavigate('welcome')}
            title="Return to National Legal Metrology Welcome"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Veriqo - Legal Metrology
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-blue-400 border border-slate-700">
                  PCR-2011
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Statutory Packaging & Verification Platform
              </p>
            </div>
          </div>

          {/* Clean Portal Welcome Tab */}
          <div className="flex items-center">
            <button
              id="nav-welcome-btn"
              onClick={() => onNavigate('welcome')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${activeView === 'welcome'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Portal Welcome</span>
            </button>
          </div>

          {/* Right Section: Theme Toggle + Officer Profile + Sign Out + Account / Login */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Dark / Light Mode Toggle Button */}
            <ThemeToggle />

            {/* Officer Profile Badge */}
            <div className="relative">
              <button
                id="officer-profile-menu-btn"
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs transition-all shadow-sm"
                title="Click to view authenticated officer details"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center font-bold text-[11px]">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'O'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-slate-200 font-semibold truncate max-w-[120px] leading-tight">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 leading-tight">
                    {currentUser.badgeNumber || currentUser.role}
                  </span>
                </div>
              </button>

              {/* Authenticated Officer Session Popover */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl bg-slate-900 border border-slate-700 p-3 z-50 text-slate-200 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="pb-2 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center justify-between">
                    <span>OFFICER SESSION</span>
                    {isFirebaseAuthActive() ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        FIREBASE AUTH
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-mono font-bold">
                        ROLE SANDBOX
                      </span>
                    )}
                  </div>

                  {/* Profile info */}
                  <div className="py-2.5 border-b border-slate-800 space-y-1.5">
                    <p className="font-semibold text-slate-100 text-sm truncate">{currentUser.displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email || 'inspector.sharma@metrology.gov.in'}</p>
                    {currentUser.badgeNumber && (
                      <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <span className="text-slate-500">Badge:</span>
                        <span className="text-slate-200 font-semibold">{currentUser.badgeNumber}</span>
                      </p>
                    )}
                    {auth.currentUser && (
                      <p className="text-[10px] font-mono text-slate-500 truncate" title={`Firebase UID: ${auth.currentUser.uid}`}>
                        UID: <span className="text-slate-400">{auth.currentUser.uid.slice(0, 12)}...</span>
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      Project: <span className="text-slate-400">{firebaseConfig.projectId}</span>
                    </p>
                  </div>

                  {/* Selected Role during authentication */}
                  <div className="py-2.5 border-b border-slate-800">
                    <div className="p-2 bg-slate-800/80 border border-slate-700/80 rounded-lg flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-mono uppercase">Assigned Role</span>
                        <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                          {currentUser.role === 'inspector'
                            ? 'Field Inspector'
                            : currentUser.role === 'reviewer'
                              ? 'Reviewing Controller'
                              : 'Administrator'}
                          <BadgeCheck className="w-3 h-3 text-emerald-400" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isFirebaseAuthActive() && (
                    <div className="py-2 border-b border-slate-800">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenAuth('login');
                        }}
                        className="w-full text-center py-2 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        Sign In with Firebase
                      </button>
                    </div>
                  )}

                  {/* Quick Theme Toggle option inside menu */}
                  <div className="py-2 border-b border-slate-800">
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs bg-slate-800/60 hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
                    >
                      <div className="flex items-center space-x-2">
                        {isDark ? (
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>Interface Mode</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                        {isDark ? 'Dark' : 'Light'}
                      </span>
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="pt-2">
                    <button
                      id="dropdown-signout-btn"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center space-x-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out Officer</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated Sign Out Button */}
            <button
              id="nav-signout-btn"
              type="button"
              onClick={onSignOut}
              className="flex items-center space-x-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-600/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Sign out of current officer session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Account / Login Action Button */}
            <button
              id="open-auth-btn"
              onClick={() => onOpenAuth('signup')}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/25"
              title="Register new officer or sign in"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Account / Login</span>
              <span className="md:hidden">Account</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
