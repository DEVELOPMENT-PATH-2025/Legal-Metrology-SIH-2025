import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Eye, 
  Check, 
  Layers, 
  Tag, 
  Building, 
  Calendar, 
  Scale, 
  Zap,
  ChevronRight,
  Maximize2,
  FileText
} from 'lucide-react';
import { 
  identifyProductFromImage, 
  IdentifiedProductData, 
  SAMPLE_PACKAGES, 
  SamplePackagingItem 
} from '../services/aiVisionService';

interface ProductAiScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProductData: (data: IdentifiedProductData, imageBase64: string) => void;
  title?: string;
}

export const ProductAiScanner: React.FC<ProductAiScannerProps> = ({
  isOpen,
  onClose,
  onApplyProductData,
  title = 'AI Packaging Scanner & Product Identifier'
}) => {
  const [mode, setMode] = useState<'webcam' | 'upload' | 'samples'>('webcam');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<IdentifiedProductData | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when in webcam mode and modal is open
  useEffect(() => {
    if (isOpen && mode === 'webcam' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode, capturedImage]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Play error:', e));
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('WebCam access error:', err);
      setIsCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser or use the "Upload Photo" or "Sample Catalog" tabs.'
          : 'Unable to start camera stream. You can upload an image or select a sample package to test instantly.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Toggle between back and front camera
  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from webcam video stream
  const captureWebcamFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
    processImageForIdentification(dataUrl);
  };

  // Handle uploaded file from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);
      processImageForIdentification(base64);
    };
    reader.readAsDataURL(file);
  };

  // Select sample packaging item
  const handleSelectSample = (sample: SamplePackagingItem) => {
    setCapturedImage(sample.previewUrl);
    processImageForIdentification(sample.previewUrl);
  };

  // Process image using AI Identification engine
  const processImageForIdentification = async (imageBase64: string) => {
    setIsScanning(true);
    setExtractedData(null);
    try {
      const data = await identifyProductFromImage(imageBase64);
      setExtractedData(data);
    } catch (err) {
      console.error('Error running AI identification:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Reset to retake
  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedData(null);
    if (mode === 'webcam') {
      startCamera();
    }
  };

  // Confirm and apply real data
  const handleConfirmApply = () => {
    if (!extractedData || !capturedImage) return;
    onApplyProductData(extractedData, capturedImage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-900/60 text-blue-300 border border-blue-700">
                  REAL AI VISION
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Identify mandatory Rule 6 packaging declarations & commodity metrics without manual typing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Selector (WebCam, Upload Image, Preset Packaging) */}
        {!capturedImage && (
          <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-semibold text-center bg-slate-900/60 shrink-0">
            <button
              onClick={() => setMode('webcam')}
              className={`py-3 transition-colors flex items-center justify-center space-x-2 ${
                mode === 'webcam'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live WebCam</span>
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`py-3 transition-colors flex items-center justify-center space-x-2 ${
                mode === 'upload'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>
            <button
              onClick={() => setMode('samples')}
              className={`py-3 transition-colors flex items-center justify-center space-x-2 ${
                mode === 'samples'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Statutory Samples</span>
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* STATE 1: Capturing or Selecting */}
          {!capturedImage && (
            <div>
              {/* WebCam Viewfinder */}
              {mode === 'webcam' && (
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="p-6 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-200">{cameraError}</p>
                      <div className="flex justify-center space-x-3 pt-2">
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                        >
                          Retry Camera Access
                        </button>
                        <button
                          onClick={() => setMode('upload')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                        >
                          Switch to Image Upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Statutory Viewfinder Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                        <div className="w-full h-full max-w-md max-h-64 border-2 border-dashed border-blue-400/80 rounded-xl relative flex flex-col justify-between p-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] uppercase font-mono bg-blue-600/90 text-white px-2 py-0.5 rounded font-bold">
                              PCR-2011 Viewfinder
                            </span>
                            <span className="text-[10px] font-mono text-blue-300">
                              Align Packaging Label
                            </span>
                          </div>
                          
                          <div className="text-center">
                            <span className="text-xs bg-slate-950/70 text-slate-300 px-3 py-1 rounded-full backdrop-blur-sm">
                              Center MRP, Net Qty & Manufacturer stamp
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Camera Controls Bar */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-4">
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-sm transition-transform active:scale-95"
                          title="Switch Camera (Front / Back)"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={captureWebcamFrame}
                          disabled={!isCameraActive}
                          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl flex items-center space-x-2 transition-transform active:scale-95 disabled:opacity-50"
                        >
                          <Camera className="w-5 h-5" />
                          <span>Capture Packaging Photo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Image View */}
              {mode === 'upload' && (
                <div className="p-8 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl text-center space-y-4 bg-slate-950/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Upload Packaging Photo or Label</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Supports high-resolution JPEG, PNG, or WEBP photos taken from field phones or digital scales.
                    </p>
                  </div>
                  <label className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow transition-all">
                    <Camera className="w-4 h-4" />
                    <span>Choose Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Statutory Samples Catalog */}
              {mode === 'samples' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Test the real packaging identification engine instantly using official legal metrology pre-packaged commodities:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SAMPLE_PACKAGES.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        className="p-3 bg-slate-950 border border-slate-800 hover:border-blue-500/80 rounded-xl cursor-pointer transition-all flex items-center space-x-3 group"
                      >
                        <img
                          src={sample.previewUrl}
                          alt={sample.name}
                          className="w-16 h-16 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-blue-400 truncate">
                              {sample.name}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0 ml-1">
                              ₹ {sample.expectedData.mrp.toFixed(2)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {sample.brand} • {sample.expectedData.netQuantity}
                          </span>
                          <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {sample.description}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: Image Captured & AI Identification in Progress or Complete */}
          {capturedImage && (
            <div className="space-y-6">
              
              {/* Top Banner: Captured Preview + Identification State */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                
                {/* Captured Photo Card */}
                <div className="md:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-2 relative group">
                  <img
                    src={capturedImage}
                    alt="Packaging Evidence Capture"
                    className="w-full aspect-video md:aspect-square object-cover rounded-lg"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">Captured Packaging</span>
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retake / Change</span>
                    </button>
                  </div>
                </div>

                {/* Right: AI Analysis Status */}
                <div className="md:col-span-8 space-y-3">
                  {isScanning ? (
                    <div className="p-8 border border-blue-500/40 bg-blue-950/20 rounded-xl text-center space-y-3">
                      <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Analyzing Packaging Panel via AI Vision...</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Extracting Rule 6 declarations, MRP stamp, Net Quantity, and Manufacturer details.
                        </p>
                      </div>
                    </div>
                  ) : extractedData ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-bold text-white">Product Identified Successfully</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">
                          Confidence {(extractedData.confidenceScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/80">
                        Real commodity parameters detected from packaging image. You can apply these directly to the inspection dossier without manual typing.
                      </p>
                    </div>
                  ) : null}

                  {/* Quick Stat Highlight Pills */}
                  {extractedData && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px] font-mono">NET QUANTITY</span>
                        <strong className="text-white text-sm">{extractedData.netQuantity}</strong>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px] font-mono">RETAIL PRICE (MRP)</span>
                        <strong className="text-emerald-400 text-sm">₹ {extractedData.mrp.toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px] font-mono">UNIT SALE PRICE</span>
                        <strong className="text-blue-300 text-sm">{extractedData.unitSalePrice}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Extracted Real Data Fields Table */}
              {extractedData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" />
                      <span>Extracted Statutory Declarations (PCR 2011)</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      All fields populated from image
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">Commodity Name</span>
                      <strong className="text-white text-sm">{extractedData.productName}</strong>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">Brand & Category</span>
                      <span className="text-slate-200 font-medium">{extractedData.brand} ({extractedData.category})</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">Month & Year of Packing</span>
                      <span className="text-slate-200 font-mono font-medium">{extractedData.monthYearOfManufacture}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">Batch / Lot Identifier</span>
                      <span className="text-slate-200 font-mono">{extractedData.batchNumber}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 sm:col-span-2">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">Manufacturer / Packer</span>
                      <strong className="text-slate-100 block">{extractedData.manufacturerName}</strong>
                      <span className="text-slate-400 text-[11px] block mt-0.5">{extractedData.manufacturerAddress}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 sm:col-span-2">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">Consumer Care & Origin</span>
                      <span className="text-slate-300 block">{extractedData.consumerCareDetails}</span>
                      <span className="text-slate-500 text-[10px] block mt-0.5">Country of Origin: {extractedData.countryOfOrigin}</span>
                    </div>
                  </div>

                  {/* Statutory Flags */}
                  {extractedData.statutoryFlags && extractedData.statutoryFlags.length > 0 && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-blue-400 font-bold block">
                        Statutory Rule Observations:
                      </span>
                      {extractedData.statutoryFlags.map((flag, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          {extractedData && capturedImage && (
            <button
              id="apply-identified-product-btn"
              type="button"
              onClick={handleConfirmApply}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Real Data to Inspection Dossier</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
