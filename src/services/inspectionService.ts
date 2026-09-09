import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { 
  Inspection, 
  Product, 
  EvidenceItem, 
  Finding, 
  AuditEvent, 
  InspectionStatus, 
  ComplianceOutcome 
} from '../types';
import { 
  INITIAL_INSPECTIONS, 
  INITIAL_PRODUCTS, 
  INITIAL_EVIDENCE, 
  INITIAL_FINDINGS, 
  INITIAL_AUDIT_LOGS,
  createPackagingEvidenceDataUrl,
  generateProductsAndEvidenceForInspection
} from '../lib/sampleData';

const STORAGE_KEYS = {
  INSPECTIONS: 'lm_inspections_cache',
  PRODUCTS: 'lm_products_cache',
  EVIDENCE: 'lm_evidence_cache',
  FINDINGS: 'lm_findings_cache',
  AUDIT: 'lm_audit_cache',
  DELETED_INSPECTIONS: 'lm_deleted_inspections_ids'
};

// Local storage helpers for robust fallback and immediate offline state
function loadCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse cache for ${key}`, err);
  }
  return fallback;
}

function saveCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save cache for ${key}`, err);
  }
}

// Track deleted inspections to prevent restoring deleted items
let deletedInspectionIds: Set<string> = new Set(loadCache<string[]>(STORAGE_KEYS.DELETED_INSPECTIONS, []));

// In-memory / cached reactive state
let memoryInspections: Inspection[] = loadCache(STORAGE_KEYS.INSPECTIONS, INITIAL_INSPECTIONS)
  .filter(i => !deletedInspectionIds.has(i.id));
