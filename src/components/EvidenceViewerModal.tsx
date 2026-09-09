import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Camera,
  Calendar,
  Layers
} from 'lucide-react';
import { EvidenceItem } from '../types';

interface EvidenceViewerModalProps {
  evidence: EvidenceItem | null;
  onClose: () => void;
  onVerify?: (evidenceId: string) => void;
}

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
  evidence,
  onClose,
  onVerify
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!evidence) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm text-white">{evidence.title}</span>
            <span className="text-xs text-slate-400 font-mono">({evidence.id})</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Verification status pill */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
              evidence.verificationStatus === 'inspector_verified'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                : 'bg-amber-950/60 text-amber-300 border-amber-700'
            }`}>
              {evidence.verificationStatus === 'inspector_verified' ? 'Inspector Verified' : 'AI Extracted'}
            </span>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
              <span>Zoom +</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
              <span>Zoom -</span>
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 rounded hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="Reset View"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-slate-400">
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <span>Rotation: {rotation}°</span>
          </div>
        </div>

        {/* Viewer Body: Dual Split View (Photo + Extracted OCR Declarations) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-0 min-h-[400px]">
          
          {/* Main Visual Stage */}
          <div className="md:col-span-2 bg-slate-950 flex items-center justify-center overflow-auto p-4 relative">
            <div 
              className="transition-transform duration-200 origin-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`
              }}
            >
              <img
                src={evidence.imageUrl}
                alt={evidence.title}
                className="max-h-[60vh] max-w-full rounded shadow-xl border border-slate-800 object-contain"
              />
            </div>
          </div>

          {/* Side Context & OCR Panel */}
          <div className="bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Evidence Details
              </h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Quality:</span>
                  <span className="font-semibold capitalize text-white">{evidence.imageQuality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Captured:</span>
                  <span className="font-mono text-slate-300">{new Date(evidence.capturedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OCR Confidence:</span>
                  <span className="font-bold text-emerald-400">{Math.round((evidence.ocrConfidence || 0.95) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Extracted Structured Fields */}
            {evidence.ocrFields && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Detected Packaging Declarations
                </h4>
                <div className="bg-slate-800/80 rounded-lg p-3 space-y-2 border border-slate-700 text-xs">
                  {evidence.ocrFields.mrp && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">MAX RETAIL PRICE</span>
                      <span className="font-bold text-emerald-300">₹ {evidence.ocrFields.mrp}</span>
                    </div>
                  )}
                  {evidence.ocrFields.netQuantity && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">NET QUANTITY</span>
                      <span className="font-bold text-white">{evidence.ocrFields.netQuantity}</span>
                    </div>
                  )}
                  {evidence.ocrFields.mfgDate && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">DATE OF PACKING</span>
                      <span className="font-medium text-slate-200">{evidence.ocrFields.mfgDate}</span>
                    </div>
                  )}
                  {evidence.ocrFields.manufacturer && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">MANUFACTURER</span>
                      <span className="text-slate-300">{evidence.ocrFields.manufacturer}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raw OCR Stream */}
            {evidence.ocrRawText && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span>Raw OCR Transcript</span>
                </h4>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {evidence.ocrRawText}
                </div>
              </div>
            )}

            {/* Verification Action */}
            {onVerify && evidence.verificationStatus !== 'inspector_verified' && (
              <button
                onClick={() => onVerify(evidence.id)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Evidence & Accept OCR</span>
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
