import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, DEMO_USERS, signOutUser, GUEST_USER } from './lib/firebase';
import { UserProfile, UserRole, Inspection, AuditEvent } from './types';
import { CheckCircle2, X } from 'lucide-react';
import { inspectionService } from './services/inspectionService';
import { Navbar, ActiveAppView } from './components/Navbar';
import { WelcomePage } from './components/WelcomePage';
import { ThankYouDocket } from './components/ThankYouDocket';
import { InspectionList } from './components/InspectionList';
import { InspectionWorkspace } from './components/InspectionWorkspace';
import { AdminOversight } from './components/AdminOversight';
import { AuthModal } from './components/AuthModal';
import { CreateInspectionModal } from './components/CreateInspectionModal';
import { ProductAiScanner } from './components/ProductAiScanner';
import { IdentifiedProductData } from './services/aiVisionService';

export default function App() {
  // Current authenticated officer profile (defaults to Inspector demo)
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS.inspector);
  const [submittedPassword, setSubmittedPassword] = useState<string>('LegalMetrology2026!');
  
  // View states: starts at 'welcome' page as requested by user!
  const [currentView, setCurrentView] = useState<ActiveAppView>('welcome');
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);

  // Real-time data lists
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'demo'>('signup');
  const [authModalRole, setAuthModalRole] = useState<UserRole>('inspector');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState(false);
  const [signOutNotice, setSignOutNotice] = useState<string | null>(null);
  const [submissionSuccessNotice, setSubmissionSuccessNotice] = useState<{
    docketNumber: string;
    traderName: string;
    time: string;
  } | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(prev => ({
          ...prev,
          uid: firebaseUser.uid,
          email: firebaseUser.email || prev.email,
          displayName: firebaseUser.displayName || prev.displayName,
          photoURL: firebaseUser.photoURL || undefined,
          role: prev.role || 'inspector',
          badgeNumber: prev.badgeNumber || `LM-${(prev.role || 'inspector').toUpperCase()}-${firebaseUser.uid.slice(0, 5).toUpperCase()}`
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to real-time Inspections
  useEffect(() => {
    const unsub = inspectionService.subscribeInspections((list) => {
      setInspections(list);
    });
    return unsub;
  }, []);

  // Listen to real-time Audit logs
  useEffect(() => {
    const unsub = inspectionService.subscribeAudit((logs) => {
      setAuditLogs(logs);
    });
    return unsub;
  }, []);

  // Handle fast role switching
  const handleRoleChange = (role: UserRole) => {
    const demo = DEMO_USERS[role];
    setCurrentUser(demo);
  };

  // Open specific inspection in workspace
  const handleSelectInspection = (id: string) => {
    setActiveInspectionId(id);
    setCurrentView('workspace');
  };

  // Trigger registration flow from Welcome Page
  const handleApplyNow = () => {
    setAuthModalTab('signup');
    setIsAuthModalOpen(true);
  };

  // Trigger Sign In flow from Welcome Page
  const handleSignIn = () => {
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
  };

  // When user successfully authenticates / registers
  const handleAuthenticated = (user: UserProfile, password?: string) => {
    setCurrentUser(user);
    if (password) {
      setSubmittedPassword(password);
    }
    // As explicitly requested: on clicking apply now / new user / login -> Thank you page opens!
    setCurrentView('thankyou');
  };

  // Handle officer sign out from Firebase and portal session
  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(GUEST_USER);
    setCurrentView('welcome');
    setActiveInspectionId(null);
    setSignOutNotice('You have successfully signed out of the Legal Metrology portal.');
    setTimeout(() => {
      setSignOutNotice(null);
    }, 4500);
  };

  // Apply identified product from Global Scanner into a new inspection docket
  const handleApplyGlobalScan = async (data: IdentifiedProductData, imageBase64: string) => {
    const newInsp = await inspectionService.createInspection({
      inspectionNumber: `LM-INS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      businessName: `${data.brand} Retail Distribution Point`,
      businessAddress: data.manufacturerAddress || 'Industrial Sector Hub, Phase 1',
      category: data.category || 'Edible Oils & Fats',
      licenseNumber: `DL-LM-${Math.floor(10000 + Math.random() * 90000)}`,
      jurisdiction: currentUser.jurisdiction || 'Zone 4 Division',
      status: 'in_progress',
      inspectorId: currentUser.uid,
      inspectorName: currentUser.displayName,
      complianceOutcome: 'pending',
      scheduledDate: new Date().toISOString().split('T')[0]
    });

    const addedProd = await inspectionService.addProduct(newInsp.id, {
      name: data.productName,
      brand: data.brand,
      netQuantity: data.netQuantity,
      mrp: data.mrp,
      unitSalePrice: data.unitSalePrice,
      monthYearOfManufacture: data.monthYearOfManufacture,
      manufacturerName: data.manufacturerName,
      manufacturerAddress: data.manufacturerAddress,
      consumerCareDetails: data.consumerCareDetails,
      batchNumber: data.batchNumber
    });

    if (addedProd && imageBase64) {
      await inspectionService.addEvidence(newInsp.id, addedProd.id, {
        title: `AI Packaging Scan - ${data.productName}`,
        imageUrl: imageBase64,
        ocrRawText: `STATUTORY PCR 2011 SCAN: ${data.brand} - ${data.productName} • MRP: ₹ ${data.mrp} • NET QTY: ${data.netQuantity}`,
        ocrConfidence: data.confidenceScore || 0.98,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high'
      });
    }

    setActiveInspectionId(newInsp.id);
    setCurrentView('workspace');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Statutory Header & Navigation */}
      <Navbar
        currentUser={currentUser}
        onSwitchRole={handleRoleChange}
        onOpenAuth={(tab = 'signup') => {
          setAuthModalTab(tab);
          setIsAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
        activeView={currentView}
        onNavigate={(view) => {
          if (view === 'inspections') {
            setActiveInspectionId(null);
          }
          setCurrentView(view);
        }}
        hasActiveInspection={!!activeInspectionId}
        onOpenScanner={() => setIsGlobalScannerOpen(true)}
      />

      {/* Main App Stage */}
      <main className="flex-1 pb-16">
        
        {/* 1. WELCOME PAGE (First Impression & Role Capabilities) */}
        {currentView === 'welcome' && (
          <WelcomePage
            onApplyNow={handleApplyNow}
            onSignIn={handleSignIn}
            onLaunchScanner={() => setIsGlobalScannerOpen(true)}
            onEnterPlatform={() => setCurrentView('inspections')}
            onSelectRoleDemo={(role) => {
              setAuthModalRole(role);
              setAuthModalTab('login');
              setIsAuthModalOpen(true);
            }}
            onSignOut={handleSignOut}
            currentUser={currentUser}
          />
        )}

        {/* 2. THANK YOU PAGE (Displays registered email, name, password, role) */}
        {currentView === 'thankyou' && (
          <ThankYouDocket
            user={currentUser}
            submittedPassword={submittedPassword}
            onProceedToDashboard={() => setCurrentView('inspections')}
            onOpenScanner={() => setIsGlobalScannerOpen(true)}
            onSignOut={handleSignOut}
          />
        )}

        {/* 3. INSPECTION REGISTER */}
        {currentView === 'inspections' && (
          <InspectionList
            inspections={inspections}
            currentUser={currentUser}
            onSelectInspection={handleSelectInspection}
            onCreateNew={() => setIsCreateModalOpen(true)}
            submissionNotice={submissionSuccessNotice}
            onDismissSubmissionNotice={() => setSubmissionSuccessNotice(null)}
          />
        )}

        {/* 4. ACTIVE WORKSTATION */}
        {currentView === 'workspace' && activeInspectionId && (
          <InspectionWorkspace
            inspectionId={activeInspectionId}
            currentUser={currentUser}
            onBack={(submittedNotice) => {
              if (submittedNotice) {
                setSubmissionSuccessNotice({
                  docketNumber: submittedNotice.docketNumber,
                  traderName: submittedNotice.traderName,
                  time: new Date().toLocaleTimeString()
                });
                setTimeout(() => {
                  setSubmissionSuccessNotice(null);
                }, 7000);
              }
              setActiveInspectionId(null);
              setCurrentView('inspections');
            }}
          />
        )}

        {/* 5. GOVERNANCE & AUDIT OVERSIGHT */}
        {currentView === 'oversight' && (
          <AdminOversight
            auditLogs={auditLogs}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Auth & Identity Modal (Google OAuth, Sign-Up, Role Sandbox) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        initialRole={authModalRole}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        onSignOut={handleSignOut}
        currentUser={currentUser}
      />

      {/* Create Inspection Modal */}
      <CreateInspectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        onCreated={(newId) => {
          setActiveInspectionId(newId);
          setCurrentView('workspace');
        }}
      />

      {/* Global Real Packaging AI WebCam & Image Scanner */}
      <ProductAiScanner
        isOpen={isGlobalScannerOpen}
        onClose={() => setIsGlobalScannerOpen(false)}
        onApplyProductData={handleApplyGlobalScan}
        title="Live WebCam & Packaging AI Scanner"
      />

      {/* Submission Success Toast Notification Banner */}
      {submissionSuccessNotice && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full bg-slate-900 border-2 border-emerald-500/80 text-slate-100 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Submitted Successfully!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-800">
                    QUEUED
                  </span>
                </h4>
                <button
                  onClick={() => setSubmissionSuccessNotice(null)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Inspection dossier <strong className="text-emerald-300 font-mono">{submissionSuccessNotice.docketNumber}</strong> for <span className="text-white font-medium">{submissionSuccessNotice.traderName}</span> was submitted to the <strong>Reviewing Authority</strong>.
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Timestamp: {submissionSuccessNotice.time} • Ready for Controller verification</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sign Out Toast Notification */}
      {signOutNotice && (
        <div className="fixed bottom-14 right-4 sm:right-6 z-50 bg-slate-900/95 text-slate-100 border border-slate-700 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-medium backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{signOutNotice}</span>
        </div>
      )}

      {/* Bottom Sticky Status / Quick Context */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>National Legal Metrology Digital Directorate • PCR 2011 Verification Engine Active</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Officer: <strong className="text-slate-200">{currentUser.displayName}</strong></span>
            <span>Role: <strong className="text-blue-400 uppercase">{currentUser.role}</strong></span>
            <span>Badge: <span className="font-mono text-emerald-400 font-bold">{currentUser.badgeNumber}</span></span>
            {currentUser.uid !== GUEST_USER.uid && (
              <button
                id="footer-signout-btn"
                onClick={handleSignOut}
                className="text-rose-400 hover:text-rose-300 font-semibold hover:underline text-xs"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
