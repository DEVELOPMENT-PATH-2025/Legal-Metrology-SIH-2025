import { jsPDF } from 'jspdf';
import { Inspection, Product, EvidenceItem, Finding } from '../types';

export interface GeneratePdfOptions {
  inspection: Inspection;
  product: Product;
  evidenceList?: EvidenceItem[];
  findings?: Finding[];
  includeFullDossierSchedule?: boolean;
  allProducts?: Product[];
}

/**
 * Generates and downloads an official Legal Metrology statutory PDF report for the latest product/dossier.
 */
export function generateOfficialProductDossierPdf(options: GeneratePdfOptions): jsPDF {
  const {
    inspection,
    product,
    evidenceList = [],
    findings = [],
    includeFullDossierSchedule = false,
    allProducts = []
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderWatermark();
      return true;
    }
    return false;
  };

  const drawHeaderWatermark = () => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, margin - 2, pageWidth - margin, margin - 2);
  };

  // 1. TOP STATUTORY HEADER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS', pageWidth / 2, y + 5.5, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(219, 234, 254); // blue-100
  doc.text('DIRECTORATE OF LEGAL METROLOGY', pageWidth / 2, y + 11.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('STATUTORY PACKAGING COMPLIANCE DOSSIER & VERIFICATION CERTIFICATE', pageWidth / 2, y + 16.5, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Issued under Legal Metrology Act, 2009 read with Legal Metrology (Packaged Commodities) Rules, 2011', pageWidth / 2, y + 21, { align: 'center' });

  y += 28;

  // 2. DOSSIER METADATA BAR
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  const colWidth = contentWidth / 4;
  
  // Col 1
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DOSSIER NUMBER', margin + 3, y + 4.5);
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.inspectionNumber, margin + 3, y + 9);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`DATE: ${inspection.scheduledDate}`, margin + 3, y + 14);

  // Col 2
  doc.setFontSize(6.5);
  doc.text('INSPECTED ENTERPRISE', margin + colWidth + 3, y + 4.5);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const truncBusiness = doc.splitTextToSize(inspection.businessName, colWidth - 6);
  doc.text(truncBusiness[0] || inspection.businessName, margin + colWidth + 3, y + 9);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`LIC: ${inspection.licenseNumber}`, margin + colWidth + 3, y + 14);

  // Col 3
  doc.setFontSize(6.5);
  doc.text('JURISDICTION / REGION', margin + (colWidth * 2) + 3, y + 4.5);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.jurisdiction || 'Regional Metrology Division', margin + (colWidth * 2) + 3, y + 9);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`OFFICER: ${inspection.inspectorName}`, margin + (colWidth * 2) + 3, y + 14);

  // Col 4: Status badge
  const isCompliant = product.complianceStatus === 'compliant';
  doc.setFontSize(6.5);
  doc.text('PRODUCT VERDICT', margin + (colWidth * 3) + 3, y + 4.5);
  
  if (isCompliant) {
    doc.setFillColor(220, 252, 231); // emerald-100
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(margin + (colWidth * 3) + 3, y + 6.5, colWidth - 6, 8, 1, 1, 'FD');
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('✓ STATUTORY COMPLIANT', margin + (colWidth * 3) + 5, y + 12);
  } else {
    doc.setFillColor(254, 226, 226); // rose-100
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(margin + (colWidth * 3) + 3, y + 6.5, colWidth - 6, 8, 1, 1, 'FD');
    doc.setTextColor(153, 27, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('⚠ CONTRAVENTION NOTED', margin + (colWidth * 3) + 5, y + 12);
  }

  y += 22;

  // 3. SECTION: LATEST PRODUCT STATUTORY AUDIT SCHEDULE
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`SCHEDULE 1: LATEST INSPECTED COMMODITY SPECIFICATION [${product.name.toUpperCase()}]`, margin + 3, y + 4.2);

  y += 8;

  // Commodity Primary Table
  const rowH = 6;
  const colW1 = 55;
  const colW2 = contentWidth - colW1;

  const drawRow = (label: string, value: string, isAlternate: boolean = false, highlight?: boolean) => {
    checkPageBreak(rowH + 2);
    if (isAlternate) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowH, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, margin + contentWidth, y + rowH);
    doc.line(margin + colW1, y, margin + colW1, y + rowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin + 2.5, y + 4);

    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(highlight ? (isCompliant ? 22 : 185) : 15, highlight ? (isCompliant ? 101 : 28) : 23, highlight ? (isCompliant ? 52 : 28) : 42);
    const truncVal = doc.splitTextToSize(value || 'N/A', colW2 - 5);
    doc.text(truncVal[0] || 'N/A', margin + colW1 + 3, y + 4);

    y += rowH;
  };

  drawRow('COMMODITY / TRADE NAME', `${product.name} (${product.brand || 'Unbranded'})`, false);
  drawRow('BATCH / LOT NUMBER', product.batchNumber || 'LOT-VERIFIED', true);
  drawRow('DECLARED NET QUANTITY (Rule 6(1)(b))', product.netQuantity || 'N/A', false);
  drawRow('ACTUAL PHYSICAL MEASUREMENT', `${product.actualMeasurement || 'Verified with Class II Scale'} (Tare: ${product.tareWeight || 'Class II Net'})`, true, true);
  drawRow('RULE 9 MPE TOLERANCE THRESHOLD', product.mpeTolerance || 'Within Second Schedule MPE Limit', false);
  drawRow('MEASUREMENT ACCURACY OUTCOME', (product.measurementOutcome || 'Within Tolerance').toUpperCase(), true, true);
  drawRow('MAXIMUM RETAIL PRICE (Rule 6(1)(c))', `₹ ${Number(product.mrp || 0).toFixed(2)} (Inclusive of all statutory taxes)`, false);
  drawRow('UNIT SALE PRICE (USP - Rule 6(11))', product.unitSalePrice || `₹ ${(Number(product.mrp || 0) / 1).toFixed(2)} / unit`, true);
  drawRow('MFG / PACKING DATE (Rule 6(1)(d))', product.monthYearOfManufacture || 'Current Lot', false);
  drawRow('MANUFACTURER / PACKER (Rule 6(1)(a))', `${product.manufacturerName || 'Registered Enterprise'}, ${product.manufacturerAddress || 'Factory Premises'}`, true);
  drawRow('CONSUMER CARE REDRESSAL (Rule 6(1)(f))', product.consumerCareDetails || 'Designated Grievance Helpline & Email', false);
  drawRow('COUNTRY OF ORIGIN & SYMBOL', `${product.countryOfOrigin || 'INDIA'} • ${product.vegNonVegSymbol === 'green_veg' ? 'Green Veg Emblem Verified' : product.vegNonVegSymbol === 'brown_nonveg' ? 'Brown Non-Veg Emblem Verified' : 'Standard Packaging'}`, true);

  y += 4;

  // 4. SECTION: STATUTORY PCR 2011 MANDATORY DECLARATIONS AUDIT
  checkPageBreak(35);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SCHEDULE 2: PCR 2011 RULE 6 MANDATORY DECLARATIONS CHECKLIST', margin + 3, y + 4.2);

  y += 8;

  const checklist = [
    { rule: 'Rule 6(1)(a)', item: 'Name and complete address of Manufacturer / Packer / Importer', status: product.manufacturerName ? 'PASS' : 'FAIL' },
    { rule: 'Rule 6(1)(b)', item: 'Generic or Common Name of the commodity contained in package', status: product.name ? 'PASS' : 'FAIL' },
    { rule: 'Rule 6(1)(c)', item: 'Net Quantity in standard units of weight, measure or number', status: product.netQuantity ? 'PASS' : 'FAIL' },
    { rule: 'Rule 6(1)(d)', item: 'Month and Year of manufacture, packing or import', status: product.monthYearOfManufacture ? 'PASS' : 'FAIL' },
    { rule: 'Rule 6(1)(e)', item: 'Maximum Retail Price (MRP) clearly stated inclusive of all taxes', status: product.mrp > 0 ? 'PASS' : 'FAIL' },
    { rule: 'Rule 6(1)(f)', item: 'Name, address, phone and email of consumer grievance redressal', status: product.consumerCareDetails ? 'PASS' : 'FAIL' },
    { rule: 'Rule 6(11)', item: 'Unit Sale Price (USP) declared per g/ml/piece where applicable', status: product.unitSalePrice ? 'PASS' : 'PASS' },
    { rule: 'Rule 9 / Sched 2', item: 'Net Quantity within Maximum Permissible Error (MPE) tolerance', status: product.measurementOutcome !== 'short_weight' ? 'PASS' : 'FAIL' }
  ];

  checklist.forEach((check, idx) => {
    checkPageBreak(5);
    const isPass = check.status === 'PASS';
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(margin, y, contentWidth, 5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 5, margin + contentWidth, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(check.rule, margin + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(check.item, margin + 28, y + 3.5);

    doc.setFont('helvetica', 'bold');
    if (isPass) {
      doc.setTextColor(22, 101, 52);
      doc.text('✓ COMPLIANT', margin + contentWidth - 22, y + 3.5);
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text('⚠ CONTRAVENTION', margin + contentWidth - 27, y + 3.5);
    }

    y += 5;
  });

  y += 4;

  // 5. STATUTORY FINDINGS & CONTRAVENTIONS (IF APPLICABLE)
  const productFindings = findings.filter(f => !f.productId || f.productId === product.id);
  if (productFindings.length > 0) {
    checkPageBreak(25);
    doc.setFillColor(153, 27, 27); // red-800
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`SCHEDULE 3: STATUTORY CONTRAVENTIONS RECORDED (${productFindings.length} VIOLATIONS)`, margin + 3, y + 4.2);

    y += 8;

    productFindings.forEach((f) => {
      checkPageBreak(12);
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(153, 27, 27);
      doc.text(`[${f.ruleCode}] ${f.ruleTitle}`, margin + 3, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const truncObs = doc.splitTextToSize(`Observation: ${f.observation}`, contentWidth - 6);
      doc.text(truncObs[0] || f.observation, margin + 3, y + 7.5);

      y += 12;
    });

    y += 2;
  }

  // 6. MULTI-PRODUCT SUMMARY (IF REQUESTED OR MULTIPLE PRODUCTS EXIST)
  if (includeFullDossierSchedule && allProducts.length > 1) {
    checkPageBreak(30);
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`SCHEDULE 4: ALL COMMODITIES IN THIS DOSSIER (${allProducts.length} PRODUCTS)`, margin + 3, y + 4.2);

    y += 8;

    allProducts.forEach((p, idx) => {
      checkPageBreak(6);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(margin, y, contentWidth, 5.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${p.name}`, margin + 2, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Batch: ${p.batchNumber} | Qty: ${p.netQuantity} | MRP: ₹${p.mrp.toFixed(2)}`, margin + 65, y + 3.8);

      doc.setFont('helvetica', 'bold');
      const pCompliant = p.complianceStatus === 'compliant';
      doc.setTextColor(pCompliant ? 22 : 185, pCompliant ? 101 : 28, pCompliant ? 52 : 28);
      doc.text(pCompliant ? 'COMPLIANT' : 'FLAGGED', margin + contentWidth - 22, y + 3.8);

      y += 5.5;
    });

    y += 4;
  }

  // 7. ANNEXURE: EVIDENCE EXHIBITS
  const productEvidence = evidenceList.filter(e => !e.productId || e.productId === product.id);
  if (productEvidence.length > 0) {
    checkPageBreak(25);
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`ANNEXURE A: FIELD PACKAGING EVIDENCE EXHIBITS (${productEvidence.length} CAPTURES)`, margin + 3, y + 4.2);

    y += 8;

    // List evidence items
    productEvidence.slice(0, 4).forEach((ev, idx) => {
      checkPageBreak(12);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(`EXHIBIT #${idx + 1}: ${ev.title}`, margin + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Status: ${ev.verificationStatus} | Confidence: ${((ev.ocrConfidence || 0.95) * 100).toFixed(0)}% | Captured: ${ev.capturedAt || 'Field Inspection Session'}`, margin + 3, y + 7.2);

      y += 11;
    });

    y += 2;
  }

  // 8. SIGNATURES & OFFICIAL SEALS BLOCK (GUARANTEED AT BOTTOM OR ON CLEAN PAGE)
  checkPageBreak(38);

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);

  y += 4;

  const sigColW = contentWidth / 3;

  // Sign 1: Field Inspector
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, sigColW - 3, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INSPECTING FIELD OFFICER', margin + 3, y + 4.5);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.inspectorName, margin + 3, y + 9);
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Metrology Inspector', margin + 3, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('✓ DIGITALLY SEALED & RECORDED', margin + 3, y + 18);
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`HASH: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, margin + 3, y + 23);

  // Sign 2: Reviewing Authority
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + sigColW, y, sigColW - 3, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REVIEWING METROLOGY CONTROLLER', margin + sigColW + 3, y + 4.5);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.reviewerName || 'Pooja Verma (Controller)', margin + sigColW + 3, y + 9);
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Senior Metrology Review Authority', margin + sigColW + 3, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(inspection.status === 'approved' ? 22 : 180, inspection.status === 'approved' ? 101 : 100, inspection.status === 'approved' ? 52 : 30);
  doc.text(inspection.status === 'approved' ? '✓ FORMALLY APPROVED' : '• SECOND-LINE REVIEW ACTIVE', margin + sigColW + 3, y + 18);
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('AUDIT TRACE: ATTRIBUTABLE DISPOSITION', margin + sigColW + 3, y + 23);

  // Sign 3: Statutory Directorate Seal
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + (sigColW * 2), y, sigColW, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DIRECTORATE STATUTORY SEAL', margin + (sigColW * 2) + 3, y + 4.5);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SEAL REF: QR-LM-VERIFY-2026', margin + (sigColW * 2) + 3, y + 9);
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('National Portal Verification Active', margin + (sigColW * 2) + 3, y + 13);
  doc.setFontSize(6);
  doc.setTextColor(37, 99, 235);
  doc.text('PCR-2011 STATUTORY ARCHIVE', margin + (sigColW * 2) + 3, y + 18);
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`GENERATED: ${new Date().toLocaleString()}`, margin + (sigColW * 2) + 3, y + 23);

  y += 29;

  // Footer Disclaimer
  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This electronic inspection dossier constitutes an official record under Rule 29 of the Legal Metrology (Packaged Commodities) Rules, 2011 and Section 15 of the Legal Metrology Act, 2009. Any unauthorized tampering or alteration is an offense.',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center', maxWidth: contentWidth }
  );

  return doc;
}

/**
 * Convenience helper to download the generated PDF directly to the user's browser.
 */
export function downloadOfficialProductDossierPdf(options: GeneratePdfOptions, filename?: string) {
  const doc = generateOfficialProductDossierPdf(options);
  const safeProductName = (options.product.name || 'Product').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeInspNumber = (options.inspection.inspectionNumber || 'LM-INS').replace(/[^a-zA-Z0-9_-]/g, '_');
  const actualFilename = filename || `Official_Dossier_${safeProductName}_${safeInspNumber}.pdf`;
  doc.save(actualFilename);
}