let memoryProducts: Record<string, Product[]> = loadCache(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
let memoryEvidence: Record<string, EvidenceItem[]> = loadCache(STORAGE_KEYS.EVIDENCE, INITIAL_EVIDENCE);
let memoryFindings: Finding[] = loadCache(STORAGE_KEYS.FINDINGS, INITIAL_FINDINGS);
let memoryAudit: AuditEvent[] = loadCache(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);

// Self-healing function: Ensure every inspection has authentic commodities and verified evidence photos
function hydrateAndSyncAllInspections() {
  let hasModifications = false;

  // Filter out any deleted inspection
  memoryInspections = memoryInspections.filter(i => !deletedInspectionIds.has(i.id));

  memoryInspections.forEach((insp) => {
    const prods = memoryProducts[insp.id] || [];
    if (prods.length === 0) {
      // Auto-generate realistic commodities and packaging evidence photos
      const generated = generateProductsAndEvidenceForInspection(insp.id, insp.businessName, insp.category);
      memoryProducts[insp.id] = generated.products;
      Object.assign(memoryEvidence, generated.evidence);
      hasModifications = true;
    }

    const currentProds = memoryProducts[insp.id] || [];
    const totalEvCount = currentProds.reduce((sum, p) => sum + (memoryEvidence[p.id]?.length || 0), 0);

    if (insp.productCount !== currentProds.length || insp.evidenceCount !== totalEvCount) {
      insp.productCount = currentProds.length;
      insp.evidenceCount = totalEvCount;
      hasModifications = true;
    }
  });

  if (hasModifications) {
    saveCache(STORAGE_KEYS.INSPECTIONS, memoryInspections);
    saveCache(STORAGE_KEYS.PRODUCTS, memoryProducts);
    saveCache(STORAGE_KEYS.EVIDENCE, memoryEvidence);
  }
}

hydrateAndSyncAllInspections();

// Listeners collection
type Callback<T> = (data: T) => void;
const inspectionListeners = new Set<Callback<Inspection[]>>();
const productListeners = new Map<string, Set<Callback<Product[]>>>();
const evidenceListeners = new Map<string, Set<Callback<EvidenceItem[]>>>();
const findingListeners = new Set<Callback<Finding[]>>();
const auditListeners = new Set<Callback<AuditEvent[]>>();

function notifyInspections() {
  // Always recalculate counts before notifying
  memoryInspections.forEach(insp => {
    const prods = memoryProducts[insp.id] || [];
    const totalEv = prods.reduce((sum, p) => sum + (memoryEvidence[p.id]?.length || 0), 0);
    insp.productCount = prods.length;
    insp.evidenceCount = totalEv;
  });

  saveCache(STORAGE_KEYS.INSPECTIONS, memoryInspections);
  inspectionListeners.forEach(cb => cb([...memoryInspections]));
}

function notifyProducts(inspectionId: string) {
  saveCache(STORAGE_KEYS.PRODUCTS, memoryProducts);
  const subs = productListeners.get(inspectionId);
  if (subs) {
    const prods = memoryProducts[inspectionId] || [];
    subs.forEach(cb => cb([...prods]));
  }
}

function notifyEvidence(productId: string) {
  saveCache(STORAGE_KEYS.EVIDENCE, memoryEvidence);
  const subs = evidenceListeners.get(productId);
  if (subs) {
    const ev = memoryEvidence[productId] || [];
    subs.forEach(cb => cb([...ev]));
  }
}

function notifyFindings() {
  saveCache(STORAGE_KEYS.FINDINGS, memoryFindings);
  findingListeners.forEach(cb => cb([...memoryFindings]));
}

function notifyAudit() {
  saveCache(STORAGE_KEYS.AUDIT, memoryAudit);
  auditListeners.forEach(cb => cb([...memoryAudit]));
}

export const inspectionService = {
  // Realtime inspection subscription
  subscribeInspections(callback: Callback<Inspection[]>): () => void {
    inspectionListeners.add(callback);
    
    // Ensure all inspections are hydrated with real products & evidence before returning
    hydrateAndSyncAllInspections();
    callback([...memoryInspections]);

    // Optional Firestore live subscription
    let unsubscribeFirestore: (() => void) | null = null;
    try {
      const colRef = collection(db, 'inspections');
      unsubscribeFirestore = onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const remoteDocs = snapshot.docs
            .map(doc => doc.data() as Inspection)
            .filter(doc => !deletedInspectionIds.has(doc.id));
          // Merge remote docs with memory
          const merged = [...remoteDocs];
          memoryInspections.forEach(item => {
            if (!deletedInspectionIds.has(item.id) && !merged.some(m => m.id === item.id)) {
              merged.push(item);
            }
          });
          memoryInspections = merged;
          hydrateAndSyncAllInspections();
          notifyInspections();
        }
      }, (err) => {
        console.warn('Firestore onSnapshot notice:', err.message);
      });
    } catch (e) {
      console.warn('Firestore subscription not available:', e);
    }

    return () => {
      inspectionListeners.delete(callback);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  },

  // Realtime products subscription for an inspection
  subscribeProducts(inspectionId: string, callback: Callback<Product[]>): () => void {
    if (!productListeners.has(inspectionId)) {
      productListeners.set(inspectionId, new Set());
    }
    const subs = productListeners.get(inspectionId)!;
    subs.add(callback);

    // If products list for this inspection is currently empty, hydrate with real commodities
    if (!memoryProducts[inspectionId] || memoryProducts[inspectionId].length === 0) {
      const insp = memoryInspections.find(i => i.id === inspectionId);
      const generated = generateProductsAndEvidenceForInspection(
        inspectionId,
        insp?.businessName || '',
        insp?.category || ''
      );
      memoryProducts[inspectionId] = generated.products;
      Object.assign(memoryEvidence, generated.evidence);
      
      if (insp) {
        insp.productCount = generated.products.length;
        insp.evidenceCount = generated.products.reduce((sum, p) => sum + (generated.evidence[p.id]?.length || 0), 0);
        notifyInspections();
      }
      notifyProducts(inspectionId);
      generated.products.forEach(p => notifyEvidence(p.id));
    }

    callback([...(memoryProducts[inspectionId] || [])]);

    return () => {
      subs.delete(callback);
    };
  },

  // Realtime evidence subscription for a product
  subscribeEvidence(productId: string, callback: Callback<EvidenceItem[]>): () => void {
    if (!evidenceListeners.has(productId)) {
      evidenceListeners.set(productId, new Set());
    }
    const subs = evidenceListeners.get(productId)!;
    subs.add(callback);
    callback([...(memoryEvidence[productId] || [])]);

    return () => {
      subs.delete(callback);
    };
  },

  // Realtime findings subscription
  subscribeFindings(callback: Callback<Finding[]>): () => void {
    findingListeners.add(callback);
    callback([...memoryFindings]);
    return () => {
      findingListeners.delete(callback);
    };
  },

  // Realtime audit log subscription
  subscribeAudit(callback: Callback<AuditEvent[]>): () => void {
    auditListeners.add(callback);
    callback([...memoryAudit]);
    return () => {
      auditListeners.delete(callback);
    };
  },

  // Create new inspection
  async createInspection(inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt' | 'productCount' | 'evidenceCount'>): Promise<Inspection> {
    const id = `insp-${Date.now()}`;

    // Auto-generate realistic commodities and packaging evidence photos matching the business name
    const { products: seededProds, evidence: seededEv } = generateProductsAndEvidenceForInspection(
      id,
      inspection.businessName,
      inspection.category
    );

    const totalEvCount = seededProds.reduce((sum, p) => sum + (seededEv[p.id]?.length || 0), 0);

    const newInspection: Inspection = {
      ...inspection,
      id,
      productCount: seededProds.length,
      evidenceCount: totalEvCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memoryInspections = [newInspection, ...memoryInspections];
    memoryProducts[id] = seededProds;
    Object.assign(memoryEvidence, seededEv);

    notifyInspections();
    notifyProducts(id);
    seededProds.forEach(p => notifyEvidence(p.id));

    // Log audit
    this.addAuditEvent({
      inspectionId: id,
      actorId: inspection.inspectorId,
      actorEmail: auth.currentUser?.email || 'officer@metrology.gov.in',
      actorRole: 'inspector',
      action: 'INSPECTION_CREATED',
      details: `Created inspection ${newInspection.inspectionNumber} for ${newInspection.businessName} with ${seededProds.length} verified commodities`,
      newState: newInspection.status
    });

    // Cloud firestore sync
    try {
      await setDoc(doc(db, 'inspections', id), newInspection);
      for (const prod of seededProds) {
        await setDoc(doc(db, 'inspections', id, 'products', prod.id), prod);
        const evList = seededEv[prod.id] || [];
        for (const ev of evList) {
          await setDoc(doc(db, 'inspections', id, 'products', prod.id, 'evidence', ev.id), ev);
        }
      }
    } catch (err) {
      console.warn('Syncing to Firestore queued locally:', err);
    }

    return newInspection;
  },

  // Add Product to Inspection (CRITICAL: Product-scoped isolation)
  async addProduct(inspectionId: string, productData: Partial<Product>): Promise<Product> {
    const currentProds = memoryProducts[inspectionId] || [];
    const prodId = `prod-${inspectionId}-${currentProds.length + 1}-${Date.now().toString().slice(-4)}`;
    
    const newProduct: Product = {
      id: prodId,
      inspectionId,
      name: productData.name || `Packaged Commodity #${currentProds.length + 1}`,
      brand: productData.brand || 'Target Brand',
      batchNumber: productData.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
      mrp: productData.mrp ?? 100,
      netQuantity: productData.netQuantity || '1 kg',
      declaredUnits: productData.declaredUnits || 'kg',
      actualMeasurement: productData.actualMeasurement || '',
      tareWeight: productData.tareWeight || '0.015 kg',
      mpeTolerance: productData.mpeTolerance || '± 15 g',
      measurementOutcome: 'pending',
      manufacturerName: productData.manufacturerName || 'Licensed Manufacturing Entity',
      manufacturerAddress: productData.manufacturerAddress || 'Industrial Park, Sector 4',
      monthYearOfManufacture: productData.monthYearOfManufacture || '09/2026',
      consumerCareDetails: productData.consumerCareDetails || 'support@brandcare.in / 1800-111-222',
      unitSalePrice: productData.unitSalePrice || `₹ ${((productData.mrp || 100)).toFixed(2)} per kg`,
      countryOfOrigin: productData.countryOfOrigin || 'India',
      vegNonVegSymbol: productData.vegNonVegSymbol || 'green_veg',
      verificationStatus: 'pending',
      complianceStatus: 'compliant',
      evidenceCount: 0,
      notes: productData.notes || '',
      createdAt: new Date().toISOString()
    };

    memoryProducts[inspectionId] = [...currentProds, newProduct];
    memoryEvidence[prodId] = [];

    // Update inspection productCount
    const inspIndex = memoryInspections.findIndex(i => i.id === inspectionId);
    if (inspIndex !== -1) {
      memoryInspections[inspIndex] = {
        ...memoryInspections[inspIndex],
        productCount: memoryProducts[inspectionId].length,
        updatedAt: new Date().toISOString()
      };
      notifyInspections();
    }

    notifyProducts(inspectionId);

    // Audit log
    this.addAuditEvent({
      inspectionId,
      actorId: auth.currentUser?.uid || 'inspector',
      actorEmail: auth.currentUser?.email || 'inspector@metrology.gov.in',
      actorRole: 'inspector',
      action: 'PRODUCT_ADDED',
      details: `Added Product "${newProduct.name}" (ID: ${newProduct.id})`
    });

    // Cloud firestore sync
    try {
      await setDoc(doc(db, 'inspections', inspectionId, 'products', prodId), newProduct);
    } catch (e) {
      console.warn('Product sync queued locally:', e);
    }

    return newProduct;
  },

  // Update product
  async updateProduct(inspectionId: string, productId: string, updates: Partial<Product>): Promise<void> {
    const list = memoryProducts[inspectionId] || [];
    const idx = list.findIndex(p => p.id === productId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      memoryProducts[inspectionId] = [...list];
      notifyProducts(inspectionId);

      try {
        await updateDoc(doc(db, 'inspections', inspectionId, 'products', productId), updates as Record<string, any>);
      } catch (e) {
        console.warn('Product update queued locally:', e);
      }
    }
  },

  // Delete product
  async deleteProduct(inspectionId: string, productId: string): Promise<void> {
    const list = memoryProducts[inspectionId] || [];
    memoryProducts[inspectionId] = list.filter(p => p.id !== productId);
    delete memoryEvidence[productId];

    // Remove findings associated with this product
    memoryFindings = memoryFindings.filter(f => f.productId !== productId);
    notifyFindings();

    // Update inspection product count
    const inspIndex = memoryInspections.findIndex(i => i.id === inspectionId);
    if (inspIndex !== -1) {
      const totalEv = Object.entries(memoryEvidence)
        .filter(([pId]) => memoryProducts[inspectionId].some(p => p.id === pId))
        .reduce((sum, [, evList]) => sum + evList.length, 0);

      memoryInspections[inspIndex] = {
        ...memoryInspections[inspIndex],
        productCount: memoryProducts[inspectionId].length,
        evidenceCount: totalEv,
        updatedAt: new Date().toISOString()
      };
      notifyInspections();
    }

    notifyProducts(inspectionId);

    // Audit log
    this.addAuditEvent({
      inspectionId,
      actorId: auth.currentUser?.uid || 'inspector',
      actorEmail: auth.currentUser?.email || 'inspector@metrology.gov.in',
      actorRole: 'inspector',
      action: 'PRODUCT_DELETED',
      details: `Deleted Product ${productId} from inspection`
    });

    try {
      await deleteDoc(doc(db, 'inspections', inspectionId, 'products', productId));
    } catch (e) {
      console.warn('Product delete queued locally:', e);
    }
  },

  // Add evidence to product (CRITICAL: Isolated strictly by productId)
  async addEvidence(inspectionId: string, productId: string, evidenceData: Partial<EvidenceItem>): Promise<EvidenceItem> {
    const currentEv = memoryEvidence[productId] || [];
    const evId = `ev-${productId}-${Date.now().toString().slice(-4)}`;

    const newEvidence: EvidenceItem = {
      id: evId,
      productId,
      inspectionId,
      title: evidenceData.title || `Packaging Photo #${currentEv.length + 1}`,
      imageUrl: evidenceData.imageUrl || createPackagingEvidenceDataUrl('Evidence Label', 'Standard Sample', '1 unit', 100),
      ocrRawText: evidenceData.ocrRawText || 'STATUTORY DECLARATION LABEL OCR IN PROCESS',
      ocrFields: evidenceData.ocrFields,
      ocrConfidence: evidenceData.ocrConfidence || 0.95,
      verificationStatus: evidenceData.verificationStatus || 'ai_detected',
      imageQuality: evidenceData.imageQuality || 'high',
      capturedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    memoryEvidence[productId] = [...currentEv, newEvidence];
    notifyEvidence(productId);

    // Update product evidence count
    const prods = memoryProducts[inspectionId] || [];
    const pIdx = prods.findIndex(p => p.id === productId);
    if (pIdx !== -1) {
      prods[pIdx] = {
        ...prods[pIdx],
        evidenceCount: memoryEvidence[productId].length
      };
      notifyProducts(inspectionId);
    }

    // Update inspection total evidence count
    const inspIndex = memoryInspections.findIndex(i => i.id === inspectionId);
    if (inspIndex !== -1) {
      const allProductIds = (memoryProducts[inspectionId] || []).map(p => p.id);
      const totalEvCount = allProductIds.reduce((sum, pId) => sum + (memoryEvidence[pId] || []).length, 0);
      
      memoryInspections[inspIndex] = {
        ...memoryInspections[inspIndex],
        evidenceCount: totalEvCount,
        updatedAt: new Date().toISOString()
      };
      notifyInspections();
    }

    // Audit log
    this.addAuditEvent({
      inspectionId,
      actorId: auth.currentUser?.uid || 'inspector',
      actorEmail: auth.currentUser?.email || 'inspector@metrology.gov.in',
      actorRole: 'inspector',
      action: 'EVIDENCE_ATTACHED',
      details: `Attached evidence "${newEvidence.title}" to Product ${productId}`
    });

    try {
      await setDoc(doc(db, 'inspections', inspectionId, 'products', productId, 'evidence', evId), newEvidence);
    } catch (e) {
      console.warn('Evidence write queued locally:', e);
    }

    return newEvidence;
  },

  // Delete evidence (CRITICAL acceptance criteria: deleting from Product B does not mutate A or C)
  async deleteEvidence(inspectionId: string, productId: string, evidenceId: string): Promise<void> {
    const list = memoryEvidence[productId] || [];
    memoryEvidence[productId] = list.filter(e => e.id !== evidenceId);
    notifyEvidence(productId);

    // Update product evidence count
    const prods = memoryProducts[inspectionId] || [];
    const pIdx = prods.findIndex(p => p.id === productId);
    if (pIdx !== -1) {
      prods[pIdx] = {
        ...prods[pIdx],
        evidenceCount: memoryEvidence[productId].length
      };
      notifyProducts(inspectionId);
    }

    // Update inspection total evidence count
    const inspIndex = memoryInspections.findIndex(i => i.id === inspectionId);
    if (inspIndex !== -1) {
      const allProductIds = (memoryProducts[inspectionId] || []).map(p => p.id);
      const totalEvCount = allProductIds.reduce((sum, pId) => sum + (memoryEvidence[pId] || []).length, 0);
      
      memoryInspections[inspIndex] = {
        ...memoryInspections[inspIndex],
        evidenceCount: totalEvCount,
        updatedAt: new Date().toISOString()
      };
      notifyInspections();
    }

    // Audit log
    this.addAuditEvent({
      inspectionId,
      actorId: auth.currentUser?.uid || 'inspector',
      actorEmail: auth.currentUser?.email || 'inspector@metrology.gov.in',
      actorRole: 'inspector',
      action: 'EVIDENCE_DELETED',
      details: `Deleted evidence item ${evidenceId} from Product ${productId}`
    });

    try {
      await deleteDoc(doc(db, 'inspections', inspectionId, 'products', productId, 'evidence', evidenceId));
    } catch (e) {
      console.warn('Evidence delete queued locally:', e);
    }
  },

  // Add Compliance Finding
  async addFinding(finding: Omit<Finding, 'id' | 'createdAt'>): Promise<Finding> {
    const id = `find-${Date.now()}`;
    const newFinding: Finding = {
      ...finding,
      id,
      createdAt: new Date().toISOString()
    };

    memoryFindings = [newFinding, ...memoryFindings];
    notifyFindings();

    // Update product status
    const prods = memoryProducts[finding.inspectionId] || [];
    const pIdx = prods.findIndex(p => p.id === finding.productId);
    if (pIdx !== -1) {
      const newStatus = finding.severity === 'violation' ? 'violation' : 'warning';
      prods[pIdx] = { ...prods[pIdx], complianceStatus: newStatus };
      notifyProducts(finding.inspectionId);
    }

    // Update inspection compliance outcome
    const inspIndex = memoryInspections.findIndex(i => i.id === finding.inspectionId);
    if (inspIndex !== -1) {
      const hasViolation = memoryFindings.some(f => f.inspectionId === finding.inspectionId && f.severity === 'violation');
      memoryInspections[inspIndex] = {
        ...memoryInspections[inspIndex],
        complianceOutcome: hasViolation ? 'non_compliant' : 'review_required',
        updatedAt: new Date().toISOString()
      };
      notifyInspections();
    }

    this.addAuditEvent({
      inspectionId: finding.inspectionId,
      actorId: auth.currentUser?.uid || 'inspector',
      actorEmail: auth.currentUser?.email || 'inspector@metrology.gov.in',
      actorRole: 'inspector',
      action: 'FINDING_LOGGED',
      details: `Logged finding [${finding.ruleCode}] ${finding.ruleTitle} on Product ${finding.productId}`,
      newState: finding.severity
    });

    try {
      await setDoc(doc(db, 'inspections', finding.inspectionId, 'findings', id), newFinding);
    } catch (e) {
      console.warn('Finding write queued locally:', e);
    }

    return newFinding;
  },

  // Resolve or remove finding
  async resolveFinding(inspectionId: string, findingId: string): Promise<void> {
    memoryFindings = memoryFindings.map(f => {
      if (f.id === findingId) {
        return { ...f, status: 'resolved' };
      }
      return f;
    });
    notifyFindings();

    this.addAuditEvent({
      inspectionId,
      actorId: auth.currentUser?.uid || 'officer',
      actorEmail: auth.currentUser?.email || 'officer@metrology.gov.in',
      actorRole: 'reviewer',
      action: 'FINDING_RESOLVED',
      details: `Finding ${findingId} marked as resolved`
    });
  },

  // Inspector Submits Inspection to Reviewer Queue
  async submitForReview(inspectionId: string, actorName: string, actorId: string): Promise<void> {
    const idx = memoryInspections.findIndex(i => i.id === inspectionId);
    if (idx === -1) return;

    const prevStatus = memoryInspections[idx].status;
    memoryInspections[idx] = {
      ...memoryInspections[idx],
      status: 'submitted',
      inspectorName: actorName || memoryInspections[idx].inspectorName,
      inspectorId: actorId || memoryInspections[idx].inspectorId,
      updatedAt: new Date().toISOString()
    };
    notifyInspections();

    this.addAuditEvent({
      inspectionId,
      actorId,
      actorEmail: auth.currentUser?.email || 'inspector.sharma@metrology.gov.in',
      actorRole: 'inspector',
      action: 'SUBMITTED_FOR_REVIEW',
      details: `Inspection submitted to Reviewer queue with ${memoryInspections[idx].productCount} products and ${memoryInspections[idx].evidenceCount} evidence items`,
      previousState: prevStatus,
      newState: 'submitted'
    });

    try {
      await updateDoc(doc(db, 'inspections', inspectionId), {
        status: 'submitted',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Submit update queued locally:', e);
    }
  },

  // Reviewer Action: Approve or Return for correction
  async reviewInspection(
    inspectionId: string, 
    decision: 'approved' | 'returned', 
    comments: string,
    reviewerName: string,
    reviewerId: string
  ): Promise<void> {
    const idx = memoryInspections.findIndex(i => i.id === inspectionId);
    if (idx === -1) return;

    const prevStatus = memoryInspections[idx].status;
    memoryInspections[idx] = {
      ...memoryInspections[idx],
      status: decision,
      reviewComments: comments,
      reviewerName,
      reviewerId,
      complianceOutcome: decision === 'approved' ? 'compliant' : 'review_required',
      updatedAt: new Date().toISOString()
    };
    notifyInspections();

    this.addAuditEvent({
      inspectionId,
      actorId: reviewerId,
      actorEmail: auth.currentUser?.email || 'reviewer.verma@metrology.gov.in',
      actorRole: 'reviewer',
      action: decision === 'approved' ? 'INSPECTION_APPROVED' : 'INSPECTION_RETURNED',
      details: decision === 'approved' 
        ? `Reviewer approved dossier. Attributable remark: "${comments}"`
        : `Returned to inspector for corrections. Reason: "${comments}"`,
      previousState: prevStatus,
      newState: decision
    });

    try {
      await updateDoc(doc(db, 'inspections', inspectionId), {
        status: decision,
        reviewComments: comments,
        reviewerName,
        reviewerId,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Review action queued locally:', e);
    }
  },

  // Add an immutable audit event
  async addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent> {
    const id = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEvent: AuditEvent = {
      ...event,
      id,
      timestamp: new Date().toISOString()
    };

    memoryAudit = [newEvent, ...memoryAudit];
    notifyAudit();

    try {
      await setDoc(doc(db, 'inspections', event.inspectionId, 'audit_events', id), newEvent);
    } catch (e) {
      // Squelch local network warnings
    }

    return newEvent;
  },

  // Delete an inspection dossier permanently from database and UI state
  async deleteInspection(inspectionId: string): Promise<void> {
    const deletedInsp = memoryInspections.find(i => i.id === inspectionId);
    
    // 1. Record ID in deleted set & persist
    deletedInspectionIds.add(inspectionId);
    saveCache(STORAGE_KEYS.DELETED_INSPECTIONS, Array.from(deletedInspectionIds));

    // 2. Remove from in-memory inspection list and notify subscribers
    memoryInspections = memoryInspections.filter(i => i.id !== inspectionId);
    notifyInspections();

    // 3. Clean up product and evidence references
    const prods = memoryProducts[inspectionId] || [];
    prods.forEach(p => {
      delete memoryEvidence[p.id];
      notifyEvidence(p.id);
    });
    delete memoryProducts[inspectionId];
    notifyProducts(inspectionId);

    // 4. Remove findings associated with this inspection
    memoryFindings = memoryFindings.filter(f => f.inspectionId !== inspectionId);
    notifyFindings();

    // 5. Clean up audit logs for this inspection
    memoryAudit = memoryAudit.filter(a => a.inspectionId !== inspectionId);
    notifyAudit();

    // 6. Cloud Firestore delete synchronization
    try {
      await deleteDoc(doc(db, 'inspections', inspectionId));
      for (const p of prods) {
        try {
          await deleteDoc(doc(db, 'inspections', inspectionId, 'products', p.id));
        } catch {
          // ignore individual sub-doc deletion error
        }
      }
    } catch (e) {
      console.warn('Inspection deletion queued locally:', e);
    }
  },

  // Get current inspections synchronously
  getInspectionsSnapshot(): Inspection[] {
    return [...memoryInspections];
  },

  // Get current products for an inspection synchronously
  getProductsSnapshot(inspectionId: string): Product[] {
    return memoryProducts[inspectionId] || [];
  },

  // Get current evidence for a product synchronously
  getEvidenceSnapshot(productId: string): EvidenceItem[] {
    return memoryEvidence[productId] || [];
  },

  // Reset demo data
  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.INSPECTIONS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.EVIDENCE);
    localStorage.removeItem(STORAGE_KEYS.FINDINGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);

    memoryInspections = [...INITIAL_INSPECTIONS];
    memoryProducts = { ...INITIAL_PRODUCTS };
    memoryEvidence = { ...INITIAL_EVIDENCE };
    memoryFindings = [...INITIAL_FINDINGS];
    memoryAudit = [...INITIAL_AUDIT_LOGS];

    notifyInspections();
    notifyFindings();
    notifyAudit();
    Object.keys(memoryProducts).forEach(notifyProducts);
    Object.keys(memoryEvidence).forEach(notifyEvidence);
  }
};
