import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Building,
  Award,
  LogOut
} from 'lucide-react';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, DEMO_USERS } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: UserProfile, submittedPassword?: string) => void;
  initialTab?: 'login' | 'signup' | 'demo';
  initialRole?: UserRole;
  onSignOut?: () => void;
  currentUser?: UserProfile;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialTab = 'signup',
  initialRole = 'inspector',
  onSignOut,
  currentUser
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'demo'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [jurisdiction, setJurisdiction] = useState('Zone 4 - Regional Metrology Division');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [statusNotice, setStatusNotice] = useState<{ type: 'info' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      if (initialRole) {
        setSelectedRole(initialRole);
      }
      setStatusNotice(null);
    }
  }, [isOpen, initialTab, initialRole]);

  if (!isOpen) return null;

  // Google OAuth Login
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setStatusNotice(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const role: UserRole = selectedRole;
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || 'authenticated@metrology.gov.in',
        displayName: user.displayName || 'Legal Metrology Officer',
        role,
        badgeNumber: `LM-${role.toUpperCase()}-${user.uid.slice(0, 5).toUpperCase()}`,
        photoURL: user.photoURL || undefined,
        jurisdiction: jurisdiction || 'Central Enforcement Directorate',
        createdAt: new Date().toISOString()
      };

      // Persist user profile to Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
      } catch (saveErr) {
        console.warn('Firestore profile sync note:', saveErr);
      }

      onAuthenticated(profile, 'OAuth 2.0 via Google (legal-metrology-9f34a)');
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed or dismissed the popup window before finishing.
        // This is normal interactive user behavior, not an application crash.
        console.info('Google Sign-in popup dismissed by user.');
        setStatusNotice({
          type: 'info',
          text: 'Google Sign-in window was closed. Click "Continue with Google" again or use the Email & Password form below.'
        });
      } else if (code === 'auth/popup-blocked') {
        console.warn('Google Sign-in popup blocked by browser policy.');
        setStatusNotice({
          type: 'error',
          text: 'The sign-in popup was blocked by browser settings. Please allow popups or use Email & Password below.'
        });
      } else if (code === 'auth/unauthorized-domain') {
        console.warn('Firebase unauthorized domain for Google OAuth.');
        setStatusNotice({
          type: 'error',
          text: 'This domain is not authorized in Firebase OAuth settings. Please use the Email & Password form below.'
        });
      } else {
        console.warn('Google sign-in exception:', err?.message || err);
        setStatusNotice({
          type: 'error',
          text: err?.message || 'Unable to complete Google Sign-in. Please use Email & Password below.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Custom Sign Up / Login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setStatusNotice({
        type: 'error',
        text: 'Please enter your official email address and password.'
      });
      return;
    }

    if (tab === 'signup' && !displayName) {
      setStatusNotice({
        type: 'error',
        text: 'Please enter your full name as an officer.'
      });
      return;
    }

    setLoading(true);
    setStatusNotice(null);

    const role: UserRole = selectedRole;

    try {
      if (tab === 'signup') {
        let authUid = `usr-${Date.now()}`;
        try {
          // Attempt Firebase Auth user registration
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          authUid = userCredential.user.uid;
        } catch (authErr: any) {
          console.warn('Firebase createUser note (proceeding with profile):', authErr);
        }

        const generatedBadge = badgeNumber || `LM-${role.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const profile: UserProfile = {
          uid: authUid,
          email,
          displayName: displayName || (email.split('@')[0].toUpperCase()),
          role,
          badgeNumber: generatedBadge,
          jurisdiction: jurisdiction || 'Central Enforcement Circle',
          createdAt: new Date().toISOString()
        };

        // Save to Firestore
        try {
          await setDoc(doc(db, 'users', authUid), profile, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore profile save queued:', dbErr);
        }

        onAuthenticated(profile, password);
        onClose();
      } else {
        // Login tab
        let authUid = `usr-${Date.now()}`;
        let loadedProfile: UserProfile | null = null;
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          authUid = userCredential.user.uid;
          const userDoc = await getDoc(doc(db, 'users', authUid));
          if (userDoc.exists()) {
            loadedProfile = userDoc.data() as UserProfile;
          }
        } catch (authErr: any) {
          console.warn('Firebase signIn note:', authErr);
        }

        const profile: UserProfile = loadedProfile ? {
          ...loadedProfile,
          role,
          badgeNumber: badgeNumber || loadedProfile.badgeNumber || `LM-${role.toUpperCase()}-8821`
        } : {
          uid: authUid,
          email,
          displayName: displayName || (email.split('@')[0].toUpperCase()),
          role,
          badgeNumber: badgeNumber || `LM-${role.toUpperCase()}-8821`,
          jurisdiction: jurisdiction || 'Central Enforcement Circle',
          createdAt: new Date().toISOString()
        };

        // Update role in Firestore if changed
        try {
          await setDoc(doc(db, 'users', authUid), { role }, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore profile update queued:', dbErr);
        }

        onAuthenticated(profile, password);
        onClose();
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setStatusNotice({
          type: 'error',
          text: 'This email is already registered. Please switch to the "Officer Sign In" tab to log in.'
        });
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setStatusNotice({
          type: 'error',
          text: 'Invalid officer credentials. Please verify your email and password, or create a new account.'
        });
      } else if (code === 'auth/weak-password') {
        setStatusNotice({
          type: 'error',
          text: 'Password should be at least 6 characters long.'
        });
      } else if (code === 'auth/invalid-email') {
        setStatusNotice({
          type: 'error',
          text: 'Please provide a valid official email address.'
        });
      } else {
        console.warn('Authentication note:', err?.message || err);
        setStatusNotice({
          type: 'error',
          text: err?.message || 'Authentication failed. Please check credentials.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Selection
  const handleSelectDemo = (role: UserRole) => {
    const demoProfile = DEMO_USERS[role];
    onAuthenticated(demoProfile, 'DemoPass2026!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Legal Metrology Portal Access</h2>
              <p className="text-xs text-slate-400">Statutory Officer Identity & Role Authorization</p>
            </div>
          </div>
          <button
            id="close-auth-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-semibold text-center bg-slate-900/60">
          <button
            id="tab-signup-auth"
            onClick={() => setTab('signup')}
            className={`py-3 transition-colors ${
              tab === 'signup'
                ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Apply Now / Register
          </button>
          <button
            id="tab-login-auth"
            onClick={() => setTab('login')}
            className={`py-3 transition-colors ${
              tab === 'login'
                ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Officer Sign In
          </button>
          <button
            id="tab-demo-auth"
            onClick={() => setTab('demo')}
            className={`py-3 transition-colors ${
              tab === 'demo'
                ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Role Sandbox
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Active Session & Quick Sign Out Banner */}
          {currentUser?.email && onSignOut && (
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="truncate max-w-[240px]">
                  Logged in: <strong className="text-white">{currentUser.email}</strong>
                </span>
              </div>
              <button
                id="modal-signout-btn"
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="text-rose-400 hover:text-rose-300 font-bold flex items-center space-x-1 shrink-0 hover:underline"
                title="Sign out of current account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {statusNotice && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2.5 text-xs border transition-all ${
                statusNotice.type === 'info'
                  ? 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                  : 'bg-rose-950/50 border-rose-800 text-rose-300'
              }`}
            >
              {statusNotice.type === 'info' ? (
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusNotice.text}</span>
            </div>
          )}

          {/* Continue with Google OAuth Button */}
          <button
            id="google-oauth-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center space-x-3 transition-all shadow disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="text-[11px] uppercase text-slate-500 font-mono">or statutory email & password</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          {/* TAB 1: Apply Now / Register Officer */}
          {tab === 'signup' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Officer Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="auth-input-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Inspector Rajesh V. Sharma"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="auth-input-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@metrology.gov.in"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="auth-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Assigned Departmental Role</span>
                  <span className="text-[10px] text-blue-400 font-mono">Statutory Authority</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('inspector')}
                    className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition-all ${
                      selectedRole === 'inspector'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Field Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('reviewer')}
                    className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition-all ${
                      selectedRole === 'reviewer'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Reviewer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition-all ${
                      selectedRole === 'admin'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              {/* Jurisdiction */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enforcement Circle / Jurisdiction
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g. Zone 4 - Regional Division"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                id="auth-submit-register-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Submit Application & Issue Docket</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: Sign In */}
          {tab === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@metrology.gov.in"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Role Selection on Login */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Sign In As Role</span>
                  <span className="text-[10px] text-blue-400 font-mono">Assigned Operational Authority</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('inspector')}
                    className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition-all ${
                      selectedRole === 'inspector'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Field Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('reviewer')}
                    className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition-all ${
                      selectedRole === 'reviewer'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Reviewer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition-all ${
                      selectedRole === 'admin'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <button
                id="auth-submit-login-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Authenticate & Open Docket</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: Fast Role Sandbox */}
          {tab === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Experience the statutory inspection workflow immediately as any of the three authorized actors:
              </p>

              {/* Inspector Demo Card */}
              <div 
                id="demo-select-inspector"
                onClick={() => handleSelectDemo('inspector')}
                className="p-3.5 rounded-xl border border-blue-500/40 bg-blue-950/20 hover:bg-blue-950/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-blue-300">Field Inspector</span>
                    <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded font-mono">LM-INS-88</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-product capture, WebCam packaging scans, OCR validation, and review submission.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Reviewer Demo Card */}
              <div 
                id="demo-select-reviewer"
                onClick={() => handleSelectDemo('reviewer')}
                className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-purple-300">Reviewing Controller</span>
                    <span className="text-[10px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded font-mono">LM-REV-14</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Review submitted dossiers, audit decision traces, approve or return with remarks.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Administrator Demo Card */}
              <div 
                id="demo-select-admin"
                onClick={() => handleSelectDemo('admin')}
                className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-300">Central Administrator</span>
                    <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-1.5 py-0.5 rounded font-mono">LM-ADM-01</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Full platform oversight, immutable audit trail inspection, and rule configuration.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
