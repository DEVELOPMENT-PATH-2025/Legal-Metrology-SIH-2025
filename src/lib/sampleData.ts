import { Inspection, Product, EvidenceItem, Finding, LegalMetrologyRule, AuditEvent } from '../types';

export const STATUTORY_RULES: LegalMetrologyRule[] = [
  {
    code: 'LM-PCR-R6-NAME',
    title: 'Manufacturer / Packer Identification',
    actSection: 'Rule 6(1)(a) Legal Metrology (Packaged Commodities) Rules 2011',
    category: 'Mandatory Declarations',
    description: 'Every package shall bear the name and complete physical address of the manufacturer, packer or importer.',
    mandatoryFields: ['manufacturerName', 'manufacturerAddress'],
    guidelines: 'Incomplete addresses such as only city name or PO Box without premises number constitute a statutory violation.'
  },
  {
    code: 'LM-PCR-R6-NETQTY',
    title: 'Net Quantity in Standard Units',
    actSection: 'Rule 6(1)(b) & Rule 9 Legal Metrology (PC) Rules 2011',
    category: 'Metrological Accuracy',
    description: 'Declaration of net quantity in standard units of mass or measure (g, kg, ml, l) with certified tolerance.',
    mandatoryFields: ['netQuantity', 'declaredUnits'],
    guidelines: 'Weight must be within Maximum Permissible Error (MPE) specified under Second Schedule.'
  },
  {
    code: 'LM-PCR-R6-MRP',
    title: 'Maximum Retail Price (MRP) Inclusive of All Taxes',
    actSection: 'Rule 6(1)(d) Legal Metrology (PC) Rules 2011',
    category: 'Price Transparency',
    description: 'The retail sale price shall be clearly marked as "Maximum or Max. Retail Price ... inclusive of all taxes" or "MRP Rs ... incl. of all taxes".',
    mandatoryFields: ['mrp'],
    guidelines: 'No dual pricing or sticker alteration over printed MRP is permitted under Rule 18.'
  },
  {
    code: 'LM-PCR-R6-MFG',
    title: 'Month & Year of Manufacture / Packing',
    actSection: 'Rule 6(1)(c) Legal Metrology (PC) Rules 2011',
    category: 'Mandatory Declarations',
    description: 'The month and year in which the commodity is manufactured or packed must be prominently stated in MM/YYYY format.',
    mandatoryFields: ['monthYearOfManufacture'],
    guidelines: 'Abbreviations of month must be standard and legible.'
  },
  {
    code: 'LM-PCR-R6-USP',
    title: 'Unit Sale Price (USP) Declaration',
    actSection: 'Rule 6(1)(f) Legal Metrology (PC) Amendment 2021',
    category: 'Consumer Information',
    description: 'Unit sale price must be declared in Rupees per g, kg, ml, l or number for packages containing more than 1 unit.',
    mandatoryFields: ['unitSalePrice'],
    guidelines: 'USP facilitates price comparison across different pack sizes.'
  },
  {
    code: 'LM-PCR-R6-CARE',
    title: 'Consumer Care Redressal Details',
    actSection: 'Rule 6(1)(e) Legal Metrology (PC) Rules 2011',
    category: 'Consumer Protection',
    description: 'Name, address, working telephone number and active email of the person or office to be contacted in case of consumer complaint.',
    mandatoryFields: ['consumerCareDetails'],
    guidelines: 'Both valid phone and email address are strictly mandatory.'
  },
  {
    code: 'LM-PCR-R24-UNITS',
    title: 'Standard Units & Symbols Prohibition',
    actSection: 'Rule 24 & Fifth Schedule Legal Metrology Rules',
    category: 'Standardization',
    description: 'Only approved international unit symbols shall be used. Words like "gms", "kilos", "ltrs", "mlt" are strictly prohibited.',
    mandatoryFields: ['declaredUnits'],
    guidelines: 'Approved symbols: g for gram, kg for kilogram, ml for milliliter, l for liter.'
  }
];

