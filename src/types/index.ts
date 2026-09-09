export type UserRole = 'inspector' | 'reviewer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  jurisdiction?: string;
  badgeNumber?: string;
  photoURL?: string;
  createdAt: string;
}

export type InspectionStatus = 
  | 'draft' 
  | 'in_progress' 
  | 'ready_to_submit' 
  | 'submitted' 
  | 'returned' 
  | 'approved' 
  | 'non_compliant';

export type ComplianceOutcome = 'compliant' | 'review_required' | 'non_compliant' | 'pending';

export interface Inspection {
  id: string;
  inspectionNumber: string;
  businessName: string;
  businessAddress: string;
  licenseNumber: string;
  category: string;
  status: InspectionStatus;
  inspectorId: string;
  inspectorName: string;
  reviewerId?: string;
  reviewerName?: string;
  complianceOutcome: ComplianceOutcome;
  reviewComments?: string;
  productCount: number;
  evidenceCount: number;
  scheduledDate: string;
  jurisdiction: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  inspectionId: string;
  name: string;
  brand: string;
  batchNumber: string;
  mrp: number;
  netQuantity: string;
  declaredUnits: string;
  actualMeasurement?: string;
  tareWeight?: string;
  mpeTolerance?: string; // Maximum Permissible Error
  measurementOutcome?: 'within_tolerance' | 'short_weight' | 'excess' | 'pending';
  manufacturerName: string;
  manufacturerAddress: string;
  monthYearOfManufacture: string;
  consumerCareDetails: string;
  unitSalePrice?: string;
  countryOfOrigin?: string;
  vegNonVegSymbol?: 'green_veg' | 'brown_nonveg' | 'not_applicable';
  verificationStatus: 'pending' | 'verified' | 'flagged';
  complianceStatus: 'compliant' | 'warning' | 'violation';
  evidenceCount: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EvidenceItem {
  id: string;
  productId: string;
  inspectionId: string;
  title: string;
  imageUrl: string;
  ocrRawText?: string;
  ocrFields?: {
    mrp?: string;
    netQuantity?: string;
    mfgDate?: string;
    consumerCare?: string;
    unitSalePrice?: string;
    manufacturer?: string;
  };
  ocrConfidence?: number;
  verificationStatus: 'ai_detected' | 'inspector_verified' | 'inspector_edited' | 'rejected';
  imageQuality: 'high' | 'acceptable' | 'poor';
  fileSize?: number;
  capturedAt: string;
  createdAt: string;
}

export interface Finding {
  id: string;
  inspectionId: string;
  productId: string;
  productName?: string;
  ruleCode: string;
  ruleTitle: string;
  ruleDescription: string;
  severity: 'violation' | 'warning' | 'advisory';
  status: 'open' | 'resolved' | 'accepted';
  observation: string;
  evidenceId?: string;
  evidenceTitle?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  inspectionId: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole | 'system';
  action: string;
  details: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
}

export interface LegalMetrologyRule {
  code: string;
  title: string;
  actSection: string;
  category: string;
  description: string;
  mandatoryFields: string[];
  guidelines: string;
}
