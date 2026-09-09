import React, { useState } from 'react';
import { 
  X, 
  Building, 
  FileText, 
  Scale, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  Camera,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Inspection, UserProfile } from '../types';
import { inspectionService } from '../services/inspectionService';
import { ProductAiScanner } from './ProductAiScanner';
import { IdentifiedProductData } from '../services/aiVisionService';

interface CreateInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onCreated: (inspectionId: string) => void;
}

export const CreateInspectionModal: React.FC<CreateInspectionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCreated
}) => {
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [category, setCategory] = useState('Edible Oils & Fats');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [jurisdiction, setJurisdiction] = useState('Zone 4 - North Metrology Division');
  
  // First product details
  const [firstProductName, setFirstProductName] = useState('');
  const [firstProductBrand, setFirstProductBrand] = useState('');
  const [firstProductNetQty, setFirstProductNetQty] = useState('1 L');
  const [firstProductMRP, setFirstProductMRP] = useState('175');
  const [initialEvidenceImage, setInitialEvidenceImage] = useState<string | null>(null);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!isOpen) return null;

  const handleApplyScannedProduct = (data: IdentifiedProductData, imageBase64: string) => {
    setFirstProductName(data.productName);
    setFirstProductBrand(data.brand);
    setFirstProductNetQty(data.netQuantity);
    setFirstProductMRP(data.mrp.toString());
    setCategory(data.category || category);
    setInitialEvidenceImage(imageBase64);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    const newInsp = await inspectionService.createInspection({
      inspectionNumber: `LM-INS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      businessName: businessName.trim(),
      businessAddress: businessAddress.trim() || 'Sector 18 Commercial Complex, Zone 4',
      category,
      licenseNumber: licenseNumber.trim() || `DL-LM-${Math.floor(10000 + Math.random() * 90000)}`,
      jurisdiction,
      status: 'in_progress',
      inspectorId: currentUser.uid,
      inspectorName: currentUser.displayName,
      complianceOutcome: 'pending',
      scheduledDate: new Date().toISOString().split('T')[0]
    });

    // If initial product provided, add it
    if (firstProductName.trim()) {
      const addedProduct = await inspectionService.addProduct(newInsp.id, {
        name: firstProductName.trim(),
        brand: firstProductBrand.trim() || 'Commercial Standard Brand',
        netQuantity: firstProductNetQty.trim() || '1 L',
        mrp: parseFloat(firstProductMRP) || 150
      });

      // If packaging photo was captured via scanner, attach as evidence right away!
      if (initialEvidenceImage && addedProduct?.id) {
        await inspectionService.addEvidence(newInsp.id, addedProduct.id, {
          title: `Initial Packaging Scan - ${firstProductName}`,
          imageUrl: initialEvidenceImage,
          ocrRawText: `LEGAL METROLOGY SCAN: ${firstProductBrand} - ${firstProductName} • NET QTY: ${firstProductNetQty} • MRP: ₹ ${firstProductMRP}`,
          ocrConfidence: 0.98,
          verificationStatus: 'inspector_verified',
          imageQuality: 'high'
        });
      }
    }

    onCreated(newInsp.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
          
          {/* Header */}
          <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Initiate Field Inspection</h2>
                <p className="text-xs text-slate-400">Legal Metrology Packaged Commodities Docket</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Target Establishment / Business Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Hypermarket & Logistics Hub"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Premises Address
              </label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="e.g. Plot 44, Industrial Area Phase II"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Commodity Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="Edible Oils & Fats">Edible Oils & Fats</option>
                  <option value="Packaged Food Grains">Packaged Food Grains</option>
                  <option value="Beverages & Dairy">Beverages & Dairy</option>
                  <option value="Personal Care & Hygiene">Personal Care & Hygiene</option>
                  <option value="Packaged Industrial Goods">Packaged Industrial Goods</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Trading / Metrology License No.
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. DL-LM-98231"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            {/* Initial Commodity in Scope */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Primary Inspected Commodity in Scope
                </span>
                
                {/* Zero Typing WebCam / Image Auto-Fill Button */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-bold transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan via WebCam / Photo</span>
                </button>
              </div>

              {initialEvidenceImage && (
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-200 text-xs">Packaging auto-filled from live scan!</span>
                  </div>
                  <img src={initialEvidenceImage} alt="Preview" className="w-8 h-8 object-cover rounded" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={firstProductName}
                    onChange={(e) => setFirstProductName(e.target.value)}
                    placeholder="e.g. Cold Pressed Sesame Oil"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Brand</label>
                  <input
                    type="text"
                    value={firstProductBrand}
                    onChange={(e) => setFirstProductBrand(e.target.value)}
                    placeholder="e.g. PureHealth Organics"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Declared Net Quantity</label>
                  <input
                    type="text"
                    value={firstProductNetQty}
                    onChange={(e) => setFirstProductNetQty(e.target.value)}
                    placeholder="e.g. 1 L or 500 ml"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Declared MRP (₹)</label>
                  <input
                    type="number"
                    value={firstProductMRP}
                    onChange={(e) => setFirstProductMRP(e.target.value)}
                    placeholder="240"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow"
              >
                <span>Create Inspection Docket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* AI Packaging Scanner Modal */}
      <ProductAiScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyProductData={handleApplyScannedProduct}
        title="Scan Packaging to Auto-Fill Commodity Details"
      />
    </>
  );
};