// Helper to generate SVG evidence illustrations
export function createPackagingEvidenceDataUrl(
  title: string, 
  brand: string, 
  netQty: string, 
  mrp: number, 
  defectText?: string,
  extraDetails?: {
    batch?: string;
    mfgDate?: string;
    mfgName?: string;
    mfgAddress?: string;
    consumerCare?: string;
    usp?: string;
    tare?: string;
    gross?: string;
    scaleCert?: string;
    barcode?: string;
    categoryBadge?: string;
  }
): string {
  const batch = extraDetails?.batch || 'B-2026-AUG-991';
  const mfgDate = extraDetails?.mfgDate || '08/2026';
  const mfgName = extraDetails?.mfgName || `${brand} Manufacturing Ltd`;
  const mfgAddress = extraDetails?.mfgAddress || 'Plot 42, Industrial Area, Sector 18, NCR';
  const consumerCare = extraDetails?.consumerCare || `1800-419-8080 / care@${brand.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`;
  const usp = extraDetails?.usp || (mrp > 0 ? `₹ ${(mrp / 1).toFixed(2)} / unit` : '');
  const gross = extraDetails?.gross;
  const tare = extraDetails?.tare;
  const scaleCert = extraDetails?.scaleCert || 'NABL/LM/CAL-2026-8812';
  const categoryBadge = extraDetails?.categoryBadge || 'OFFICIAL EVIDENCE';

  const isScale = title.toLowerCase().includes('scale') || title.toLowerCase().includes('weight') || title.toLowerCase().includes('measurement') || title.toLowerCase().includes('cylinder');

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <linearGradient id="scaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="600" height="420" fill="#0b0f19" rx="10"/>
    <rect x="12" y="12" width="576" height="396" fill="url(#cardGrad)" rx="8" stroke="#cbd5e1" stroke-width="2"/>
    
    <!-- Top Header Ribbon -->
    <rect x="12" y="12" width="576" height="52" fill="url(#headerGrad)" rx="8"/>
    <rect x="12" y="54" width="576" height="10" fill="#1e293b"/>
    <text x="32" y="44" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" letter-spacing="0.5">LEGAL METROLOGY CERTIFIED EVIDENCE</text>
    <rect x="420" y="26" width="150" height="24" rx="12" fill="#2563eb"/>
    <text x="495" y="42" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="700">${categoryBadge}</text>

    <!-- Inspection Target Identification -->
    <text x="32" y="90" fill="#0f172a" font-family="system-ui, sans-serif" font-size="19" font-weight="800">${brand.toUpperCase()}</text>
    <text x="32" y="112" fill="#475569" font-family="system-ui, sans-serif" font-size="13" font-weight="600">Sample Subject: ${title}</text>

    ${isScale ? `
    <!-- Digital Precision Scale Readout Screen -->
    <rect x="32" y="128" width="536" height="210" fill="url(#scaleGrad)" rx="8" stroke="#334155" stroke-width="2"/>
    <rect x="52" y="148" width="496" height="60" fill="#022c22" rx="6" stroke="#059669" stroke-width="1.5"/>
    <text x="72" y="188" fill="#34d399" font-family="Courier New, monospace" font-size="28" font-weight="900" letter-spacing="2">${netQty}</text>
    <text x="520" y="185" text-anchor="end" fill="#6ee7b7" font-family="system-ui, sans-serif" font-size="12" font-weight="700">CLASS III CERTIFIED</text>
    
    <text x="52" y="235" fill="#94a3b8" font-family="monospace" font-size="12">• GROSS WEIGHT: ${gross || netQty}</text>
    <text x="52" y="258" fill="#94a3b8" font-family="monospace" font-size="12">• TARE WEIGHT: ${tare || '0.015 kg'} (Container / Pouch Sealed)</text>
    <text x="52" y="281" fill="#94a3b8" font-family="monospace" font-size="12">• BALANCE CALIBRATION CERTIFICATE: ${scaleCert}</text>
    <text x="52" y="304" fill="#38bdf8" font-family="monospace" font-size="11">✓ VERIFIED BY LEGAL METROLOGY OFFICER ON WORKING STANDARD</text>
    ` : `
    <!-- Packaging Declarations Panel View -->
    <rect x="32" y="128" width="536" height="210" fill="#ffffff" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect x="32" y="128" width="536" height="32" fill="#f1f5f9" rx="8"/>
    <rect x="32" y="150" width="536" height="10" fill="#f1f5f9"/>
    <text x="48" y="150" fill="#0f172a" font-family="system-ui, sans-serif" font-size="12" font-weight="700">MANDATORY RULE 6 STATUTORY DECLARATIONS PANEL:</text>
    
    <text x="48" y="184" fill="#1e293b" font-family="Courier New, monospace" font-size="13" font-weight="700">• NET QUANTITY: ${netQty}</text>
    <text x="48" y="206" fill="#1e293b" font-family="Courier New, monospace" font-size="13" font-weight="700">• MAX. RETAIL PRICE: ₹ ${mrp.toFixed(2)} (INCLUSIVE OF ALL TAXES)</text>
    ${usp ? `<text x="48" y="228" fill="#334155" font-family="Courier New, monospace" font-size="12">• UNIT SALE PRICE: ${usp}</text>` : ''}
    <text x="48" y="250" fill="#334155" font-family="Courier New, monospace" font-size="12">• BATCH NO: ${batch}  |  MFG DATE: ${mfgDate}</text>
    <text x="48" y="272" fill="#475569" font-family="Courier New, monospace" font-size="11">• MFD BY: ${mfgName}, ${mfgAddress}</text>
    <text x="48" y="294" fill="#475569" font-family="Courier New, monospace" font-size="11">• CONSUMER HELPLINE: ${consumerCare}</text>

    <!-- Simulated Barcode -->
    <g transform="translate(430, 175)">
      <rect x="0" y="0" width="3" height="42" fill="#000"/>
      <rect x="5" y="0" width="2" height="42" fill="#000"/>
      <rect x="10" y="0" width="4" height="42" fill="#000"/>
      <rect x="17" y="0" width="1" height="42" fill="#000"/>
      <rect x="21" y="0" width="3" height="42" fill="#000"/>
      <rect x="27" y="0" width="2" height="42" fill="#000"/>
      <rect x="32" y="0" width="5" height="42" fill="#000"/>
      <rect x="40" y="0" width="2" height="42" fill="#000"/>
      <rect x="45" y="0" width="4" height="42" fill="#000"/>
      <rect x="52" y="0" width="1" height="42" fill="#000"/>
      <rect x="56" y="0" width="3" height="42" fill="#000"/>
      <rect x="62" y="0" width="2" height="42" fill="#000"/>
      <rect x="67" y="0" width="4" height="42" fill="#000"/>
      <text x="35" y="54" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="9">8901030${Math.floor(100000 + Math.random() * 900000)}</text>
    </g>
    `}

    ${defectText ? `
    <!-- Defect Ribbon -->
    <rect x="32" y="348" width="536" height="44" fill="#fee2e2" rx="6" stroke="#ef4444" stroke-width="1.5"/>
    <text x="48" y="375" fill="#991b1b" font-family="system-ui, sans-serif" font-size="13" font-weight="700">⚠️ STATUTORY NON-COMPLIANCE: ${defectText}</text>
    ` : `
    <!-- Verified Tag Ribbon -->
    <rect x="32" y="348" width="536" height="44" fill="#ecfdf5" rx="6" stroke="#10b981" stroke-width="1.5"/>
    <text x="48" y="375" fill="#065f46" font-family="system-ui, sans-serif" font-size="13" font-weight="700">✓ EVIDENCE VERIFIED: Display Panel & Net Content Validated per Legal Metrology Rules</text>
    `}
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_INSPECTIONS: Inspection[] = [
  {
    id: 'insp-2026-0814',
    inspectionNumber: 'LM-NZ-2026-00814',
    businessName: 'Apex Hypermarket & Logistics Hub Pvt Ltd',
    businessAddress: 'Plot 104, Ring Road Commercial Complex, Sector 18, North District',
    licenseNumber: 'LM/DL/NCR/2024/7821',
    category: 'Pre-Packaged Food & Staples',
    status: 'in_progress',
    inspectorId: 'demo_inspector_001',
    inspectorName: 'Rajesh Sharma',
    reviewerId: 'demo_reviewer_002',
    reviewerName: 'Pooja Verma (Controller)',
    complianceOutcome: 'review_required',
    productCount: 3,
    evidenceCount: 9,
    scheduledDate: '2026-09-08',
    jurisdiction: 'Zone 4 - North Metrology Division',
    createdAt: '2026-09-08T09:30:00.000Z',
    updatedAt: '2026-09-09T11:45:00.000Z'
  },
  {
    id: 'insp-2026-0812',
    inspectionNumber: 'LM-SZ-2026-00812',
    businessName: 'Reliance Fresh Supermarket Ltd',
    businessAddress: 'Metro Mall, Level 1, MG Avenue, Central Ward',
    licenseNumber: 'LM/DL/NCR/2023/1109',
    category: 'Packaged Commodities',
    status: 'submitted',
    inspectorId: 'demo_inspector_001',
    inspectorName: 'Rajesh Sharma',
    reviewerId: 'demo_reviewer_002',
    reviewerName: 'Pooja Verma (Controller)',
    complianceOutcome: 'compliant',
    reviewComments: 'Dossier complete. Primary display panels and volumetric readouts verified.',
    productCount: 2,
    evidenceCount: 5,
    scheduledDate: '2026-09-07',
    jurisdiction: 'Zone 4 - North Metrology Division',
    createdAt: '2026-09-07T10:15:00.000Z',
    updatedAt: '2026-09-08T16:20:00.000Z'
  },
  {
    id: 'insp-2026-0790',
    inspectionNumber: 'LM-HQ-2026-00790',
    businessName: 'Modern Wholesale Distributors',
    businessAddress: 'Grain Mandi Godown No. 14, Outer Ring Depot',
    licenseNumber: 'LM/DL/NCR/2022/4531',
    category: 'Wholesale Commodities & Grains',
    status: 'approved',
    inspectorId: 'demo_inspector_001',
    inspectorName: 'Rajesh Sharma',
    reviewerId: 'demo_reviewer_002',
    reviewerName: 'Pooja Verma (Controller)',
    complianceOutcome: 'compliant',
    reviewComments: 'Dossier inspected and verified against certified standard check-weights. Approved without exception.',
    productCount: 2,
    evidenceCount: 6,
    scheduledDate: '2026-09-02',
    jurisdiction: 'State HQ Metrology Directorate',
    createdAt: '2026-09-02T08:00:00.000Z',
    updatedAt: '2026-09-03T14:30:00.000Z'
  }
];

export const INITIAL_PRODUCTS: Record<string, Product[]> = {
  'insp-2026-0814': [
    {
      id: 'prod-0814-1',
      inspectionId: 'insp-2026-0814',
      name: 'Shakuntalam Chakki Fresh Whole Wheat Atta',
      brand: 'Shakuntalam Gold',
      batchNumber: 'BATCH-AUG26-A12',
      mrp: 275.00,
      netQuantity: '5 kg',
      declaredUnits: 'kg',
      actualMeasurement: '4.985 kg',
      tareWeight: '0.035 kg',
      mpeTolerance: '± 75 g (Max Permissible Error)',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'Shakuntalam Agro Mills Private Limited',
      manufacturerAddress: 'Survey No. 44/2, GIDC Industrial Estate, Naroda, Ahmedabad, Gujarat - 382330',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: '1800-200-4455 / feedback@shakuntalamfoods.in',
      unitSalePrice: '₹ 55.00 per kg',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 3,
      notes: 'Standard sealed tamper-proof 5-ply poly pack. Gross weight measured on class III verified digital scale.',
      createdAt: '2026-09-08T10:00:00.000Z'
    },
    {
      id: 'prod-0814-2',
      inspectionId: 'insp-2026-0814',
      name: 'Purity Refined Sunflower Oil Pouch',
      brand: 'Purity Gold',
      batchNumber: 'SUN-2026-891',
      mrp: 145.00,
      netQuantity: '1 L',
      declaredUnits: 'l',
      actualMeasurement: '965 ml',
      tareWeight: '18 g',
      mpeTolerance: '± 15 ml',
      measurementOutcome: 'short_weight',
      manufacturerName: 'Purity Edible Oils Ltd',
      manufacturerAddress: 'Industrial Area Phase 1, Alwar, Rajasthan',
      monthYearOfManufacture: '07/2026',
      consumerCareDetails: 'care@purityoils.com / 011-28947111',
      unitSalePrice: '₹ 145.00 per l',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'flagged',
      complianceStatus: 'violation',
      evidenceCount: 4,
      notes: 'Sample pouch measured short quantity (965 ml vs 1L declared). Shortfall of 35ml exceeds allowable MPE under Rule 9.',
      createdAt: '2026-09-08T10:30:00.000Z'
    },
    {
      id: 'prod-0814-3',
      inspectionId: 'insp-2026-0814',
      name: 'Himalayan Premium CTC Leaf Tea Jar',
      brand: 'Valley Mist',
      batchNumber: 'TEA-MIST-094',
      mrp: 320.00,
      netQuantity: '500 g',
      declaredUnits: 'g',
      actualMeasurement: '502 g',
      tareWeight: '62 g (PET jar)',
      mpeTolerance: '± 15 g',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'Valley Mist Plantations Private Limited',
      manufacturerAddress: 'Siliguri Tea Park, Darjeeling District, West Bengal',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: 'customercare@valleymisttea.com',
      unitSalePrice: '₹ 0.64 per g',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'warning',
      evidenceCount: 2,
      notes: 'Consumer care phone number omitted on side panel; only email is declared.',
      createdAt: '2026-09-08T11:00:00.000Z'
    }
  ],
  'insp-2026-0812': [
    {
      id: 'prod-0812-1',
      inspectionId: 'insp-2026-0812',
      name: "Lay's India's Magic Masala Potato Chips (50g)",
      brand: "Lay's (PepsiCo India)",
      batchNumber: 'B-LAY-AUG26-99',
      mrp: 20.00,
      netQuantity: '50 g',
      declaredUnits: 'g',
      actualMeasurement: '49.6 g',
      tareWeight: '3.4 g',
      mpeTolerance: '± 4.5 g (Max Permissible Error)',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'PepsiCo India Holdings Pvt Ltd',
      manufacturerAddress: 'JLN Marg, Gurugram, Haryana - 122001',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: '1800-224-020 / feedback@pepsico.com',
      unitSalePrice: '₹ 0.40 per g',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 3,
      notes: 'Foil laminate pouch inspected on calibrated Class III digital balance. Declarations in full compliance with Rule 6.',
      createdAt: '2026-09-07T10:30:00.000Z'
    },
    {
      id: 'prod-0812-2',
      inspectionId: 'insp-2026-0812',
      name: 'Amul Taaza Homogenised Toned Milk (1 L Tetra Pak)',
      brand: 'Amul (GCMMF)',
      batchNumber: 'AMUL-TZ-26-881',
      mrp: 74.00,
      netQuantity: '1 L',
      declaredUnits: 'l',
      actualMeasurement: '1002 ml',
      tareWeight: '28 g',
      mpeTolerance: '± 15 ml',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'Gujarat Co-operative Milk Marketing Federation Ltd',
      manufacturerAddress: 'Amul Dairy Road, Anand, Gujarat - 388001',
      monthYearOfManufacture: '09/2026',
      consumerCareDetails: '1800-258-3333 / customercare@amul.coop',
      unitSalePrice: '₹ 74.00 per l',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 2,
      notes: 'Aseptic packaging seal intact. Volumetric cylinder measurement within standard MPE.',
      createdAt: '2026-09-07T11:00:00.000Z'
    }
  ],
  'insp-2026-0790': [
    {
      id: 'prod-0790-1',
      inspectionId: 'insp-2026-0790',
      name: 'Fortune Sunlite Refined Sunflower Oil (15 L Tin)',
      brand: 'Fortune (Adani Wilmar)',
      batchNumber: 'FTN-TIN-2026-04',
      mrp: 2150.00,
      netQuantity: '15 L',
      declaredUnits: 'l',
      actualMeasurement: '15.02 L (13.67 kg equivalent)',
      tareWeight: '0.850 kg (tin)',
      mpeTolerance: '± 150 ml',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'Adani Wilmar Limited',
      manufacturerAddress: 'Fortune House, Navrangpura, Ahmedabad, Gujarat - 380009',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: '1800-233-9999 / customercare@adaniwilmar.in',
      unitSalePrice: '₹ 143.33 per l',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 3,
      notes: 'Bulk wholesale tin tested with certified industrial scale and density conversion factor.',
      createdAt: '2026-09-02T08:30:00.000Z'
    },
    {
      id: 'prod-0790-2',
      inspectionId: 'insp-2026-0790',
      name: 'Daawat Rozana Gold Basmati Rice (10 kg Poly Woven Bag)',
      brand: 'Daawat (LT Foods)',
      batchNumber: 'DWT-RZ-2026-11',
      mrp: 890.00,
      netQuantity: '10 kg',
      declaredUnits: 'kg',
      actualMeasurement: '9.990 kg',
      tareWeight: '0.075 kg',
      mpeTolerance: '± 150 g',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'LT Foods Limited',
      manufacturerAddress: 'Unit No. 4, Sonepat Industrial Area, Haryana - 131028',
      monthYearOfManufacture: '07/2026',
      consumerCareDetails: '1800-102-0401 / customercare@ltgroup.in',
      unitSalePrice: '₹ 89.00 per kg',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 3,
      notes: 'Gross weight 10.065 kg. Net quantity 9.990 kg comfortably inside permissible MPE range.',
      createdAt: '2026-09-02T09:00:00.000Z'
    }
  ]
};

export const INITIAL_EVIDENCE: Record<string, EvidenceItem[]> = {
  'prod-0814-1': [
    {
      id: 'ev-0814-1-1',
      productId: 'prod-0814-1',
      inspectionId: 'insp-2026-0814',
      title: 'Front Display Panel & Brand Mark',
      imageUrl: createPackagingEvidenceDataUrl('Front Display Panel', 'Shakuntalam Gold', '5 kg', 275.00, undefined, {
        batch: 'BATCH-AUG26-A12',
        mfgDate: '08/2026',
        mfgName: 'Shakuntalam Agro Mills Pvt Ltd',
        usp: '₹ 55.00 / kg'
      }),
      ocrRawText: 'SHAKUNTALAM CHAKKI FRESH ATTA 100% WHOLE WHEAT NET QTY: 5 kg MRP: Rs 275.00 INCL ALL TAXES',
      ocrFields: {
        mrp: '275.00',
        netQuantity: '5 kg',
        mfgDate: '08/2026',
        manufacturer: 'Shakuntalam Agro Mills Pvt Ltd'
      },
      ocrConfidence: 0.98,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-08T10:05:00.000Z',
      createdAt: '2026-09-08T10:05:00.000Z'
    },
    {
      id: 'ev-0814-1-2',
      productId: 'prod-0814-1',
      inspectionId: 'insp-2026-0814',
      title: 'MRP & Batch Declaration Stamp',
      imageUrl: createPackagingEvidenceDataUrl('MRP & Batch Details', 'Shakuntalam Gold', '5 kg', 275.00, undefined, {
        batch: 'BATCH-AUG26-A12',
        mfgDate: '08/2026',
        usp: '₹ 55.00 / kg'
      }),
      ocrRawText: 'BATCH NO: BATCH-AUG26-A12 PKG: 08/2026 MRP: Rs 275.00 (Rs 55.00/kg) INCL. OF ALL TAXES',
      ocrFields: {
        mrp: '275.00',
        netQuantity: '5 kg',
        mfgDate: '08/2026',
        unitSalePrice: 'Rs 55.00/kg'
      },
      ocrConfidence: 0.96,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-08T10:10:00.000Z',
      createdAt: '2026-09-08T10:10:00.000Z'
    },
    {
      id: 'ev-0814-1-3',
      productId: 'prod-0814-1',
      inspectionId: 'insp-2026-0814',
      title: 'Class III Electronic Scale Readout',
      imageUrl: createPackagingEvidenceDataUrl('Weighing Scale Readout', 'Scale Verification', '4.985 kg Net', 0, undefined, {
        gross: '5.020 kg',
        tare: '0.035 kg',
        scaleCert: 'WB-9912 / NABL-2026'
      }),
      ocrRawText: 'ELECTRONIC BALANCE CERT NO. WB-9912 GROSS: 5.020 kg TARE: 0.035 kg NET: 4.985 kg WITHIN MPE LIMIT',
      ocrFields: {
        netQuantity: '4.985 kg'
      },
      ocrConfidence: 0.94,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-08T10:15:00.000Z',
      createdAt: '2026-09-08T10:15:00.000Z'
    }
  ],
  'prod-0814-2': [
    {
      id: 'ev-0814-2-1',
      productId: 'prod-0814-2',
      inspectionId: 'insp-2026-0814',
      title: 'Pouch Primary Display Face',
      imageUrl: createPackagingEvidenceDataUrl('Pouch Front Face', 'Purity Gold', '1 L', 145.00, undefined, {
        batch: 'SUN-2026-891',
        mfgDate: '07/2026',
        mfgName: 'Purity Edible Oils Ltd'
      }),
      ocrRawText: 'PURITY REFINED SUNFLOWER OIL NET VOL: 1 LITER MRP 145.00 INCL ALL TAXES',
      ocrConfidence: 0.92,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-08T10:35:00.000Z',
      createdAt: '2026-09-08T10:35:00.000Z'
    },
    {
      id: 'ev-0814-2-2',
      productId: 'prod-0814-2',
      inspectionId: 'insp-2026-0814',
      title: 'Volumetric Flask Standard Readout (Defect)',
      imageUrl: createPackagingEvidenceDataUrl('Volumetric Cylinder Reading', 'Purity Gold', '965 ml Measured', 145.00, 'DEFICIT 35ml (Allowable MPE ±15ml)', {
        gross: '983 g (with pouch)',
        tare: '18 g',
        scaleCert: 'GLASS-FLASK-ISO-4787'
      }),
      ocrRawText: 'STANDARD VOLUMETRIC CYLINDER READING: 965 ml AT 30 DEG C. DEFICIT OF 35 ml (EXCEEDS PERMISSIBLE MPE)',
      ocrConfidence: 0.95,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-08T10:40:00.000Z',
      createdAt: '2026-09-08T10:40:00.000Z'
    },
    {
      id: 'ev-0814-2-3',
      productId: 'prod-0814-2',
      inspectionId: 'insp-2026-0814',
      title: 'Back Label Mandatory Declarations',
      imageUrl: createPackagingEvidenceDataUrl('Back Panel Declarations', 'Purity Gold', '1 L', 145.00, undefined, {
        batch: 'SUN-2026-891',
        consumerCare: 'care@purityoils.com'
      }),
      ocrRawText: 'MFD BY PURITY EDIBLE OILS LTD ALWAR RAJASTHAN CONSUMER CARE: care@purityoils.com',
      ocrConfidence: 0.91,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-08T10:45:00.000Z',
      createdAt: '2026-09-08T10:45:00.000Z'
    },
    {
      id: 'ev-0814-2-4',
      productId: 'prod-0814-2',
      inspectionId: 'insp-2026-0814',
      title: 'Batch Seal & Seam Inspection',
      imageUrl: createPackagingEvidenceDataUrl('Batch Seal Seam', 'Purity Gold', 'SUN-2026-891', 145.00),
      ocrRawText: 'HEAT SEAL INTACT NO LEAKAGE OBSERVED BATCH SUN-2026-891',
      ocrConfidence: 0.89,
      verificationStatus: 'inspector_verified',
      imageQuality: 'acceptable',
      capturedAt: '2026-09-08T10:48:00.000Z',
      createdAt: '2026-09-08T10:48:00.000Z'
    }
  ],
  'prod-0814-3': [
    {
      id: 'ev-0814-3-1',
      productId: 'prod-0814-3',
      inspectionId: 'insp-2026-0814',
      title: 'Tea Jar Front Label & Seal',
      imageUrl: createPackagingEvidenceDataUrl('Tea Jar Front Panel', 'Valley Mist', '500 g', 320.00, undefined, {
        batch: 'TEA-MIST-094',
        usp: '₹ 0.64 / g'
      }),
      ocrRawText: 'VALLEY MIST CTC LEAF TEA NET WT 500 g MRP 320.00 USP Rs 0.64/g',
      ocrConfidence: 0.97,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-08T11:05:00.000Z',
      createdAt: '2026-09-08T11:05:00.000Z'
    },
    {
      id: 'ev-0814-3-2',
      productId: 'prod-0814-3',
      inspectionId: 'insp-2026-0814',
      title: 'Consumer Redressal Information Defect',
      imageUrl: createPackagingEvidenceDataUrl('Consumer Care Panel', 'Valley Mist', '500 g', 320.00, 'PHONE NUMBER OMITTED - EMAIL ONLY', {
        consumerCare: 'customercare@valleymisttea.com (NO TELEPHONE)'
      }),
      ocrRawText: 'FOR FEEDBACK EMAIL US: customercare@valleymisttea.com (NO TELEPHONE NUMBER PRINTED ON LABEL)',
      ocrConfidence: 0.93,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-08T11:10:00.000Z',
      createdAt: '2026-09-08T11:10:00.000Z'
    }
  ],
  'prod-0812-1': [
    {
      id: 'ev-0812-1-1',
      productId: 'prod-0812-1',
      inspectionId: 'insp-2026-0812',
      title: "Lay's Front Pouch Display & Brand Mark",
      imageUrl: createPackagingEvidenceDataUrl("Lay's India's Magic Masala Front Face", "Lay's", '50 g', 20.00, undefined, {
        batch: 'B-LAY-AUG26-99',
        mfgDate: '08/2026',
        mfgName: 'PepsiCo India Holdings Pvt Ltd',
        usp: '₹ 0.40 / g',
        categoryBadge: 'POTATO CHIPS PACKAGING'
      }),
      ocrRawText: "LAY'S INDIA'S MAGIC MASALA POTATO CHIPS NET WT: 50 g MRP: Rs 20.00 INCL OF ALL TAXES (Rs 0.40/g)",
      ocrFields: {
        mrp: '20.00',
        netQuantity: '50 g',
        mfgDate: '08/2026',
        unitSalePrice: 'Rs 0.40/g',
        manufacturer: 'PepsiCo India Holdings Pvt Ltd'
      },
      ocrConfidence: 0.98,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-07T10:32:00.000Z',
      createdAt: '2026-09-07T10:32:00.000Z'
    },
    {
      id: 'ev-0812-1-2',
      productId: 'prod-0812-1',
      inspectionId: 'insp-2026-0812',
      title: 'MRP & Unit Sale Price Stamp',
      imageUrl: createPackagingEvidenceDataUrl('MRP & Unit Price Stamp', "Lay's", '50 g', 20.00, undefined, {
        batch: 'B-LAY-AUG26-99',
        usp: '₹ 0.40 / g',
        consumerCare: '1800-224-020 / feedback@pepsico.com'
      }),
      ocrRawText: 'MRP Rs 20.00 (INCL. ALL TAXES) UNIT SALE PRICE: Rs 0.40/g PKG 08/2026 BATCH B-LAY-AUG26-99',
      ocrConfidence: 0.97,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-07T10:35:00.000Z',
      createdAt: '2026-09-07T10:35:00.000Z'
    },
    {
      id: 'ev-0812-1-3',
      productId: 'prod-0812-1',
      inspectionId: 'insp-2026-0812',
      title: 'Class III Precision Digital Balance Check',
      imageUrl: createPackagingEvidenceDataUrl('Digital Balance Readout', 'Scale Verification', '49.6 g Net', 0, undefined, {
        gross: '53.0 g',
        tare: '3.4 g (Foil Pouch)',
        scaleCert: 'METTLER-TOLEDO-MS204S'
      }),
      ocrRawText: 'METTLER TOLEDO MS204S GROSS: 53.0 g TARE: 3.4 g NET WEIGHT: 49.6 g (MPE ±4.5g PASS)',
      ocrFields: {
        netQuantity: '49.6 g'
      },
      ocrConfidence: 0.96,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-07T10:40:00.000Z',
      createdAt: '2026-09-07T10:40:00.000Z'
    }
  ],
  'prod-0812-2': [
    {
      id: 'ev-0812-2-1',
      productId: 'prod-0812-2',
      inspectionId: 'insp-2026-0812',
      title: 'Amul Taaza Front Tetra Pak & FSSAI Seal',
      imageUrl: createPackagingEvidenceDataUrl('Amul Taaza 1L Face', 'Amul', '1 L', 74.00, undefined, {
        batch: 'AMUL-TZ-26-881',
        mfgDate: '09/2026',
        mfgName: 'Gujarat Co-operative Milk Marketing Federation Ltd',
        usp: '₹ 74.00 / L'
      }),
      ocrRawText: 'AMUL TAAZA HOMOGENISED TONED MILK NET QTY: 1 LITER MRP Rs 74.00 FSSAI LIC NO 10012021000071',
      ocrConfidence: 0.98,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-07T11:05:00.000Z',
      createdAt: '2026-09-07T11:05:00.000Z'
    },
    {
      id: 'ev-0812-2-2',
      productId: 'prod-0812-2',
      inspectionId: 'insp-2026-0812',
      title: 'Volumetric Verification Readout',
      imageUrl: createPackagingEvidenceDataUrl('Standard Volumetric Readout', 'Amul Milk', '1002 ml Net', 74.00, undefined, {
        gross: '1030 g',
        tare: '28 g (Aseptic Tetra Pak)',
        scaleCert: 'VOL-CYL-1000ML-CAL'
      }),
      ocrRawText: 'CERTIFIED VOLUMETRIC FLASK READING: 1002 ml. WITHIN PERMISSIBLE MPE OF ±15ml.',
      ocrConfidence: 0.95,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-07T11:10:00.000Z',
      createdAt: '2026-09-07T11:10:00.000Z'
    }
  ],
  'prod-0790-1': [
    {
      id: 'ev-0790-1-1',
      productId: 'prod-0790-1',
      inspectionId: 'insp-2026-0790',
      title: 'Fortune 15L Commercial Tin Front Panel',
      imageUrl: createPackagingEvidenceDataUrl('Fortune 15L Tin', 'Fortune', '15 L', 2150.00, undefined, {
        batch: 'FTN-TIN-2026-04',
        mfgName: 'Adani Wilmar Limited',
        usp: '₹ 143.33 / L'
      }),
      ocrRawText: 'FORTUNE SUNLITE REFINED SUNFLOWER OIL NET VOLUME: 15 L (13.65 kg NET) MRP Rs 2150.00',
      ocrConfidence: 0.96,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-02T08:35:00.000Z',
      createdAt: '2026-09-02T08:35:00.000Z'
    },
    {
      id: 'ev-0790-1-2',
      productId: 'prod-0790-1',
      inspectionId: 'insp-2026-0790',
      title: 'Industrial Heavy Platform Scale Readout',
      imageUrl: createPackagingEvidenceDataUrl('Industrial Platform Scale', 'Scale Verification', '13.67 kg Net (15.02 L)', 2150.00, undefined, {
        gross: '14.520 kg',
        tare: '0.850 kg (Tin Container)',
        scaleCert: 'IND-SCALE-50KG-SER09'
      }),
      ocrRawText: 'HEAVY INDUSTRIAL SCALE GROSS: 14.520 kg TARE: 0.850 kg NET: 13.670 kg (15.02 L AT OIL DENSITY 0.91 g/ml)',
      ocrConfidence: 0.94,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-02T08:40:00.000Z',
      createdAt: '2026-09-02T08:40:00.000Z'
    },
    {
      id: 'ev-0790-1-3',
      productId: 'prod-0790-1',
      inspectionId: 'insp-2026-0790',
      title: 'Dual Metric Stamping & Mandatory Address',
      imageUrl: createPackagingEvidenceDataUrl('Mandatory Stamping Panel', 'Fortune', '15 L', 2150.00, undefined, {
        consumerCare: '1800-233-9999 / customercare@adaniwilmar.in'
      }),
      ocrRawText: 'DUAL STAMPING COMPLIANT: NET VOL 15 L / NET MASS 13.65 kg. ADANI WILMAR LTD AHMEDABAD.',
      ocrConfidence: 0.95,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-02T08:45:00.000Z',
      createdAt: '2026-09-02T08:45:00.000Z'
    }
  ],
  'prod-0790-2': [
    {
      id: 'ev-0790-2-1',
      productId: 'prod-0790-2',
      inspectionId: 'insp-2026-0790',
      title: 'Daawat 10kg Bag Display Face',
      imageUrl: createPackagingEvidenceDataUrl('Daawat 10kg Bag', 'Daawat', '10 kg', 890.00, undefined, {
        batch: 'DWT-RZ-2026-11',
        mfgName: 'LT Foods Limited',
        usp: '₹ 89.00 / kg'
      }),
      ocrRawText: 'DAAWAT ROZANA GOLD BASMATI RICE NET QTY: 10 kg MRP Rs 890.00 INCL ALL TAXES USP Rs 89.00/kg',
      ocrConfidence: 0.97,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-02T09:05:00.000Z',
      createdAt: '2026-09-02T09:05:00.000Z'
    },
    {
      id: 'ev-0790-2-2',
      productId: 'prod-0790-2',
      inspectionId: 'insp-2026-0790',
      title: 'Scale Verification Readout',
      imageUrl: createPackagingEvidenceDataUrl('Scale Verification Readout', 'Scale Verification', '9.990 kg Net', 890.00, undefined, {
        gross: '10.065 kg',
        tare: '0.075 kg (Poly Bag)',
        scaleCert: 'WB-RICE-SCALE-042'
      }),
      ocrRawText: 'DIGITAL SCALE CALIBRATED GROSS: 10.065 kg TARE: 0.075 kg NET: 9.990 kg (MPE ±150g PASS)',
      ocrConfidence: 0.95,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-02T09:10:00.000Z',
      createdAt: '2026-09-02T09:10:00.000Z'
    },
    {
      id: 'ev-0790-2-3',
      productId: 'prod-0790-2',
      inspectionId: 'insp-2026-0790',
      title: 'Consumer Redressal & Packer Address',
      imageUrl: createPackagingEvidenceDataUrl('Packer Address & Care', 'Daawat', '10 kg', 890.00, undefined, {
        consumerCare: '1800-102-0401 / customercare@ltgroup.in'
      }),
      ocrRawText: 'PACKED BY LT FOODS LTD SONEPAT HARYANA CONSUMER HELPLINE: 1800-102-0401',
      ocrConfidence: 0.93,
      verificationStatus: 'inspector_verified',
      imageQuality: 'high',
      capturedAt: '2026-09-02T09:15:00.000Z',
      createdAt: '2026-09-02T09:15:00.000Z'
    }
  ]
};

// Dynamic Commodity & Packaging Evidence Generator for any custom or new inspection
export function generateProductsAndEvidenceForInspection(
  inspectionId: string, 
  businessName: string = '', 
  category: string = ''
): { products: Product[]; evidence: Record<string, EvidenceItem[]> } {
  const nameLower = businessName.toLowerCase();
  const catLower = category.toLowerCase();

  const isChips = nameLower.includes('lay') || nameLower.includes('chip') || nameLower.includes('snack') || nameLower.includes('kurkure') || nameLower.includes('bingo') || nameLower.includes('haldiram');
  const isDairy = nameLower.includes('amul') || nameLower.includes('milk') || nameLower.includes('dairy') || catLower.includes('dairy') || catLower.includes('beverage');
  const isOil = nameLower.includes('oil') || nameLower.includes('fortune') || nameLower.includes('saffola') || catLower.includes('oil');
  const isIndustrial = nameLower.includes('docker') || nameLower.includes('tech') || nameLower.includes('hardware') || catLower.includes('industrial');

  const products: Product[] = [];
  const evidence: Record<string, EvidenceItem[]> = {};

  if (isChips) {
    const p1Id = `prod-${inspectionId}-1`;
    const p2Id = `prod-${inspectionId}-2`;

    const p1: Product = {
      id: p1Id,
      inspectionId,
      name: "Lay's India's Magic Masala Potato Chips (50g Pouch)",
      brand: "Lay's (PepsiCo India)",
      batchNumber: 'B-LAY-AUG26-99',
      mrp: 20.00,
      netQuantity: '50 g',
      declaredUnits: 'g',
      actualMeasurement: '49.6 g',
      tareWeight: '3.4 g',
      mpeTolerance: '± 4.5 g (Max Permissible Error)',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'PepsiCo India Holdings Pvt Ltd',
      manufacturerAddress: 'JLN Marg, Gurugram, Haryana - 122001',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: '1800-224-020 / feedback@pepsico.com',
      unitSalePrice: '₹ 0.40 per g',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 3,
      notes: 'Foil laminate pouch inspected on calibrated Class III digital balance. Declarations in full compliance with Rule 6.',
      createdAt: new Date().toISOString()
    };

    const p2: Product = {
      id: p2Id,
      inspectionId,
      name: "Lay's Classic Salted Potato Chips (115g Party Pack)",
      brand: "Lay's (PepsiCo India)",
      batchNumber: 'B-LAY-AUG26-44',
      mrp: 50.00,
      netQuantity: '115 g',
      declaredUnits: 'g',
      actualMeasurement: '116.2 g',
      tareWeight: '5.8 g',
      mpeTolerance: '± 4.5 g',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'PepsiCo India Holdings Pvt Ltd',
      manufacturerAddress: 'JLN Marg, Gurugram, Haryana - 122001',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: '1800-224-020 / feedback@pepsico.com',
      unitSalePrice: '₹ 0.43 per g',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 2,
      notes: 'Party pack net mass verified within tolerance. Clear Rule 6 declarations on primary display face.',
      createdAt: new Date().toISOString()
    };

    products.push(p1, p2);

    evidence[p1Id] = [
      {
        id: `ev-${p1Id}-1`,
        productId: p1Id,
        inspectionId,
        title: "Lay's Magic Masala Front Display Face",
        imageUrl: createPackagingEvidenceDataUrl("Lay's India's Magic Masala Front Face", "Lay's", '50 g', 20.00, undefined, {
          batch: 'B-LAY-AUG26-99',
          mfgName: 'PepsiCo India Holdings Pvt Ltd',
          usp: '₹ 0.40 / g',
          categoryBadge: 'POTATO CHIPS PACKAGING'
        }),
        ocrRawText: "LAY'S INDIA'S MAGIC MASALA POTATO CHIPS NET WT: 50 g MRP: Rs 20.00 INCL OF ALL TAXES (Rs 0.40/g)",
        ocrFields: { mrp: '20.00', netQuantity: '50 g', mfgDate: '08/2026', unitSalePrice: 'Rs 0.40/g', manufacturer: 'PepsiCo India' },
        ocrConfidence: 0.98,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p1Id}-2`,
        productId: p1Id,
        inspectionId,
        title: 'MRP & Unit Sale Price Stamp',
        imageUrl: createPackagingEvidenceDataUrl('MRP & Unit Price Stamp', "Lay's", '50 g', 20.00, undefined, {
          batch: 'B-LAY-AUG26-99',
          usp: '₹ 0.40 / g',
          consumerCare: '1800-224-020 / feedback@pepsico.com'
        }),
        ocrRawText: 'MRP Rs 20.00 (INCL. ALL TAXES) UNIT SALE PRICE: Rs 0.40/g PKG 08/2026 BATCH B-LAY-AUG26-99',
        ocrConfidence: 0.97,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p1Id}-3`,
        productId: p1Id,
        inspectionId,
        title: 'Class III Precision Digital Balance Check',
        imageUrl: createPackagingEvidenceDataUrl('Digital Balance Readout', 'Scale Verification', '49.6 g Net', 0, undefined, {
          gross: '53.0 g',
          tare: '3.4 g (Foil Pouch)',
          scaleCert: 'METTLER-TOLEDO-MS204S'
        }),
        ocrRawText: 'METTLER TOLEDO MS204S GROSS: 53.0 g TARE: 3.4 g NET WEIGHT: 49.6 g (MPE ±4.5g PASS)',
        ocrConfidence: 0.96,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    evidence[p2Id] = [
      {
        id: `ev-${p2Id}-1`,
        productId: p2Id,
        inspectionId,
        title: "Lay's Classic Salted Party Pack Face",
        imageUrl: createPackagingEvidenceDataUrl("Lay's Classic Salted 115g Face", "Lay's", '115 g', 50.00, undefined, {
          batch: 'B-LAY-AUG26-44',
          mfgName: 'PepsiCo India Holdings Pvt Ltd',
          usp: '₹ 0.43 / g'
        }),
        ocrRawText: "LAY'S CLASSIC SALTED POTATO CHIPS NET WT 115 g MRP Rs 50.00 USP Rs 0.43/g",
        ocrConfidence: 0.97,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p2Id}-2`,
        productId: p2Id,
        inspectionId,
        title: 'FSSAI License & Address Declarations',
        imageUrl: createPackagingEvidenceDataUrl('FSSAI & Manufacturer Address Panel', "Lay's", '115 g', 50.00, undefined, {
          consumerCare: '1800-224-020 / feedback@pepsico.com'
        }),
        ocrRawText: 'MFD BY PEPSICO INDIA HOLDINGS PVT LTD GURUGRAM FSSAI LIC NO 10014064000435',
        ocrConfidence: 0.95,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
  } else if (isIndustrial) {
    const p1Id = `prod-${inspectionId}-1`;
    const p2Id = `prod-${inspectionId}-2`;

    const p1: Product = {
      id: p1Id,
      inspectionId,
      name: 'Docker Precision Industrial Sealant Compound (500 ml)',
      brand: 'Docker Pro-Tech',
      batchNumber: 'DOC-SEAL-2026-09',
      mrp: 450.00,
      netQuantity: '500 ml',
      declaredUnits: 'ml',
      actualMeasurement: '505 ml',
      tareWeight: '45 g',
      mpeTolerance: '± 15 ml',
      measurementOutcome: 'within_tolerance',
      manufacturerName: 'Docker Industrial Solutions India Pvt Ltd',
      manufacturerAddress: 'Industrial Zone Phase IV, Peenya, Bengaluru, Karnataka - 560058',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: '1800-425-9988 / support@docker-tech.in',
      unitSalePrice: '₹ 0.90 per ml',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'not_applicable',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 3,
      notes: 'Packaged industrial commodity conforming to Fifth Schedule unit representations and Rule 6 declarations.',
      createdAt: new Date().toISOString()
    };

    const p2: Product = {
      id: p2Id,
      inspectionId,
      name: 'Docker Synthetic Heavy Gear Lubricant Oil (1 L Can)',
      brand: 'Docker Pro-Tech',
      batchNumber: 'DOC-LUB-881',
      mrp: 680.00,
      netQuantity: '1 L',
      declaredUnits: 'l',
      actualMeasurement: '970 ml',
      tareWeight: '110 g (HDPE Can)',
      mpeTolerance: '± 15 ml',
      measurementOutcome: 'short_weight',
      manufacturerName: 'Docker Industrial Solutions India Pvt Ltd',
      manufacturerAddress: 'Industrial Zone Phase IV, Peenya, Bengaluru, Karnataka - 560058',
      monthYearOfManufacture: '07/2026',
      consumerCareDetails: '1800-425-9988 / support@docker-tech.in',
      unitSalePrice: '₹ 680.00 per l',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'not_applicable',
      verificationStatus: 'flagged',
      complianceStatus: 'violation',
      evidenceCount: 3,
      notes: 'Measured 970 ml against declared 1 L. Deficit of 30 ml exceeds allowable MPE of ±15 ml under Rule 9.',
      createdAt: new Date().toISOString()
    };

    products.push(p1, p2);

    evidence[p1Id] = [
      {
        id: `ev-${p1Id}-1`,
        productId: p1Id,
        inspectionId,
        title: 'Docker Sealant Primary Face & Net Quantity',
        imageUrl: createPackagingEvidenceDataUrl('Docker Sealant 500ml', 'Docker Pro-Tech', '500 ml', 450.00, undefined, {
          batch: 'DOC-SEAL-2026-09',
          mfgName: 'Docker Industrial Solutions India Pvt Ltd',
          usp: '₹ 0.90 / ml',
          categoryBadge: 'INDUSTRIAL COMMODITY'
        }),
        ocrRawText: 'DOCKER PRO-TECH INDUSTRIAL SEALANT NET VOL 500 ml MRP Rs 450.00 USP Rs 0.90/ml',
        ocrConfidence: 0.98,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p1Id}-2`,
        productId: p1Id,
        inspectionId,
        title: 'Calibrated Scale & Tare Measurement',
        imageUrl: createPackagingEvidenceDataUrl('Digital Balance Check', 'Scale Verification', '505 ml Net', 0, undefined, {
          gross: '550 g',
          tare: '45 g',
          scaleCert: 'IND-CAL-DOC-991'
        }),
        ocrRawText: 'CALIBRATED BALANCE CHECK GROSS: 550 g TARE: 45 g NET: 505 ml WITHIN MPE TOLERANCE',
        ocrConfidence: 0.96,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p1Id}-3`,
        productId: p1Id,
        inspectionId,
        title: 'Mandatory Industrial Declarations',
        imageUrl: createPackagingEvidenceDataUrl('Rule 6 Mandatory Declarations', 'Docker Pro-Tech', '500 ml', 450.00, undefined, {
          consumerCare: '1800-425-9988 / support@docker-tech.in'
        }),
        ocrRawText: 'MFD BY DOCKER INDUSTRIAL SOLUTIONS BENGALURU CONSUMER HELPLINE: 1800-425-9988',
        ocrConfidence: 0.95,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    evidence[p2Id] = [
      {
        id: `ev-${p2Id}-1`,
        productId: p2Id,
        inspectionId,
        title: 'Docker Lubricant 1L Can Face',
        imageUrl: createPackagingEvidenceDataUrl('Docker Gear Lubricant 1L', 'Docker Pro-Tech', '1 L', 680.00, undefined, {
          batch: 'DOC-LUB-881',
          usp: '₹ 680.00 / L'
        }),
        ocrRawText: 'DOCKER SYNTHETIC GEAR LUBRICANT NET VOLUME: 1 LITER MRP Rs 680.00',
        ocrConfidence: 0.96,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p2Id}-2`,
        productId: p2Id,
        inspectionId,
        title: 'Volumetric Shortfall Standard Readout (Defect)',
        imageUrl: createPackagingEvidenceDataUrl('Standard Volumetric Cylinder', 'Docker Pro-Tech', '970 ml Measured', 680.00, 'DEFICIT 30ml (Allowable MPE ±15ml)', {
          gross: '980 g',
          tare: '110 g',
          scaleCert: 'GLASS-FLASK-ISO-4787'
        }),
        ocrRawText: 'VOLUMETRIC FLASK READING: 970 ml AT 27 DEG C. NET SHORTFALL OF 30 ml EXCEEDS RULE 9 MPE LIMIT.',
        ocrConfidence: 0.97,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p2Id}-3`,
        productId: p2Id,
        inspectionId,
        title: 'Batch & Container Seam Verification',
        imageUrl: createPackagingEvidenceDataUrl('Batch Stamp & Seam', 'Docker Pro-Tech', 'DOC-LUB-881', 680.00),
        ocrRawText: 'BATCH DOC-LUB-881 TAMPER PROOF CAP INTACT NO LEAKAGE',
        ocrConfidence: 0.94,
        verificationStatus: 'inspector_verified',
        imageQuality: 'acceptable',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
  } else {
    // Default high-quality staple & edible package suite
    const brandName = businessName ? businessName.split(' ')[0] : 'Golden Harvest';
    const p1Id = `prod-${inspectionId}-1`;
    const p2Id = `prod-${inspectionId}-2`;

    const p1: Product = {
      id: p1Id,
      inspectionId,
      name: `${brandName} Premium Sharbati Whole Wheat Atta (5 kg)`,
      brand: `${brandName} Select`,
      batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
      mrp: 295.00,
      netQuantity: '5 kg',
      declaredUnits: 'kg',
      actualMeasurement: '4.990 kg',
      tareWeight: '0.035 kg',
      mpeTolerance: '± 75 g (Max Permissible Error)',
      measurementOutcome: 'within_tolerance',
      manufacturerName: `${brandName} Consumer Goods Private Limited`,
      manufacturerAddress: 'Survey No. 88, Sector 12, Food Processing Estate, NCR',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: `1800-120-9900 / support@${brandName.toLowerCase()}.in`,
      unitSalePrice: '₹ 59.00 per kg',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 3,
      notes: 'Clean 5-ply tamper-proof bag. Net quantity measured 4.990 kg on verified digital scales.',
      createdAt: new Date().toISOString()
    };

    const p2: Product = {
      id: p2Id,
      inspectionId,
      name: `${brandName} Refined Mustard Oil (1 L Pouch)`,
      brand: `${brandName} Pure`,
      batchNumber: `MUST-${Date.now().toString().slice(-4)}`,
      mrp: 165.00,
      netQuantity: '1 L',
      declaredUnits: 'l',
      actualMeasurement: '1004 ml',
      tareWeight: '16 g',
      mpeTolerance: '± 15 ml',
      measurementOutcome: 'within_tolerance',
      manufacturerName: `${brandName} Agro Industries Ltd`,
      manufacturerAddress: 'Industrial Area, Phase 2, Jaipur, Rajasthan',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: `care@${brandName.toLowerCase()}.in / 011-44556677`,
      unitSalePrice: '₹ 165.00 per l',
      countryOfOrigin: 'India',
      vegNonVegSymbol: 'green_veg',
      verificationStatus: 'verified',
      complianceStatus: 'compliant',
      evidenceCount: 2,
      notes: 'Pouch seal intact. Rule 6 declarations, MRP and Unit Sale Price clearly declared.',
      createdAt: new Date().toISOString()
    };

    products.push(p1, p2);

    evidence[p1Id] = [
      {
        id: `ev-${p1Id}-1`,
        productId: p1Id,
        inspectionId,
        title: `${brandName} 5kg Atta Front Display Face`,
        imageUrl: createPackagingEvidenceDataUrl(`${brandName} Sharbati Atta 5kg`, `${brandName} Select`, '5 kg', 295.00, undefined, {
          batch: p1.batchNumber,
          mfgName: p1.manufacturerName,
          usp: '₹ 59.00 / kg'
        }),
        ocrRawText: `${brandName.toUpperCase()} SHARBATI ATTA NET QTY: 5 kg MRP Rs 295.00 INCL ALL TAXES USP Rs 59.00/kg`,
        ocrFields: { mrp: '295.00', netQuantity: '5 kg', mfgDate: '08/2026', unitSalePrice: 'Rs 59.00/kg' },
        ocrConfidence: 0.98,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p1Id}-2`,
        productId: p1Id,
        inspectionId,
        title: 'Calibrated Electronic Balance Readout',
        imageUrl: createPackagingEvidenceDataUrl('Class III Digital Scale Readout', 'Scale Verification', '4.990 kg Net', 0, undefined, {
          gross: '5.025 kg',
          tare: '0.035 kg',
          scaleCert: 'NABL-LM-CAL-8891'
        }),
        ocrRawText: 'DIGITAL BALANCE VERIFIED GROSS: 5.025 kg TARE: 0.035 kg NET: 4.990 kg WITHIN MPE LIMIT',
        ocrConfidence: 0.95,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p1Id}-3`,
        productId: p1Id,
        inspectionId,
        title: 'Mandatory Declaration & Consumer Cell',
        imageUrl: createPackagingEvidenceDataUrl('Mandatory Declarations', `${brandName} Select`, '5 kg', 295.00, undefined, {
          consumerCare: p1.consumerCareDetails
        }),
        ocrRawText: `MFD BY ${p1.manufacturerName.toUpperCase()} CONSUMER CARE: ${p1.consumerCareDetails}`,
        ocrConfidence: 0.94,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    evidence[p2Id] = [
      {
        id: `ev-${p2Id}-1`,
        productId: p2Id,
        inspectionId,
        title: `${brandName} 1L Mustard Oil Front Face`,
        imageUrl: createPackagingEvidenceDataUrl(`${brandName} Mustard Oil 1L`, `${brandName} Pure`, '1 L', 165.00, undefined, {
          batch: p2.batchNumber,
          usp: '₹ 165.00 / L'
        }),
        ocrRawText: `${brandName.toUpperCase()} REFINED MUSTARD OIL NET VOL: 1 LITER MRP Rs 165.00`,
        ocrConfidence: 0.96,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `ev-${p2Id}-2`,
        productId: p2Id,
        inspectionId,
        title: 'Volumetric Flask Standard Readout',
        imageUrl: createPackagingEvidenceDataUrl('Volumetric Cylinder', 'Scale Verification', '1004 ml Net', 165.00, undefined, {
          gross: '1020 g',
          tare: '16 g (Pouch)',
          scaleCert: 'GLASS-FLASK-ISO-4787'
        }),
        ocrRawText: 'VOLUMETRIC FLASK READING: 1004 ml. WITHIN ALLOWABLE MPE OF ±15ml.',
        ocrConfidence: 0.95,
        verificationStatus: 'inspector_verified',
        imageQuality: 'high',
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
  }

  return { products, evidence };
}

export const INITIAL_FINDINGS: Finding[] = [
  {
    id: 'find-0814-1',
    inspectionId: 'insp-2026-0814',
    productId: 'prod-0814-2',
    productName: 'Purity Refined Sunflower Oil Pouch',
    ruleCode: 'LM-PCR-R6-NETQTY',
    ruleTitle: 'Short Delivery / Deficit in Net Quantity',
    ruleDescription: 'Net volume measured was 965 ml against declared 1 Liter (deficit of 35 ml exceeds allowable MPE of ±15 ml).',
    severity: 'violation',
    status: 'open',
    observation: 'Statutory sample measured 965 ml using certified glass volumetric flask. Net deficit of 35 ml constitutes contravention of Section 30 of Legal Metrology Act, 2009 read with Rule 9.',
    evidenceId: 'ev-0814-2-2',
    evidenceTitle: 'Volumetric Flask Standard Readout (Defect)',
    createdAt: '2026-09-08T10:42:00.000Z'
  },
  {
    id: 'find-0814-2',
    inspectionId: 'insp-2026-0814',
    productId: 'prod-0814-3',
    productName: 'Himalayan Premium CTC Leaf Tea Jar',
    ruleCode: 'LM-PCR-R6-CARE',
    ruleTitle: 'Incomplete Consumer Care Redressal Declaration',
    ruleDescription: 'Package fails to declare a functional telephone number for consumer complaints under Rule 6(1)(e).',
    severity: 'warning',
    status: 'open',
    observation: 'Only email contact is printed on the package label. Mandatory telephone contact number is absent.',
    evidenceId: 'ev-0814-3-2',
    evidenceTitle: 'Consumer Redressal Information Defect',
    createdAt: '2026-09-08T11:12:00.000Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'aud-001',
    inspectionId: 'insp-2026-0814',
    actorId: 'demo_inspector_001',
    actorEmail: 'inspector.sharma@metrology.gov.in',
    actorRole: 'inspector',
    action: 'INSPECTION_CREATED',
    details: 'Inspection initiated for Apex Hypermarket under Zone 4 jurisdiction',
    previousState: 'none',
    newState: 'draft',
    timestamp: '2026-09-08T09:30:00.000Z'
  },
  {
    id: 'aud-002',
    inspectionId: 'insp-2026-0814',
    actorId: 'demo_inspector_001',
    actorEmail: 'inspector.sharma@metrology.gov.in',
    actorRole: 'inspector',
    action: 'PRODUCTS_ADDED',
    details: 'Added 3 commodity batches (Atta, Sunflower Oil, CTC Tea) for statutory evaluation',
    timestamp: '2026-09-08T10:00:00.000Z'
  },
  {
    id: 'aud-003',
    inspectionId: 'insp-2026-0814',
    actorId: 'demo_inspector_001',
    actorEmail: 'inspector.sharma@metrology.gov.in',
    actorRole: 'inspector',
    action: 'EVIDENCE_VERIFIED',
    details: 'Captured and verified 9 packaging evidence images with digital weight checks',
    timestamp: '2026-09-08T11:15:00.000Z'
  },
  {
    id: 'aud-004',
    inspectionId: 'insp-2026-0814',
    actorId: 'demo_inspector_001',
    actorEmail: 'inspector.sharma@metrology.gov.in',
    actorRole: 'inspector',
    action: 'VIOLATION_RECORDED',
    details: 'Recorded Net Quantity Shortfall finding on Purity Refined Sunflower Oil (35ml deficit)',
    newState: 'review_required',
    timestamp: '2026-09-08T11:20:00.000Z'
  }
];
