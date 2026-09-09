import React, { useState } from 'react';
import { 
  Scale, 
  Camera, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Layers, 
  Lock, 
  Eye, 
  Building, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  Zap, 
  Award,
  Users,
  Database,
  Check,
  LogOut,
  Download
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { SAMPLE_PACKAGES } from '../services/aiVisionService';
import { downloadOfficialProductDossierPdf } from '../services/pdfReportService';
import { inspectionService } from '../services/inspectionService';

interface WelcomePageProps {
  onApplyNow: () => void;
  onSignIn: () => void;
  onLaunchScanner: () => void;
  onEnterPlatform: () => void;
  onSelectRoleDemo: (role: UserRole) => void;
  onSignOut?: () => void;
  currentUser?: UserProfile;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onApplyNow,
  onSignIn,
  onLaunchScanner,
  onEnterPlatform,
  onSelectRoleDemo,
  onSignOut,
  currentUser
}) => {
  const [selectedDemoPackage, setSelectedDemoPackage] = useState(SAMPLE_PACKAGES[0]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* 1. National Directorate Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-10 pb-16 sm:pb-24">
        
        {/* Decorative Grid and Lighting */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Government / Departmental Banner */}
          <div className="inline-flex items-center space-x-2.5 bg-slate-900/90 border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 shadow-sm backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-blue-400 font-semibold">LEGAL METROLOGY ACT, 2009</span>
            <span className="text-slate-600">•</span>
            <span>Packaged Commodities Rules (PCR), 2011</span>
          </div>

          <div className="max-w-4xl space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              National Legal Metrology{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                Digital Inspection
              </span>{' '}
              & Compliance Platform
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed font-normal">
              Statutory verification and enforcement portal for Field Inspectors, Reviewing Controllers, and Enforcement Authorities. Featuring <strong>Live WebCam & Image AI Product Identification</strong> to eliminate manual typing, real-time <strong>Rule 9 MPE Tolerance checking</strong>, and tamper-evident digital compliance dossiers.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              
              {/* Apply Now / Register Button */}
              <button
                id="welcome-apply-now-btn"
                onClick={onApplyNow}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
              >
                <span>Apply for Officer Access / New User</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Enter Inspection Register */}
              <button
                id="welcome-enter-btn"
                onClick={onEnterPlatform}
                className="px-4 py-3.5 text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4"
              >
                Go directly to Inspection Register →
              </button>
            </div>

          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800/80 text-xs">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-mono">AUTOMATED VISION</span>
              <strong className="text-white text-base font-bold">Zero Physical Typing</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">Webcam / Image instant extraction</span>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-mono">STATUTORY FRAMEWORK</span>
              <strong className="text-white text-base font-bold">Rule 6 & Rule 9</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">Declarations & MPE error checks</span>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-mono">ROLE SEPARATION</span>
              <strong className="text-blue-400 text-base font-bold">3 Statutory Roles</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">Inspector • Reviewer • Admin</span>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-mono">DATA SYNCHRONIZATION</span>
              <strong className="text-emerald-400 text-base font-bold">Real-Time Firestore</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">Live multi-device audit logging</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Interactive Feature: "What This Platform Can Do" */}
      <section className="py-16 sm:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">
              CAPABILITIES & WORKFLOW
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              What This Legal Metrology Platform Can Do
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Designed specifically for statutory enforcement under the Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011 to guarantee fair trade, consumer rights, and reliable measurement integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Real-Time WebCam & Photo Identification */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 p-6 rounded-2xl transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                  WebCam & Image AI Product Identifier
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Eliminates physical typing. Point your device webcam or upload packaging photos; our AI extracts product name, brand, MRP, net quantity, unit sale price (USP), manufacturing date, and manufacturer premises in seconds.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-blue-400 font-semibold flex items-center space-x-1">
                  <span>Rule 6 Automatic Extraction</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Feature 2: Rule 9 Maximum Permissible Error (MPE) */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 p-6 rounded-2xl transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Rule 9 Metrological Tolerance Engine
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Real-time mathematical evaluation of declared nominal quantity versus certified electronic scale readouts. Automatically applies Schedule I & II Maximum Permissible Error (MPE) limits and detects short-weight infractions.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-purple-400 font-semibold flex items-center space-x-1">
                  <span>Automated MPE Tolerance Tables</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Feature 3: Mandatory Packaging Declarations */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 p-6 rounded-2xl transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Mandatory Declarations Audit
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Systematic verification checklist covering all Rule 6 statutory disclosures: Manufacturer/Packer/Importer details, Country of Origin, Month/Year of packing, Unit Sale Price (USP), and Consumer Care email/toll-free contact.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center space-x-1">
                  <span>8 Statutory Compliance Gates</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Feature 4: Multi-Product Scoped Isolation */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 p-6 rounded-2xl transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Multi-Product Scoped Dossiers
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Full multi-product architecture. A single inspection at a supermarket or warehouse contains individual product scopes—guaranteeing that evidence photos, weighings, and findings for Product A never leak into Product B.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-amber-400 font-semibold flex items-center space-x-1">
                  <span>Strict Commodity Isolation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Feature 5: Formal Inspection Dossier & Certificates */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 p-6 rounded-2xl transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  Print-Ready Statutory Certificates
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Generates tamper-evident, print-ready official legal metrology inspection dossiers with digital officer signatures, itemized commodity schedules, photo annexures, and formal compounding / notice memos.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-sky-400 font-semibold flex items-center space-x-1">
                  <span>Section 49 & 53 Ready</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
                <button
                  id="welcome-download-sample-pdf-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const insps = inspectionService.getInspectionsSnapshot();
                    if (insps.length > 0) {
                      const firstInsp = insps[0];
                      const prods = inspectionService.getProductsSnapshot(firstInsp.id);
                      const targetProd = prods[prods.length - 1] || prods[0];
                      if (targetProd) {
                        const ev = inspectionService.getEvidenceSnapshot(targetProd.id);
                        downloadOfficialProductDossierPdf({
                          inspection: firstInsp,
                          product: targetProd,
                          evidenceList: ev,
                          includeFullDossierSchedule: true,
                          allProducts: prods
                        });
                      }
                    }
                  }}
                  className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/40 text-[10px] font-bold rounded-lg transition-all flex items-center space-x-1"
                  title="Download a sample official statutory PDF dossier"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Sample PDF</span>
                </button>
              </div>
            </div>

            {/* Feature 6: Immutable Real-Time Audit Trail */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 p-6 rounded-2xl transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                  Real-Time Firestore Audit Chain
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Every photo upload, tare weight modification, reviewer decision, and finding logged generates an attributable, immutable event in Firestore—providing unbroken judicial chain-of-custody for all legal proceedings.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-rose-400 font-semibold flex items-center space-x-1">
                  <span>Tamper-Evident Chronology</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Live WebCam & Product Identification Interactive Showcase */}
      <section className="py-16 sm:py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Zero Physical Typing Technology</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Experience Real Packaging AI Identification
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Select a sample packaging commodity below to preview how our multimodal vision engine extracts real statutory fields, or launch your live webcam.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onLaunchScanner}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 shadow transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Open Live WebCam Scanner</span>
              </button>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left: Sample Package Selector & Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {SAMPLE_PACKAGES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => setSelectedDemoPackage(sample)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedDemoPackage.id === sample.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>

              {/* Packaging Preview Image */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
                <img
                  src={selectedDemoPackage.previewUrl}
                  alt={selectedDemoPackage.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[10px] font-mono bg-slate-950/80 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  STATUTORY SCAN PREVIEW
                </span>
              </div>
            </div>

            {/* Right: Extracted Real Data Card */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Identified Product Details (No Typing Needed)
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                  98% HIGH CONFIDENCE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-mono">COMMODITY NAME</span>
                  <strong className="text-white text-sm">{selectedDemoPackage.expectedData.productName}</strong>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-mono">BRAND & CATEGORY</span>
                  <span className="text-slate-200">{selectedDemoPackage.expectedData.brand} ({selectedDemoPackage.expectedData.category})</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-mono">DECLARED NET QUANTITY</span>
                  <strong className="text-emerald-400 text-sm">{selectedDemoPackage.expectedData.netQuantity}</strong>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-mono">MAXIMUM RETAIL PRICE (MRP)</span>
                  <strong className="text-emerald-300 text-sm">₹ {selectedDemoPackage.expectedData.mrp.toFixed(2)}</strong>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 col-span-2">
                  <span className="text-slate-400 text-[10px] block font-mono">MANUFACTURER PREMISES</span>
                  <span className="text-slate-200">{selectedDemoPackage.expectedData.manufacturerName}</span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">{selectedDemoPackage.expectedData.manufacturerAddress}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 col-span-2">
                  <span className="text-slate-400 text-[10px] block font-mono">UNIT SALE PRICE & PACKING DATE</span>
                  <span className="text-blue-300 font-medium">{selectedDemoPackage.expectedData.unitSalePrice} • PKD: {selectedDemoPackage.expectedData.monthYearOfManufacture}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Applies instantly to the inspection dossier with a single click.
                </span>
                <button
                  onClick={onApplyNow}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Register as Officer to Use →
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Future Role-Based Access Architecture */}
      <section className="py-16 sm:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">
              ROLE GOVERNANCE & ACCESS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Future Role-Based Access Control
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict statutory division of enforcement authority under the Legal Metrology Act, 2009. Each role operates within designated legal scopes and authenticated jurisdictions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* ROLE 1: Field Inspector */}
            <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-1 rounded">
                    ENFORCEMENT OFFICER
                  </span>
                  <Award className="w-5 h-5 text-blue-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">Field Inspector</h3>
                  <p className="text-xs text-blue-300 font-mono mt-0.5">Physical Verification & Seizure</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Authorized to enter commercial premises, capture packaging evidence via WebCam or mobile photos, verify electronic scale calibration, execute Rule 9 MPE calculations, log statutory violations, and submit inspection dossiers.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Core Authorizations:
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Live camera capture & AI product detection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Electronic balance readings & MPE calculation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Inspection memo & Rule 6 checklist creation</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="role-try-inspector-btn"
                onClick={() => onSelectRoleDemo('inspector')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Experience as Field Inspector</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ROLE 2: Reviewing Controller */}
            <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-1 rounded">
                    QUASI-JUDICIAL AUTHORITY
                  </span>
                  <Award className="w-5 h-5 text-purple-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">Reviewing Controller</h3>
                  <p className="text-xs text-purple-300 font-mono mt-0.5">Audit, Notice & Approval</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Second-line statutory controller. Audits submitted inspection packages, reviews high-res photo evidence and balance certificates, validates finding traceability, approves compliance, or returns dossiers for corrective inquiry.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Core Authorizations:
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Review submitted inspection queue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Inspect evidence photos & calibration traces</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Issue compounding notices or formal approval</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="role-try-reviewer-btn"
                onClick={() => onSelectRoleDemo('reviewer')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Experience as Reviewer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ROLE 3: Central Administrator */}
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded">
                    DIRECTORATE GOVERNANCE
                  </span>
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">Administrator</h3>
                  <p className="text-xs text-emerald-300 font-mono mt-0.5">Rules, Circles & Oversight</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Statewide directorate level oversight. Manages enforcement circles, inspector badge allocations, Legal Metrology statutory rules configuration, MPE penalty schedules, and examines the full immutable audit trail.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Core Authorizations:
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Real-time immutable Firestore audit trail</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Statutory rule & penalty threshold tuning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Inspector directory & statewide analytics</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="role-try-admin-btn"
                onClick={() => onSelectRoleDemo('admin')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Experience as Administrator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Bottom Onboarding & Registration CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Begin Legal Metrology Enforcement?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Apply now to receive your official statutory officer credentials, assigned jurisdiction, and direct access to the live inspection workstation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onApplyNow}
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
            >
              <span>Apply for Officer Access / New User</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
