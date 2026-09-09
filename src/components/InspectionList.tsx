import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building, 
  ShieldCheck, 
  ArrowRight,
  Boxes,
  Camera,
  Layers,
  Sparkles,
  RotateCcw,
  Download,
  Trash2,
  X,
  Send
} from 'lucide-react';
import { Inspection, InspectionStatus, UserProfile } from '../types';
import { inspectionService } from '../services/inspectionService';
import { downloadOfficialProductDossierPdf } from '../services/pdfReportService';

interface InspectionListProps {
  inspections: Inspection[];
  currentUser: UserProfile;
  onSelectInspection: (inspectionId: string) => void;
  onCreateNew: () => void;
  submissionNotice?: {
    docketNumber: string;
    traderName: string;
    time: string;
  } | null;
  onDismissSubmissionNotice?: () => void;
}

export const InspectionList: React.FC<InspectionListProps> = ({
  inspections,
  currentUser,
  onSelectInspection,
  onCreateNew,
  submissionNotice,
  onDismissSubmissionNotice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  const triggerDeletePrompt = (e: React.MouseEvent, insp: Inspection) => {
    e.stopPropagation();
    setInspectionToDelete(insp);
  };

  const handleConfirmDelete = async () => {
    if (!inspectionToDelete) return;
    const target = inspectionToDelete;
    setDeletingId(target.id);
    try {
      await inspectionService.deleteInspection(target.id);
      setDeleteToast(`Inspection ${target.inspectionNumber} ("${target.businessName}") was successfully removed.`);
      setTimeout(() => setDeleteToast(null), 4000);
    } catch (err) {
      console.error('Failed to delete inspection:', err);
      alert('Failed to delete inspection from database. Please try again.');
    } finally {
      setDeletingId(null);
      setInspectionToDelete(null);
    }
  };

  const handleDownloadInspectionLatestPdf = (e: React.MouseEvent, insp: Inspection) => {
    e.stopPropagation();
    setDownloadingId(insp.id);
    try {
      const prods = inspectionService.getProductsSnapshot(insp.id);
      if (!prods || prods.length === 0) {
        alert('No commodities found in this inspection dossier.');
        return;
      }
      const latestProd = prods[prods.length - 1];
      const ev = inspectionService.getEvidenceSnapshot(latestProd.id);
      downloadOfficialProductDossierPdf({
        inspection: insp,
        product: latestProd,
        evidenceList: ev,
        includeFullDossierSchedule: true,
        allProducts: prods
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Counts
  const totalCount = inspections.length;
  const reviewQueueCount = inspections.filter(i => i.status === 'submitted').length;
  const inProgressCount = inspections.filter(i => i.status === 'in_progress' || i.status === 'draft').length;
  const nonCompliantCount = inspections.filter(i => i.complianceOutcome === 'non_compliant').length;
  const approvedCount = inspections.filter(i => i.status === 'approved').length;

  const filteredInspections = inspections.filter(insp => {
    const matchesSearch = 
      insp.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.inspectionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'review_queue') return insp.status === 'submitted';
    if (statusFilter === 'active') return insp.status === 'draft' || insp.status === 'in_progress' || insp.status === 'ready_to_submit';
    if (statusFilter === 'approved') return insp.status === 'approved';
    if (statusFilter === 'violations') return insp.complianceOutcome === 'non_compliant';

    return insp.status === statusFilter;
  });

  const getStatusBadge = (status: InspectionStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">Draft</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-600/40">In Progress</span>;
      case 'ready_to_submit':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-600/40">Ready to Submit</span>;
      case 'submitted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-600/40">In Review Queue</span>;
      case 'returned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-900/40 text-rose-300 border border-rose-600/40">Needs Correction</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-600/40">Approved / Completed</span>;
      case 'non_compliant':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-900/50 text-rose-300 border border-rose-600">Non-Compliant</span>;
    }
  };

  const getComplianceBadge = (outcome: Inspection['complianceOutcome']) => {
    switch (outcome) {
      case 'compliant':
        return <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Compliant</span>;
      case 'review_required':
        return <span className="inline-flex items-center text-xs font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800"><AlertTriangle className="w-3 h-3 mr-1" /> Review Required</span>;
      case 'non_compliant':
        return <span className="inline-flex items-center text-xs font-semibold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800"><AlertTriangle className="w-3 h-3 mr-1" /> Violations Found</span>;
      default:
        return <span className="inline-flex items-center text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Pending Eval</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-100">
      
      {/* Top Banner & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Inspection Register
            </h1>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              Zone 4 Division
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Statutory metrological verification records under Legal Metrology Act, 2009 & Packaged Commodities Rules
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            id="reset-demo-btn"
            onClick={() => {
              if (window.confirm('Reset all demo inspections and evidence to factory baseline?')) {
                inspectionService.resetDemoData();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
            title="Reload initial multi-product acceptance fixtures"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          {(currentUser.role === 'inspector' || currentUser.role === 'admin') && (
            <button
              id="create-inspection-btn"
              onClick={onCreateNew}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Field Inspection</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Submission Notification Banner on Dashboard */}
      {submissionNotice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/80 shadow-2xl flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Inspection Submitted to Reviewer Successfully!
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                  STATUTORY QUEUE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Inspection dossier <strong className="text-emerald-300 font-mono font-bold">{submissionNotice.docketNumber}</strong> for <span className="text-white font-semibold">{submissionNotice.traderName}</span> has been dispatched to the <strong>Reviewing Controller Authority</strong> for compliance validation.
              </p>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Submitted at {submissionNotice.time} • Ready in Review Queue</span>
              </div>
            </div>
          </div>
          {onDismissSubmissionNotice && (
            <button
              id="dismiss-submission-banner-btn"
              onClick={onDismissSubmissionNotice}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Role Notice Card */}
      {currentUser.role === 'reviewer' && (
        <div className="p-4 rounded-lg bg-purple-950/30 border border-purple-800/60 flex items-start space-x-3 text-xs text-purple-200">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Reviewer Authority Active: </span>
            You are reviewing submitted inspection dossiers. Open any submitted dossier to trace observations back to exact packaging photos, measurements, and statutory rules. You can approve or return for correction with attributable audit logging.
          </div>
        </div>
      )}

      {/* Metric Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('all')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Dossiers</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
          <span className="text-[11px] text-slate-500">Across all categories</span>
        </div>

        <div 
          onClick={() => setStatusFilter('active')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Field Capture</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-1">{inProgressCount}</p>
          <span className="text-[11px] text-slate-500">Draft & in progress</span>
        </div>

        <div 
          onClick={() => setStatusFilter('review_queue')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-800/80 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Reviewer Queue</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-300 mt-1">{reviewQueueCount}</p>
          <span className="text-[11px] text-purple-400">Awaiting controller decision</span>
        </div>

        <div 
          onClick={() => setStatusFilter('violations')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-800/80 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Violations / Flagged</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-1">{nonCompliantCount}</p>
          <span className="text-[11px] text-rose-400/80">Shortfall or missing decl.</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            id="search-inspections-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search business, dossier no., license..."
            className="w-full bg-slate-800 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Field Active ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter('review_queue')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'review_queue' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Review Queue ({reviewQueueCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'approved' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('violations')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'violations' 
                ? 'bg-rose-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Violations ({nonCompliantCount})
          </button>
        </div>

      </div>

      {/* Inspections List Cards */}
      <div className="space-y-3">
        {filteredInspections.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No inspections match this filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search or initiate a new inspection.</p>
          </div>
        ) : (
          filteredInspections.map((insp) => (
            <div
              key={insp.id}
              id={`inspection-card-${insp.id}`}
              onClick={() => onSelectInspection(insp.id)}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-xl p-5 cursor-pointer transition-all shadow-sm hover:shadow-md group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left block */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                      {insp.inspectionNumber}
                    </span>
                    {getStatusBadge(insp.status)}
                    {getComplianceBadge(insp.complianceOutcome)}
                    <span className="text-xs text-slate-400">
                      • {insp.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    {insp.businessName}
                  </h3>

                  <div className="flex items-center text-xs text-slate-400 space-x-4">
                    <span className="flex items-center">
                      <Building className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {insp.businessAddress}
                    </span>
                    <span className="hidden sm:inline">
                      Lic: <span className="font-mono text-slate-300">{insp.licenseNumber}</span>
                    </span>
                  </div>

                  {insp.reviewComments && (
                    <div className="text-xs bg-slate-800/80 p-2 rounded border border-slate-700 text-slate-300 flex items-start space-x-2 mt-1">
                      <span className="font-bold text-purple-400">Controller Note:</span>
                      <span>{insp.reviewComments}</span>
                    </div>
                  )}
                </div>

                {/* Right metadata and metrics block */}
                <div className="flex items-center justify-between lg:justify-end space-x-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                  
                  {/* Multi-product count badge (CRITICAL for PRD) */}
                  <div className="text-center px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
                    <div className="flex items-center justify-center space-x-1 text-slate-300 text-xs">
                      <Boxes className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-bold text-white">{insp.productCount}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Products</span>
                  </div>

                  {/* Evidence count badge */}
                  <div className="text-center px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
                    <div className="flex items-center justify-center space-x-1 text-slate-300 text-xs">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-white">{insp.evidenceCount}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Evidence</span>
                  </div>

                  {/* Inspector / Action button */}
                  <div className="flex items-center space-x-2.5">
                    <div className="hidden sm:block text-right text-xs">
                      <p className="text-slate-400">Inspector</p>
                      <p className="font-medium text-slate-200">{insp.inspectorName}</p>
                    </div>

                    <button
                      id={`download-pdf-dossier-${insp.id}`}
                      onClick={(e) => handleDownloadInspectionLatestPdf(e, insp)}
                      disabled={downloadingId === insp.id}
                      className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold transition-all flex items-center space-x-1.5"
                      title="Download Official PDF Dossier of latest product"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {downloadingId === insp.id ? 'Generating...' : 'Latest Product PDF'}
                      </span>
                    </button>

                    <button
                      id={`open-workstation-${insp.id}`}
                      className="px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold transition-all flex items-center space-x-1.5"
                    >
                      <span>
                        {currentUser.role === 'reviewer' && insp.status === 'submitted' 
                          ? 'Review Dossier' 
                          : 'Open Workstation'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove / Trash Inspection Dossier Button */}
                    <button
                      id={`delete-inspection-${insp.id}`}
                      type="button"
                      onClick={(e) => triggerDeletePrompt(e, insp)}
                      disabled={deletingId === insp.id}
                      className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-800/60 text-xs font-semibold transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md"
                      title={`Delete inspection dossier ${insp.inspectionNumber} from database & UI`}
                      aria-label={`Delete inspection ${insp.inspectionNumber}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Toast Notice upon Deletion */}
      {deleteToast && (
        <div className="fixed bottom-14 right-4 sm:right-6 z-50 bg-slate-900/95 text-slate-100 border border-rose-600/50 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-medium backdrop-blur-md animate-fade-in">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>{deleteToast}</span>
        </div>
      )}

      {/* In-App Deletion Confirmation Modal (Guaranteed iFrame compatibility) */}
      {inspectionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 animate-scale-in">
            <div className="flex items-center space-x-3 mb-4 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700/60">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Inspection Dossier?</h3>
                <p className="text-xs text-slate-400">This action will delete the item from the database and UI.</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 mb-5 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Inspection ID:</span>
                <span className="font-mono font-bold text-slate-200">{inspectionToDelete.inspectionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Business Name:</span>
                <span className="font-semibold text-slate-200">{inspectionToDelete.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commodities:</span>
                <span className="text-blue-400 font-medium">{inspectionToDelete.productCount} Items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attached Evidence:</span>
                <span className="text-emerald-400 font-medium">{inspectionToDelete.evidenceCount} Photos</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setInspectionToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-inspection-btn"
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId === inspectionToDelete.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId === inspectionToDelete.id ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
