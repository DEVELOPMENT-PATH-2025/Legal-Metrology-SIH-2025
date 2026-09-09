import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Camera, 
  Printer, 
  Award, 
  Building, 
  FileText, 
  Copy, 
  Check, 
  Scale, 
  Sparkles,
  LogOut 
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface ThankYouDocketProps {
  user: UserProfile;
  submittedPassword?: string;
  onProceedToDashboard: () => void;
  onOpenScanner: () => void;
  onSignOut?: () => void;
}

export const ThankYouDocket: React.FC<ThankYouDocketProps> = ({
  user,
  submittedPassword = '••••••••••••',
  onProceedToDashboard,
  onOpenScanner,
  onSignOut
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const roleMeta: Record<UserRole, { title: string; color: string; bg: string; border: string; permissions: string[] }> = {
    inspector: {
      title: 'Legal Metrology Field Inspector',
      color: 'text-blue-400',
      bg: 'bg-blue-950/40',
      border: 'border-blue-500/40',
      permissions: [
        'Live WebCam packaging photo capture & AI OCR extraction',
        'Physical commodities weighing & Rule 9 MPE tolerance verification',
        'Mandatory Rule 6 packaging declarations verification',
        'Logging statutory findings and inspection dossier submission'
      ]
    },
    reviewer: {
      title: 'Reviewing Controller (Statutory Authority)',
      color: 'text-purple-400',
      bg: 'bg-purple-950/40',
      border: 'border-purple-500/40',
      permissions: [
        'Independent review of submitted inspection dossiers & photos',
        'Cross-examination of digital scale readouts and MPE tolerances',
        'Statutory compounding notice issuance and formal approval',
        'Sign-off on official compliance certificates'
      ]
    },
    admin: {
      title: 'Central Enforcement Administrator',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/40',
      permissions: [
        'Full platform governance and rule configuration (PCR 2011)',
        'Inspector jurisdiction management & badge allocation',
        'Access to immutable real-time Firestore audit trail',
        'Statewide compliance analytics and enforcement reporting'
      ]
    }
  };

  const currentRole = roleMeta[user.role] || roleMeta.inspector;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-slate-100">
      
      {/* Official Docket Header */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Ribbon */}
        <div className="bg-gradient-to-r from-blue-900/60 via-slate-800 to-indigo-900/60 p-6 sm:p-8 border-b border-slate-700 text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <span className="text-[11px] font-mono tracking-widest uppercase bg-slate-900/80 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/40 font-bold">
            Officer Registration Confirmed • Statutory Docket Issued
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Thank You, {user.displayName}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mt-2 leading-relaxed">
            Your statutory credentials have been registered with the Legal Metrology Compliance & Inspection Directorate. Your assigned officer profile and permissions are ready.
          </p>

          <div className="mt-4 inline-flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-400">
            <span>DOCKET ID:</span>
            <strong className="text-blue-400 font-bold">LM-REG-2026-{(user.uid || '999').slice(-6).toUpperCase()}</strong>
          </div>
        </div>

        {/* Credentials Docket Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Official Registered Credentials & Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-mono flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Officer Full Name</span>
                  </span>
                  <strong className="text-base text-white block">{user.displayName}</strong>
                </div>
                <button
                  onClick={() => copyToClipboard(user.displayName, 'name')}
                  className="text-slate-500 hover:text-slate-300 p-1"
                  title="Copy Name"
                >
                  {copiedField === 'name' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Official Email */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-mono flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Registered Email Address</span>
                  </span>
                  <strong className="text-base text-blue-300 block truncate max-w-[200px]">{user.email}</strong>
                </div>
                <button
                  onClick={() => copyToClipboard(user.email, 'email')}
                  className="text-slate-500 hover:text-slate-300 p-1"
                  title="Copy Email"
                >
                  {copiedField === 'email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Secure Password Field */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-mono flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Registered Password</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <strong className="text-base font-mono text-slate-200">
                      {showPassword ? submittedPassword : '••••••••••••'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(submittedPassword, 'password')}
                  className="text-slate-500 hover:text-slate-300 p-1"
                  title="Copy Password"
                >
                  {copiedField === 'password' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Departmental Role */}
              <div className={`border rounded-xl p-4 flex items-start justify-between ${currentRole.bg} ${currentRole.border}`}>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-mono flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-400" />
                    <span>Assigned Departmental Role</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <strong className={`text-base font-bold ${currentRole.color}`}>{currentRole.title}</strong>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 font-bold border border-slate-700">
                  {user.role.toUpperCase()}
                </span>
              </div>

              {/* Badge Number */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-mono flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Statutory Badge Number</span>
                  </span>
                  <strong className="text-base font-mono text-emerald-400 block">{user.badgeNumber || 'LM-INS-PENDING'}</strong>
                </div>
              </div>

              {/* Jurisdiction */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-mono flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                    <span>Enforcement Circle / Jurisdiction</span>
                  </span>
                  <strong className="text-sm text-slate-200 block">{user.jurisdiction || 'Zone 4 Division'}</strong>
                </div>
              </div>

            </div>
          </div>

          {/* Role Authorization & Capabilities Summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Scale className="w-4 h-4 text-blue-400" />
              <span>Authorized Statutory Capabilities under PCR 2011</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {currentRole.permissions.map((perm, index) => (
                <div key={index} className="flex items-start space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              id="try-scanner-from-thank-you-btn"
              type="button"
              onClick={onOpenScanner}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
            >
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Test Live WebCam AI Scanner</span>
            </button>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
              {onSignOut && (
                <button
                  id="thankyou-signout-btn"
                  type="button"
                  onClick={onSignOut}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  title="Sign out of current officer account"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              )}

              <button
                id="proceed-to-dashboard-btn"
                type="button"
                onClick={onProceedToDashboard}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02]"
              >
                <span>Enter Portal & Start Inspection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
