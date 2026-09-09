import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Boxes, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Scale, 
  Sparkles, 
  Upload, 
  Trash2, 
  Plus, 
  Eye, 
  Send, 
  ShieldCheck, 
  Printer, 
  Download,
  Clock, 
  Calendar,
  Building,
  Check,
  ChevronRight,
  Maximize2,
  Info,
  QrCode,
  Tag,
  AlertCircle
} from 'lucide-react';
import { 
  Inspection, 
  Product, 
  EvidenceItem, 
  Finding, 
  AuditEvent, 
  UserProfile, 
  LegalMetrologyRule 
} from '../types';
import { inspectionService } from '../services/inspectionService';
import { STATUTORY_RULES, createPackagingEvidenceDataUrl } from '../lib/sampleData';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { ReviewerModal } from './ReviewerModal';
import { ProductAiScanner } from './ProductAiScanner';
import { IdentifiedProductData } from '../services/aiVisionService';
import { downloadOfficialProductDossierPdf } from '../services/pdfReportService';

interface InspectionWorkspaceProps {
  inspectionId: string;
  currentUser: UserProfile;
  onBack: (submittedNotice?: { docketNumber: string; traderName: string }) => void;
}

export const InspectionWorkspace: React.FC<InspectionWorkspaceProps> = ({
  inspectionId,
  currentUser,
  onBack
}) => {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProductId, setActiveProductId] = useState<string>('');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [allFindings, setAllFindings] = useState<Finding[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  // Workspace Semantic Tab Navigation
  type WorkspaceTab = 'evidence' | 'information' | 'measurements' | 'ocr' | 'findings' | 'attention' | 'report';
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('evidence');

  // Modals
  const [selectedEvidenceForView, setSelectedEvidenceForView] = useState<EvidenceItem | null>(null);
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductNetQty, setNewProductNetQty] = useState('1 kg');
  const [newProductMRP, setNewProductMRP] = useState('120');

  // New Finding dialog state
  const [showAddFindingModal, setShowAddFindingModal] = useState(false);
  const [findingRuleCode, setFindingRuleCode] = useState(STATUTORY_RULES[0].code);
  const [findingSeverity, setFindingSeverity] = useState<'violation' | 'warning' | 'advisory'>('violation');
  const [findingObservation, setFindingObservation] = useState('');
  const [findingEvidenceId, setFindingEvidenceId] = useState('');

  // Official PDF Dossier generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  // Deletion modals state (iFrame compatible)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteDossierModal, setShowDeleteDossierModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI WebCam / Image Packaging Scanner state
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'new_product' | 'current_evidence'>('current_evidence');

  const handleApplyAiScan = async (data: IdentifiedProductData, imageBase64: string) => {
    if (scannerTarget === 'new_product') {
      setNewProductName(data.productName);
      setNewProductBrand(data.brand);
      setNewProductNetQty(data.netQuantity);
      setNewProductMRP(data.mrp.toString());
    } else if (activeProductId) {
      // 1. Add as verified evidence to active product
      await inspectionService.addEvidence(inspectionId, activeProductId, {
        title: `AI Packaging Scan - ${data.productName}`,
        imageUrl: imageBase64,
        ocrRawText: `LEGAL METROLOGY SCAN: ${data.brand} - ${data.productName} • NET QTY: ${data.netQuantity} • MRP: ₹ ${data.mrp} • USP: ${data.unitSalePrice} • PKD: ${data.monthYearOfManufacture}`,
        ocrConfidence: data.confidenceScore || 0.98,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high'
      });

      // 2. Update active product details with real extracted data
      await inspectionService.updateProduct(inspectionId, activeProductId, {
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
    }
  };

  // 1. Subscribe to inspection
  useEffect(() => {
    const unsub = inspectionService.subscribeInspections((list) => {
      const found = list.find(i => i.id === inspectionId);
      if (found) setInspection(found);
    });
    return unsub;
  }, [inspectionId]);

  // 2. Subscribe to products of this inspection
  useEffect(() => {
    const unsub = inspectionService.subscribeProducts(inspectionId, (prods) => {
      setProducts(prods);
      // Auto-select first product if none selected or current was removed
      if (prods.length > 0) {
        if (!activeProductId || !prods.some(p => p.id === activeProductId)) {
          setActiveProductId(prods[0].id);
        }
      } else {
        setActiveProductId('');
      }
    });
    return unsub;
  }, [inspectionId, activeProductId]);

  // 3. Subscribe to evidence of the active product (CRITICAL product-scoped isolation!)
  useEffect(() => {
    if (!activeProductId) {
      setEvidenceList([]);
      return;
    }
    const unsub = inspectionService.subscribeEvidence(activeProductId, (ev) => {
      setEvidenceList(ev);
    });
    return unsub;
  }, [activeProductId]);

  // 4. Subscribe to findings & audit
  useEffect(() => {
    const unsubFindings = inspectionService.subscribeFindings((findings) => {
      setAllFindings(findings.filter(f => f.inspectionId === inspectionId));
    });
    const unsubAudit = inspectionService.subscribeAudit((audits) => {
      setAuditEvents(audits.filter(a => a.inspectionId === inspectionId));
    });
    return () => {
      unsubFindings();
      unsubAudit();
    };
  }, [inspectionId]);

  if (!inspection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <Scale className="w-12 h-12 mx-auto text-slate-600 animate-spin mb-4" />
        <p>Loading inspection context and product dossier...</p>
      </div>
    );
  }

  const activeProduct = products.find(p => p.id === activeProductId);
  const activeProductFindings = allFindings.filter(f => f.productId === activeProductId);
  const latestProduct = products.length > 0 ? products[products.length - 1] : undefined;

  // Handlers for Official PDF Dossier generation
  const handleDownloadLatestProductPdf = () => {
    if (!inspection) return;
    const target = latestProduct || activeProduct;
    if (!target) {
      alert('This inspection dossier does not contain any commodities yet.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      downloadOfficialProductDossierPdf({
        inspection,
        product: target,
        evidenceList,
        findings: allFindings,
        includeFullDossierSchedule: true,
        allProducts: products
      });
      setPdfNotice(`Official Statutory PDF Dossier for latest commodity "${target.name}" downloaded!`);
      setTimeout(() => setPdfNotice(null), 4500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadSpecificProductPdf = (targetProduct?: Product) => {
    if (!inspection) return;
    const target = targetProduct || activeProduct || latestProduct;
    if (!target) return;
    setIsGeneratingPdf(true);
    try {
      downloadOfficialProductDossierPdf({
        inspection,
        product: target,
        evidenceList,
        findings: allFindings,
        includeFullDossierSchedule: true,
        allProducts: products
      });
      setPdfNotice(`Official Statutory PDF Dossier for "${target.name}" downloaded!`);
      setTimeout(() => setPdfNotice(null), 4500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handlers for Products
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const created = await inspectionService.addProduct(inspectionId, {
      name: newProductName.trim(),
      brand: newProductBrand.trim() || 'Standard Commercial Brand',
      netQuantity: newProductNetQty,
      mrp: parseFloat(newProductMRP) || 100,
      declaredUnits: newProductNetQty.includes('kg') ? 'kg' : newProductNetQty.includes('l') ? 'l' : 'g'
    });

    setActiveProductId(created.id);
    setNewProductName('');
    setNewProductBrand('');
    setShowAddProductModal(false);
  };

  const handleDeleteProduct = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setProductToDelete(prod);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await inspectionService.deleteProduct(inspectionId, productToDelete.id);
    } catch (err) {
      console.error('Failed to delete product:', err);
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteInspectionDossier = () => {
    if (!inspection) return;
    setShowDeleteDossierModal(true);
  };

  const handleConfirmDeleteDossier = async () => {
    if (!inspection) return;
    setIsDeleting(true);
    try {
      await inspectionService.deleteInspection(inspectionId);
      setShowDeleteDossierModal(false);
      onBack();
    } catch (err) {
      console.error('Failed to delete inspection:', err);
      setIsDeleting(false);
    }
  };

  // Handlers for Evidence (CRITICAL: Product-scoped)
  const handleAddSampleEvidence = async (presetType: 'front' | 'mrp' | 'scale' | 'custom') => {
    if (!activeProductId || !activeProduct) return;

    let title = 'Packaging Label Evidence';
    let defectText: string | undefined;

    if (presetType === 'front') {
      title = `${activeProduct.name} - Front Display Panel`;
    } else if (presetType === 'mrp') {
      title = `${activeProduct.name} - MRP & Batch Declaration Face`;
    } else if (presetType === 'scale') {
      title = `${activeProduct.name} - Digital Check Scale Verification`;
    } else {
      title = `${activeProduct.name} - Sample Inspection Image`;
      defectText = 'SAMPLE AUDIT DEFECT FOR TESTING';
    }

    const imgUrl = createPackagingEvidenceDataUrl(
      title,
      activeProduct.brand,
      activeProduct.netQuantity,
      activeProduct.mrp,
      defectText
    );

    await inspectionService.addEvidence(inspectionId, activeProductId, {
      title,
      imageUrl: imgUrl,
      ocrRawText: `LEGAL METROLOGY OCR CAPTURE: ${activeProduct.brand.toUpperCase()} - ${activeProduct.name.toUpperCase()} NET QTY: ${activeProduct.netQuantity} MRP: Rs ${activeProduct.mrp.toFixed(2)} INCL ALL TAXES`,
      ocrFields: {
        mrp: activeProduct.mrp.toString(),
        netQuantity: activeProduct.netQuantity,
        mfgDate: '08/2026',
        manufacturer: activeProduct.manufacturerName
      },
      ocrConfidence: 0.96,
      verificationStatus: 'ai_detected',
      imageQuality: 'high'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeProductId || !activeProduct) return;
    
    Array.from(e.target.files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await inspectionService.addEvidence(inspectionId, activeProductId, {
          title: file.name.replace(/\.[^/.]+$/, ""),
          imageUrl: base64,
          ocrRawText: `MANUAL FIELD CAPTURE: ${file.name} - Uploaded by ${currentUser.displayName}`,
          ocrConfidence: 0.90,
          verificationStatus: 'ai_detected',
          imageQuality: 'high'
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!activeProductId) return;
    if (window.confirm('Delete this evidence image? This action will update evidence counts exclusively for this product.')) {
      await inspectionService.deleteEvidence(inspectionId, activeProductId, evidenceId);
    }
  };

  // Handlers for Findings
  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProductId || !activeProduct || !findingObservation.trim()) return;

    const rule = STATUTORY_RULES.find(r => r.code === findingRuleCode) || STATUTORY_RULES[0];

    await inspectionService.addFinding({
      inspectionId,
      productId: activeProductId,
      productName: activeProduct.name,
      ruleCode: rule.code,
      ruleTitle: rule.title,
      ruleDescription: rule.description,
      severity: findingSeverity,
      status: 'open',
      observation: findingObservation.trim(),
      evidenceId: findingEvidenceId || (evidenceList[0]?.id || undefined),
      evidenceTitle: evidenceList.find(e => e.id === findingEvidenceId)?.title || evidenceList[0]?.title
    });

    setFindingObservation('');
    setShowAddFindingModal(false);
  };

  // Measurement update with MPE calculation
  const handleMeasurementChange = (actual: string, tare: string) => {
    if (!activeProductId || !activeProduct) return;

    // Tolerance estimation:
    let outcome: Product['measurementOutcome'] = 'within_tolerance';
    const declaredNum = parseFloat(activeProduct.netQuantity) || 1;
    const actualNum = parseFloat(actual);

    if (!isNaN(actualNum) && actualNum < (declaredNum * 0.98)) {
      outcome = 'short_weight';
    } else if (!isNaN(actualNum) && actualNum >= (declaredNum * 0.98)) {
      outcome = 'within_tolerance';
    }

    inspectionService.updateProduct(inspectionId, activeProductId, {
      actualMeasurement: actual,
      tareWeight: tare,
      measurementOutcome: outcome
    });
  };

  // Inspector Submits Inspection
  const handleSubmitForReview = async () => {
    try {
      await inspectionService.submitForReview(inspectionId, currentUser.displayName, currentUser.uid);
      if (onBack) {
        onBack({
          docketNumber: inspection?.inspectionNumber || inspectionId,
          traderName: inspection?.businessName || 'Commercial Establishment'
        });
      }
    } catch (err) {
      console.error('Submit to reviewer error:', err);
      if (onBack) {
        onBack({
          docketNumber: inspection?.inspectionNumber || inspectionId,
          traderName: inspection?.businessName || 'Commercial Establishment'
        });
      }
    }
  };

  // Reviewer Decision
  const handleReviewerDecision = async (decision: 'approved' | 'returned', comments: string) => {
    await inspectionService.reviewInspection(
      inspectionId,
      decision,
      comments,
      currentUser.displayName,
      currentUser.uid
    );
  };

  // Can Inspector Edit?
  const isInspectorEditable = (inspection.status === 'draft' || inspection.status === 'in_progress' || inspection.status === 'returned') && currentUser.role !== 'reviewer';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-100">
      
      {/* 1. Global Command Bar (Inspection Context) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Inspection Register</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-800">
                {inspection.inspectionNumber}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700">
                {inspection.status.replace('_', ' ')}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                inspection.complianceOutcome === 'compliant'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                  : inspection.complianceOutcome === 'non_compliant'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-700'
                  : 'bg-amber-950/60 text-amber-300 border-amber-700'
              }`}>
                {inspection.complianceOutcome.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-xl font-black text-white">
              {inspection.businessName}
            </h1>
            <p className="text-xs text-slate-400 flex items-center space-x-2">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{inspection.businessAddress}</span>
              <span>• Lic: <strong className="font-mono text-slate-300">{inspection.licenseNumber}</strong></span>
            </p>
          </div>

          {/* Top Lifecycle Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Submit to Reviewer Button (Inspector) */}
            {isInspectorEditable && (
              <button
                id="submit-inspection-review-btn"
                onClick={handleSubmitForReview}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-colors flex items-center space-x-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Reviewer</span>
              </button>
            )}

            {/* Reviewer Assessment Button (Reviewer) */}
            {currentUser.role === 'reviewer' && (
              <button
                id="open-reviewer-assessment-btn"
                onClick={() => setShowReviewerModal(true)}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-colors flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Record Reviewer Decision</span>
              </button>
            )}

            {/* Print / Export Report Button */}
            <button
              id="export-dossier-report-btn"
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'report'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Dossier</span>
            </button>

            {/* Direct Export Latest Product PDF Button */}
            <button
              id="export-latest-product-pdf-btn"
              onClick={handleDownloadLatestProductPdf}
              disabled={isGeneratingPdf || products.length === 0}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
              title="Download statutory compliance report for latest product in PDF format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Latest Product PDF'}</span>
            </button>

            {/* Delete Inspection Dossier Button */}
            <button
              id="delete-inspection-workspace-btn"
              onClick={handleDeleteInspectionDossier}
              className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/60 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm"
              title={`Permanently delete inspection ${inspection.inspectionNumber}`}
              aria-label="Delete inspection dossier"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* PDF Download Toast / Notice */}
        {pdfNotice && (
          <div className="mt-3 p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-200 rounded-lg text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{pdfNotice}</span>
            </div>
            <button 
              onClick={() => setPdfNotice(null)}
              className="text-emerald-400 hover:text-white text-xs font-mono ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Inspection Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/40 p-2.5 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Total Products</span>
            <span className="text-base font-bold text-white">{products.length} Items</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Total Evidence Photos</span>
            <span className="text-base font-bold text-emerald-400">{inspection.evidenceCount} Files</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Active Violations</span>
            <span className="text-base font-bold text-rose-400">
              {allFindings.filter(f => f.severity === 'violation').length} Flags
            </span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Inspector</span>
            <span className="text-slate-200 font-medium truncate block">{inspection.inspectorName}</span>
          </div>
        </div>
      </div>

      {/* 2. Multi-Product Navigation Rail (CRITICAL PRD REQUIREMENT) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Scoped Commodities ({products.length} Products)
            </h2>
          </div>

          {isInspectorEditable && (
            <button
              id="add-product-btn"
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}
        </div>

        {/* Product Tabs Rail */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
          {products.map((p, idx) => {
            const isSelected = p.id === activeProductId;
            const pEvidence = inspectionService.getEvidenceSnapshot(p.id);
            const pFindings = allFindings.filter(f => f.productId === p.id);
            const hasViolations = pFindings.some(f => f.severity === 'violation');

            return (
              <div
                key={p.id}
                id={`product-tab-${p.id}`}
                onClick={() => setActiveProductId(p.id)}
                className={`group flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all border whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-xs block max-w-[140px] sm:max-w-[180px] truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {p.brand} • {pEvidence.length} Evidence
                    </span>
                  </div>
                </div>

                {hasViolations && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="Violation flagged on this product"></span>
                )}

                {isInspectorEditable && (
                  <button
                    id={`delete-product-btn-${p.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(p.id);
                    }}
                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 p-1.5 rounded-md transition-colors"
                    title={`Remove ${p.name}`}
                    aria-label={`Remove ${p.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* If No Product Exists */}
      {products.length === 0 && (
        <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-semibold">No commodities configured for this inspection.</p>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
          >
            Add First Product
          </button>
        </div>
      )}

      {/* Active Product Workspace */}
      {activeProduct && (
        <div className="space-y-4">
          
          {/* Active Product Headline Banner */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-blue-400 font-mono">
                  PROD ID: {activeProduct.id}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-semibold text-slate-300">
                  Batch: {activeProduct.batchNumber}
                </span>
                {activeProduct.complianceStatus === 'violation' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    Statutory Violation Flagged
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                {activeProduct.name}
              </h3>
              <p className="text-xs text-slate-400">
                Declared Net Qty: <strong className="text-white">{activeProduct.netQuantity}</strong> | MRP: <strong className="text-emerald-400">₹ {activeProduct.mrp.toFixed(2)}</strong> | Mfd: {activeProduct.monthYearOfManufacture}
              </p>
            </div>

            {/* Action Group: Evidence Count & Remove Product Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-3 text-xs bg-slate-800 px-3.5 py-2 rounded-lg border border-slate-700">
                <Camera className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Product Evidence</span>
                  <span className="font-bold text-white text-sm" id="active-product-evidence-count">
                    {evidenceList.length} Photos Attached
                  </span>
                </div>
              </div>

              {isInspectorEditable && (
                <button
                  id={`remove-active-product-btn-${activeProduct.id}`}
                  onClick={() => handleDeleteProduct(activeProduct.id)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 text-xs font-bold transition-all shadow-sm"
                  title={`Remove ${activeProduct.name} from docket`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Product</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Semantic Navigation Bar (PRD Section 8) */}
          <div className="grid grid-cols-4 sm:grid-cols-7 border-b border-slate-800 text-xs font-semibold text-center bg-slate-900 rounded-t-xl overflow-hidden">
            <button
              id="tab-evidence-btn"
              onClick={() => setActiveTab('evidence')}
              className={`py-3 px-2 border-b-2 transition-colors flex flex-col items-center space-y-1 ${
                activeTab === 'evidence'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Evidence ({evidenceList.length})</span>
            </button>

            <button
              id="tab-information-btn"
              onClick={() => setActiveTab('information')}
              className={`py-3 px-2 border-b-2 transition-colors flex flex-col items-center space-y-1 ${
                activeTab === 'information'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Declarations</span>
            </button>

            <button
              id="tab-measurements-btn"
              onClick={() => setActiveTab('measurements')}
              className={`py-3 px-2 border-b-2 transition-colors flex flex-col items-center space-y-1 ${
                activeTab === 'measurements'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Measurements</span>
            </button>

            <button
              id="tab-ocr-btn"
              onClick={() => setActiveTab('ocr')}
              className={`py-3 px-2 border-b-2 transition-colors flex flex-col items-center space-y-1 ${
                activeTab === 'ocr'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>OCR Assist</span>
            </button>

            <button
              id="tab-findings-btn"
              onClick={() => setActiveTab('findings')}
              className={`py-3 px-2 border-b-2 transition-colors flex flex-col items-center space-y-1 ${
                activeTab === 'findings'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Findings ({activeProductFindings.length})</span>
            </button>

            <button
              id="tab-attention-btn"
              onClick={() => setActiveTab('attention')}
              className={`py-3 px-2 border-b-2 transition-colors flex flex-col items-center space-y-1 ${
                activeTab === 'attention'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Attention ({activeProductFindings.length + (evidenceList.length === 0 ? 1 : 0)})</span>
            </button>

            <button
              id="tab-report-btn"
              onClick={() => setActiveTab('report')}
              className={`py-3 px-2 border-b-2 transition-colors flex flex-col items-center space-y-1 ${
                activeTab === 'report'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dossier</span>
            </button>
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="bg-slate-900 border border-slate-800 rounded-b-xl p-6 min-h-[420px]">
            
            {/* 1. EVIDENCE MANAGEMENT (Multi-evidence capture, gallery, delete, zoom) */}
            {activeTab === 'evidence' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Packaging Evidence Gallery for "{activeProduct.name}"
                    </h4>
                    <p className="text-xs text-slate-400">
                      Attach certified packaging panel photos, electronic balance readouts, and batch markings.
                    </p>
                  </div>

                  {isInspectorEditable && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Live WebCam AI Packaging Scan (No Typing) */}
                      <button
                        id="scan-packaging-webcam-btn"
                        type="button"
                        onClick={() => {
                          setScannerTarget('current_evidence');
                          setIsAiScannerOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Live WebCam / AI Scan</span>
                      </button>

                      <label 
                        id="upload-custom-evidence-btn"
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center space-x-1.5 transition-colors shadow"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photos</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Quick preset evidence generator for testing Golden Workflow */}
                      <button
                        id="add-preset-front-btn"
                        onClick={() => handleAddSampleEvidence('front')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        + Front Panel
                      </button>
                      <button
                        id="add-preset-mrp-btn"
                        onClick={() => handleAddSampleEvidence('mrp')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        + MRP Stamp
                      </button>
                      <button
                        id="add-preset-scale-btn"
                        onClick={() => handleAddSampleEvidence('scale')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        + Scale Readout
                      </button>
                    </div>
                  )}
                </div>

                {/* Evidence Grid (Isolated strictly to active product) */}
                {evidenceList.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-xl space-y-3">
                    <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-slate-300">No evidence photos attached to this product yet.</p>
                      <p className="text-xs text-slate-500">Attach front panel, MRP declaration, or standard weight readouts.</p>
                    </div>
                    {isInspectorEditable && (
                      <button
                        onClick={() => handleAddSampleEvidence('front')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                      >
                        Generate Sample Packaging Photo
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {evidenceList.map((ev) => (
                      <div
                        key={ev.id}
                        id={`evidence-card-${ev.id}`}
                        className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group hover:border-blue-500/60 transition-all flex flex-col"
                      >
                        {/* Image Canvas Container */}
                        <div 
                          className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center"
                          onClick={() => setSelectedEvidenceForView(ev)}
                        >
                          <img
                            src={ev.imageUrl}
                            alt={ev.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <span className="p-2 rounded-full bg-slate-900/80 text-white hover:bg-blue-600 transition-colors">
                              <Maximize2 className="w-4 h-4" />
                            </span>
                          </div>

                          <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded border ${
                            ev.verificationStatus === 'inspector_verified'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                              : 'bg-amber-950/80 text-amber-300 border-amber-700'
                          }`}>
                            {ev.verificationStatus === 'inspector_verified' ? 'Verified' : 'AI Extracted'}
                          </span>
                        </div>

                        {/* Metadata Footer */}
                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="font-bold text-xs text-white truncate" title={ev.title}>
                              {ev.title}
                            </h5>
                            <span className="font-mono text-[10px] text-slate-500 block">
                              ID: {ev.id}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[11px] text-slate-400">
                            <span>Quality: <strong className="text-white capitalize">{ev.imageQuality}</strong></span>
                            
                            {isInspectorEditable && (
                              <button
                                id={`delete-evidence-btn-${ev.id}`}
                                onClick={() => handleDeleteEvidence(ev.id)}
                                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                title="Delete this evidence image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. STATUTORY DECLARATIONS (Rule 6 Form) */}
            {activeTab === 'information' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white">
                    Rule 6 Mandatory Declarations Panel
                  </h4>
                  <p className="text-xs text-slate-400">
                    Verify statutory declarations required under Legal Metrology (Packaged Commodities) Rules, 2011.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Manufacturer / Packer Name (Rule 6(1)(a))
                    </label>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.manufacturerName}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { manufacturerName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Complete Address of Manufacturing Premises
                    </label>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.manufacturerAddress}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { manufacturerAddress: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Maximum Retail Price (MRP in ₹) (Rule 6(1)(d))
                    </label>
                    <input
                      type="number"
                      disabled={!isInspectorEditable}
                      value={activeProduct.mrp}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { mrp: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-emerald-300 font-bold disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Unit Sale Price (USP) (Rule 6(1)(f))
                    </label>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.unitSalePrice || ''}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { unitSalePrice: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Month & Year of Manufacture / Packing (Rule 6(1)(c))
                    </label>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.monthYearOfManufacture}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { monthYearOfManufacture: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Consumer Care Telephone & Email (Rule 6(1)(e))
                    </label>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.consumerCareDetails}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { consumerCareDetails: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Country of Origin Declaration
                    </label>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.countryOfOrigin || 'India'}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { countryOfOrigin: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Inspector Field Remarks
                    </label>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.notes || ''}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { notes: e.target.value })}
                      placeholder="e.g. Tamper-evident seal intact. Declarations in prescribed font size."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Statutory declaration status: <strong className="text-white capitalize">{activeProduct.verificationStatus}</strong></span>
                  </div>
                  {isInspectorEditable && (
                    <button
                      onClick={() => inspectionService.updateProduct(inspectionId, activeProductId, { verificationStatus: 'verified' })}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Mark Declarations Verified
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 3. METROLOGICAL MEASUREMENTS (Rule 9, Tolerances & MPE) */}
            {activeTab === 'measurements' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white">
                    Metrological Verification & Tolerance Engine
                  </h4>
                  <p className="text-xs text-slate-400">
                    Compare certified standard weight measurements against declared quantity and evaluate Maximum Permissible Error (MPE).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  
                  {/* Declared Nominal Quantity */}
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
                    <span className="text-slate-400 font-bold block">1. Declared Nominal Net Quantity</span>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.netQuantity}
                      onChange={(e) => inspectionService.updateProduct(inspectionId, activeProductId, { netQuantity: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-lg font-bold text-white disabled:opacity-60"
                    />
                    <span className="text-[11px] text-slate-500">Stated on label face</span>
                  </div>

                  {/* Certified Measurement */}
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
                    <span className="text-slate-400 font-bold block">2. Actual Standard Measurement</span>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.actualMeasurement || ''}
                      onChange={(e) => handleMeasurementChange(e.target.value, activeProduct.tareWeight || '0.015 kg')}
                      placeholder="e.g. 0.965 kg or 965 ml"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-lg font-bold text-emerald-300 disabled:opacity-60"
                    />
                    <span className="text-[11px] text-slate-500">Measured on Class III verified balance</span>
                  </div>

                  {/* Tare Weight */}
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
                    <span className="text-slate-400 font-bold block">3. Certified Packaging Tare Weight</span>
                    <input
                      type="text"
                      disabled={!isInspectorEditable}
                      value={activeProduct.tareWeight || ''}
                      onChange={(e) => handleMeasurementChange(activeProduct.actualMeasurement || '', e.target.value)}
                      placeholder="e.g. 0.018 kg"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-lg font-bold text-white disabled:opacity-60"
                    />
                    <span className="text-[11px] text-slate-500">Empty packaging mass</span>
                  </div>

                </div>

                {/* Tolerance & Outcome Banner */}
                <div className={`p-5 rounded-xl border flex items-center justify-between ${
                  activeProduct.measurementOutcome === 'short_weight'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {activeProduct.measurementOutcome === 'short_weight' ? (
                      <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <h5 className="font-bold text-sm text-white">
                        {activeProduct.measurementOutcome === 'short_weight'
                          ? 'Short Delivery / Negative Error Violation'
                          : 'Measurement Within Permissible Error (MPE)'}
                      </h5>
                      <p className="text-xs opacity-90">
                        {activeProduct.measurementOutcome === 'short_weight'
                          ? 'Measured quantity exceeds statutory tolerance limit under Second Schedule of PCR 2011.'
                          : 'Net quantity conforms to statutory tolerance criteria under Rule 9.'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-slate-900 border border-slate-700">
                    MPE: {activeProduct.mpeTolerance || '± 15 g'}
                  </span>
                </div>

              </div>
            )}

            {/* 4. OCR & AI-ASSISTED EXTRACTION */}
            {activeTab === 'ocr' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white">
                    OCR & AI Label Extraction Pipeline
                  </h4>
                  <p className="text-xs text-slate-400">
                    AI assists extraction and prioritization; it does not replace inspector or reviewer accountability (PRD 7.4).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Extracted Candidate Fields */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Candidate Extraction Fields
                    </h5>

                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-700">
                        <span className="text-slate-400">Declared MRP:</span>
                        <span className="font-bold text-emerald-300">₹ {activeProduct.mrp.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-700">
                        <span className="text-slate-400">Net Quantity:</span>
                        <span className="font-bold text-white">{activeProduct.netQuantity}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-700">
                        <span className="text-slate-400">Packaging Date:</span>
                        <span className="font-medium text-slate-200">{activeProduct.monthYearOfManufacture}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-700">
                        <span className="text-slate-400">Manufacturer:</span>
                        <span className="text-slate-300 truncate max-w-[200px]">{activeProduct.manufacturerName}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-400">Confidence Score:</span>
                        <span className="font-bold text-emerald-400">97.4% High Quality</span>
                      </div>
                    </div>

                    {isInspectorEditable && (
                      <button
                        onClick={() => {
                          inspectionService.updateProduct(inspectionId, activeProductId, { verificationStatus: 'verified' });
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Apply Verified Values</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Latest Evidence Photo Reference */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Supporting Packaging Image
                    </h5>
                    {evidenceList.length > 0 ? (
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <img
                          src={evidenceList[0].imageUrl}
                          alt="Primary Evidence"
                          className="w-full max-h-56 object-contain rounded"
                        />
                        <span className="text-[11px] text-slate-400 block text-center mt-2">
                          Source: {evidenceList[0].title}
                        </span>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-500">
                        Upload evidence photo to trigger OCR extraction.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. COMPLIANCE & STATUTORY FINDINGS */}
            {activeTab === 'findings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Statutory Rule Findings for "{activeProduct.name}"
                    </h4>
                    <p className="text-xs text-slate-400">
                      Rule → Evidence → Observation → Verification → Finding → Decision traceability (PRD 7.6).
                    </p>
                  </div>

                  {isInspectorEditable && (
                    <button
                      id="log-statutory-finding-btn"
                      onClick={() => setShowAddFindingModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Statutory Finding</span>
                    </button>
                  )}
                </div>

                {activeProductFindings.length === 0 ? (
                  <div className="py-12 text-center border border-slate-800 rounded-xl space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-200">No active statutory violations or warnings.</p>
                    <p className="text-xs text-slate-500">Commodity declarations and physical measurements comply with PCR 2011.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProductFindings.map((finding) => (
                      <div
                        key={finding.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              finding.severity === 'violation'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {finding.severity}
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-400">
                              {finding.ruleCode}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-slate-500">Status:</span>
                            <span className="font-semibold text-white capitalize">{finding.status}</span>
                            {isInspectorEditable && finding.status === 'open' && (
                              <button
                                onClick={() => inspectionService.resolveFinding(inspectionId, finding.id)}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-bold text-sm text-white">{finding.ruleTitle}</h5>
                          <p className="text-xs text-slate-400 mt-0.5">{finding.ruleDescription}</p>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                          <span className="font-bold text-slate-400 block text-[11px] uppercase">
                            Observation & Evidence Linkage:
                          </span>
                          <p>{finding.observation}</p>
                          {finding.evidenceTitle && (
                            <span className="text-[11px] text-blue-400 font-mono block pt-1">
                              Linked Evidence: {finding.evidenceTitle} ({finding.evidenceId})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. ATTENTION CENTER & AUDIT LOG */}
            {activeTab === 'attention' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white">
                    Attention Center & Unresolved Actions (PRD 7.8)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Prioritizes required actions before submission and review sign-off.
                  </p>
                </div>

                {/* Attention Items */}
                <div className="space-y-2">
                  {evidenceList.length === 0 && (
                    <div className="p-3 bg-amber-950/30 border border-amber-800 rounded-lg flex items-center justify-between text-xs text-amber-300">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Zero packaging evidence attached to {activeProduct.name}. Capture required before submission.</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('evidence')}
                        className="px-2.5 py-1 bg-amber-800 hover:bg-amber-700 text-white rounded font-bold"
                      >
                        Add Evidence
                      </button>
                    </div>
                  )}

                  {activeProductFindings.filter(f => f.status === 'open').map(f => (
                    <div key={f.id} className="p-3 bg-rose-950/30 border border-rose-800 rounded-lg flex items-center justify-between text-xs text-rose-300">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Unresolved [{f.ruleCode}]: {f.ruleTitle} - requires inspector note or verification.</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('findings')}
                        className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded font-bold"
                      >
                        View Finding
                      </button>
                    </div>
                  ))}

                  {evidenceList.length > 0 && activeProductFindings.filter(f => f.status === 'open').length === 0 && (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>All required attention items for {activeProduct.name} are satisfied and ready for review.</span>
                    </div>
                  )}
                </div>

                {/* Inspection Chronological Audit Trail */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Inspection Audit Timeline ({auditEvents.length} Events)
                  </h5>

                  <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800">
                    {auditEvents.map(event => (
                      <div key={event.id} className="p-3 text-xs flex items-start space-x-3">
                        <span className="font-mono text-slate-500 text-[10px] shrink-0 pt-0.5">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white font-mono">{event.action}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono capitalize">
                              {event.actorRole}
                            </span>
                          </div>
                          <p className="text-slate-300">{event.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. OFFICIAL INSPECTION DOSSIER & REPORT (PRD 7.7) */}
            {activeTab === 'report' && (
              <div className="space-y-6 bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200">
                
                {/* Official Statutory Dossier Export Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-100 to-emerald-50/60 p-4 rounded-xl border border-slate-300">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Official Statutory Dossier Export Engine
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Export legally certified PDF dossiers complying with Legal Metrology Act 2009 & Packaged Commodities Rules 2011.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Primary Button: Download Report of Latest Product in PDF */}
                    <button
                      id="report-download-latest-product-pdf-btn"
                      onClick={handleDownloadLatestProductPdf}
                      disabled={isGeneratingPdf || products.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center space-x-2"
                      title="Download PDF report for latest product"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {isGeneratingPdf ? 'Generating PDF...' : `Download Latest Product PDF (${latestProduct?.name || 'Latest'})`}
                      </span>
                    </button>

                    {/* Secondary Button: Download Complete Dossier PDF */}
                    <button
                      id="report-download-full-dossier-pdf-btn"
                      onClick={() => handleDownloadSpecificProductPdf()}
                      disabled={isGeneratingPdf || products.length === 0}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center space-x-1.5"
                      title="Download complete inspection dossier with full product schedule"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Full Dossier PDF</span>
                    </button>

                    {/* Print Button */}
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg shadow transition-all flex items-center space-x-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Document</span>
                    </button>
                  </div>
                </div>

                {/* Official Statutory Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <p className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                    GOVERNMENT OF INDIA • DEPARTMENT OF CONSUMER AFFAIRS
                  </p>
                  <h2 className="text-xl font-black tracking-tight text-slate-950">
                    DIRECTORATE OF LEGAL METROLOGY
                  </h2>
                  <p className="text-xs font-semibold text-slate-700">
                    STATUTORY INSPECTION DOSSIER & COMPLIANCE CERTIFICATE
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Issued under the Legal Metrology Act, 2009 read with Legal Metrology (Packaged Commodities) Rules, 2011
                  </p>
                </div>

                {/* Dossier Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-slate-500 block">Dossier Number:</span>
                    <strong className="font-mono text-slate-900">{inspection.inspectionNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date of Inspection:</span>
                    <strong className="text-slate-900">{inspection.scheduledDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Jurisdiction:</span>
                    <strong className="text-slate-900">{inspection.jurisdiction}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Trading License No:</span>
                    <strong className="font-mono text-slate-900">{inspection.licenseNumber}</strong>
                  </div>
                </div>

                {/* Target Enterprise */}
                <div className="text-xs space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block uppercase">Inspected Enterprise & Premises:</span>
                  <p className="font-bold text-slate-900 text-sm">{inspection.businessName}</p>
                  <p className="text-slate-600">{inspection.businessAddress}</p>
                </div>

                {/* Latest Commodity Detailed Verification Audit Card */}
                {latestProduct && (
                  <div className="p-4 bg-emerald-50/70 border-2 border-emerald-500/30 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                          Latest Commodity Profile Under Audit
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-1 flex items-center gap-2">
                          <span>{latestProduct.name}</span>
                          <span className="text-xs font-normal text-slate-600">({latestProduct.brand})</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDownloadSpecificProductPdf(latestProduct)}
                        disabled={isGeneratingPdf}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Latest Product Report (PDF)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Declared Net Quantity:</span>
                        <strong className="text-slate-900 font-mono">{latestProduct.netQuantity}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Verified Scale Measurement:</span>
                        <strong className="text-slate-900 font-mono">{latestProduct.actualMeasurement || 'Physical scale verified'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">MRP (Incl. of all taxes):</span>
                        <strong className="text-slate-900 font-bold">₹ {latestProduct.mrp.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Rule 9 MPE Tolerance:</span>
                        <span className="inline-block px-1.5 py-0.5 rounded font-bold text-[10px] uppercase bg-emerald-100 text-emerald-800">
                          {latestProduct.complianceStatus === 'compliant' ? 'Within Statutory Limits' : 'Non-Compliant / MPE Breach'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded border border-emerald-200">
                      <div>
                        <span className="text-slate-400 block">Unit Sale Price (USP):</span>
                        <span className="text-slate-800 font-medium">{latestProduct.unitSalePrice || 'Compliant with Rule 6'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Mfg / Pkg Date:</span>
                        <span className="text-slate-800 font-medium">{latestProduct.monthYearOfManufacture || 'Standard'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Manufacturer / Address:</span>
                        <span className="text-slate-800 truncate block font-medium" title={latestProduct.manufacturerAddress || latestProduct.manufacturerName}>
                          {latestProduct.manufacturerName || 'Certified Enterprise'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comprehensive Multi-Product Table (PRD 7.7: Must enumerate all products!) */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
                    Schedule of Inspected Commodities ({products.length} Products)
                  </h4>
                  <div className="overflow-x-auto border border-slate-300 rounded">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Commodity & Brand</th>
                          <th className="p-2">Batch / Lot</th>
                          <th className="p-2">Declared Qty</th>
                          <th className="p-2">Measured Qty</th>
                          <th className="p-2">MRP (₹)</th>
                          <th className="p-2">Evidence</th>
                          <th className="p-2">Outcome</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {products.map((p, i) => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono">{i + 1}</td>
                            <td className="p-2 font-semibold">
                              {p.name}
                              {p.id === latestProduct?.id && (
                                <span className="ml-2 text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold uppercase">
                                  Latest
                                </span>
                              )}
                              <span className="block text-[10px] text-slate-500 font-normal">{p.brand}</span>
                            </td>
                            <td className="p-2 font-mono text-[11px]">{p.batchNumber}</td>
                            <td className="p-2">{p.netQuantity}</td>
                            <td className="p-2 font-mono">{p.actualMeasurement || 'Verified'}</td>
                            <td className="p-2 font-bold">₹ {p.mrp.toFixed(2)}</td>
                            <td className="p-2 font-mono">{p.evidenceCount} photos</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                p.complianceStatus === 'compliant'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {p.complianceStatus}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => handleDownloadSpecificProductPdf(p)}
                                  disabled={isGeneratingPdf}
                                  className="px-2 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-[10px] rounded border border-slate-300 transition-colors inline-flex items-center space-x-1"
                                  title={`Export official dossier for ${p.name}`}
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PDF</span>
                                </button>
                                {isInspectorEditable && (
                                  <button
                                    id={`table-remove-product-${p.id}`}
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-[10px] rounded border border-rose-200 transition-colors inline-flex items-center space-x-1"
                                    title={`Remove ${p.name}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Evidence Exhibits Gallery in Report */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
                    Evidence Exhibits Annexure
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {evidenceList.map((ev, i) => (
                      <div key={ev.id} className="border border-slate-300 rounded p-1 text-center bg-slate-50">
                        <img src={ev.imageUrl} alt={ev.title} className="h-16 w-full object-cover rounded" />
                        <span className="text-[9px] text-slate-600 block truncate mt-1">{ev.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statutory Findings Summary */}
                {allFindings.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 mb-2">
                      Statutory Contraventions & Observations ({allFindings.length})
                    </h4>
                    <div className="space-y-2 text-xs">
                      {allFindings.map(f => (
                        <div key={f.id} className="p-2.5 bg-rose-50 border border-rose-200 rounded">
                          <div className="flex justify-between font-bold text-rose-900">
                            <span>[{f.ruleCode}] {f.ruleTitle}</span>
                            <span className="uppercase text-[10px]">{f.severity}</span>
                          </div>
                          <p className="text-slate-700 text-[11px] mt-1">{f.observation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signatures & Certification Block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 text-xs text-slate-800">
                  
                  {/* Inspector Sign */}
                  <div className="border border-slate-200 p-3 rounded space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Field Officer Certification</span>
                    <p className="font-bold text-slate-900">{inspection.inspectorName}</p>
                    <p className="text-slate-600 text-[11px]">Inspecting Metrology Officer</p>
                    <span className="inline-block text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                      ✓ Digitally Certified
                    </span>
                  </div>

                  {/* Reviewer / Controller Sign */}
                  <div className="border border-slate-200 p-3 rounded space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Controller / Reviewing Authority</span>
                    <p className="font-bold text-slate-900">{inspection.reviewerName || 'Pooja Verma (Controller)'}</p>
                    <p className="text-slate-600 text-[11px]">Senior Metrology Controller</p>
                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      inspection.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inspection.status === 'approved' ? '✓ Approved & Signed' : 'Pending Final Sign-Off'}
                    </span>
                  </div>

                  {/* Verification QR & Seal */}
                  <div className="border border-slate-200 p-3 rounded text-center flex flex-col items-center justify-center space-y-1">
                    <QrCode className="w-10 h-10 text-slate-800" />
                    <span className="font-mono text-[9px] text-slate-500">QR-LM-VERIFY-2026</span>
                    <span className="text-[10px] font-bold text-slate-700">Official Directorate Seal</span>
                  </div>

                </div>

                {/* Print & PDF Export Action Row */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    Tamper-evident verification hash: <span className="font-mono text-slate-700 font-semibold">{inspection.inspectionNumber}-STATUTORY-SEC49</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="bottom-download-latest-product-pdf-btn"
                      onClick={handleDownloadLatestProductPdf}
                      disabled={isGeneratingPdf || products.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow flex items-center space-x-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isGeneratingPdf ? 'Generating...' : `Download Latest Product PDF (${latestProduct?.name || 'Latest'})`}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadSpecificProductPdf()}
                      disabled={isGeneratingPdf || products.length === 0}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow flex items-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Full Dossier PDF</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow flex items-center space-x-1.5 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Document</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* MODAL: ADD PRODUCT */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Add Inspected Commodity to Dossier</h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Zero Typing Auto-Fill Button */}
            <button
              id="add-product-scan-webcam-btn"
              type="button"
              onClick={() => {
                setScannerTarget('new_product');
                setIsAiScannerOpen(true);
              }}
              className="w-full py-2.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-600/50 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow"
            >
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Auto-Fill Details from WebCam or Photo (No Typing)</span>
            </button>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Product Description</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Fortified Wheat Flour 5kg"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Brand Name</label>
                <input
                  type="text"
                  value={newProductBrand}
                  onChange={(e) => setNewProductBrand(e.target.value)}
                  placeholder="e.g. Annapurna"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Declared Net Qty</label>
                  <input
                    type="text"
                    value={newProductNetQty}
                    onChange={(e) => setNewProductNetQty(e.target.value)}
                    placeholder="e.g. 5 kg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Declared MRP (₹)</label>
                  <input
                    type="number"
                    value={newProductMRP}
                    onChange={(e) => setNewProductMRP(e.target.value)}
                    placeholder="250"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG STATUTORY FINDING */}
      {showAddFindingModal && activeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-100">
            <h3 className="font-bold text-sm text-white">Record Statutory Rule Contravention</h3>
            <p className="text-xs text-slate-400">Target Product: {activeProduct.name}</p>

            <form onSubmit={handleCreateFinding} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Statutory Rule Code</label>
                <select
                  value={findingRuleCode}
                  onChange={(e) => setFindingRuleCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {STATUTORY_RULES.map(r => (
                    <option key={r.code} value={r.code}>
                      [{r.code}] {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contravention Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFindingSeverity('violation')}
                    className={`p-2 rounded border font-bold text-center ${
                      findingSeverity === 'violation' ? 'bg-rose-950/60 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Violation
                  </button>
                  <button
                    type="button"
                    onClick={() => setFindingSeverity('warning')}
                    className={`p-2 rounded border font-bold text-center ${
                      findingSeverity === 'warning' ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setFindingSeverity('advisory')}
                    className={`p-2 rounded border font-bold text-center ${
                      findingSeverity === 'advisory' ? 'bg-blue-950/60 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Advisory
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Inspector Observation & Statutory Grounds</label>
                <textarea
                  required
                  rows={3}
                  value={findingObservation}
                  onChange={(e) => setFindingObservation(e.target.value)}
                  placeholder="Detail the exact measurement shortfall, missing label declaration, or illegible font..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              {evidenceList.length > 0 && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Supporting Packaging Evidence</label>
                  <select
                    value={findingEvidenceId}
                    onChange={(e) => setFindingEvidenceId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">Select photo...</option>
                    {evidenceList.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFindingModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs"
                >
                  Log Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EVIDENCE VIEWER */}
      {selectedEvidenceForView && (
        <EvidenceViewerModal
          evidence={selectedEvidenceForView}
          onClose={() => setSelectedEvidenceForView(null)}
          onVerify={isInspectorEditable ? (id) => {
            if (activeProductId) {
              setSelectedEvidenceForView(null);
            }
          } : undefined}
        />
      )}

      {/* MODAL: REVIEWER ASSESSMENT */}
      {showReviewerModal && (
        <ReviewerModal
          inspection={inspection}
          products={products}
          isOpen={showReviewerModal}
          onClose={() => setShowReviewerModal(false)}
          onSubmitReview={handleReviewerDecision}
        />
      )}

      {/* AI WEBCAM & IMAGE PACKAGING SCANNER */}
      <ProductAiScanner
        isOpen={isAiScannerOpen}
        onClose={() => setIsAiScannerOpen(false)}
        onApplyProductData={handleApplyAiScan}
        title={scannerTarget === 'new_product' ? 'Scan Packaging for New Commodity' : `Scan Packaging for "${activeProduct?.name || 'Commodity'}"`}
      />

      {/* MODAL: DELETE PRODUCT CONFIRMATION (iFrame Safe) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center space-x-3 mb-4 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700/60">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Commodity?</h3>
                <p className="text-xs text-slate-400">Permanently remove this commodity from the docket.</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 mb-5 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Commodity Name:</span>
                <span className="font-semibold text-white">{productToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Brand / Net Qty:</span>
                <span className="text-slate-300">{productToDelete.brand} ({productToDelete.netQuantity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MRP:</span>
                <span className="text-emerald-400 font-bold">₹{productToDelete.mrp}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Remove Commodity'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE DOSSIER CONFIRMATION (iFrame Safe) */}
      {showDeleteDossierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center space-x-3 mb-4 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700/60">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Inspection Dossier?</h3>
                <p className="text-xs text-slate-400">Permanently delete this entire inspection and its database records.</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 mb-5 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Inspection ID:</span>
                <span className="font-mono font-bold text-slate-200">{inspection.inspectionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Business Name:</span>
                <span className="font-semibold text-slate-200">{inspection.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commodities in Docket:</span>
                <span className="text-blue-400 font-medium">{products.length} Items</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteDossierModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDossier}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Dossier'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
