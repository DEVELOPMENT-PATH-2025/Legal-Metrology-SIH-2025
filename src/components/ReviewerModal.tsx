import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw, 
  AlertTriangle,
  FileCheck,
  Building,
  Boxes,
  Camera
} from 'lucide-react';
import { Inspection, Product } from '../types';

interface ReviewerModalProps {
  inspection: Inspection;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (decision: 'approved' | 'returned', comments: string) => void;
}

export const ReviewerModal: React.FC<ReviewerModalProps> = ({
  inspection,
  products,
  isOpen,
  onClose,
  onSubmitReview
}) => {
  const [decision, setDecision] = useState<'approved' | 'returned'>('approved');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Please provide attributable review comments/findings for the statutory record.');
      return;
    }
    onSubmitReview(decision, comments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Reviewer Disposition Assessment</h2>
              <p className="text-xs text-slate-400">Statutory Controller Quality Review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Inspection Summary Review Card */}
          <div className="bg-slate-800/60 rounded-lg p-3.5 border border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Dossier Number:</span>
              <span className="font-mono font-bold text-white">{inspection.inspectionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Business:</span>
              <span className="font-medium text-white">{inspection.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Products in Scope:</span>
              <span className="font-bold text-blue-400">{products.length} Products ({inspection.evidenceCount} photos)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Submitting Inspector:</span>
              <span className="text-slate-200">{inspection.inspectorName}</span>
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Controller Determination
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="reviewer-decision-approve"
                onClick={() => {
                  setDecision('approved');
                  if (!comments) setComments('Dossier inspected and verified against certified standard check-weights. Packaging declarations and tolerances found in order.');
                }}
                className={`p-3 rounded-lg border text-left flex items-start space-x-3 transition-colors ${
                  decision === 'approved'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${decision === 'approved' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <span className="block text-xs font-bold">Approve Dossier</span>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">Certify compliance and issue final report</span>
                </div>
              </button>

              <button
                type="button"
                id="reviewer-decision-return"
                onClick={() => {
                  setDecision('returned');
                  if (!comments) setComments('Evidence insufficient for net quantity verification. Inspector must re-capture high-resolution display panel and provide certified tare weight.');
                }}
                className={`p-3 rounded-lg border text-left flex items-start space-x-3 transition-colors ${
                  decision === 'returned'
                    ? 'bg-rose-950/40 border-rose-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <RotateCcw className={`w-5 h-5 shrink-0 mt-0.5 ${decision === 'returned' ? 'text-rose-400' : 'text-slate-500'}`} />
                <div>
                  <span className="block text-xs font-bold">Return for Correction</span>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">Send back to inspector with required actions</span>
                </div>
              </button>
            </div>
          </div>

          {/* Attributable Reviewer Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Official Review Remarks / Order
            </label>
            <textarea
              id="reviewer-comments-input"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter specific statutory rationale, observations, or instructions for field officer..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              id="reviewer-submit-action-btn"
              type="submit"
              className={`px-5 py-2 rounded-lg text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-md ${
                decision === 'approved' 
                  ? 'bg-emerald-600 hover:bg-emerald-500' 
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Record Official Decision</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
