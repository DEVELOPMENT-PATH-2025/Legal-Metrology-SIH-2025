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
  Tag, 
  Building, 
  Calendar, 
  Scale, 
  Zap,
  Edit3,
  FileText,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  identifyProductFromImage, 
  IdentifiedProductData 
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
  const [mode, setMode] = useState<'webcam' | 'upload'>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<IdentifiedProductData | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    // First: check environment variable (set in .env as VITE_GEMINI_API_KEY)
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
    if (envKey && envKey.trim() && envKey !== 'YOUR_GEMINI_API_KEY') return envKey.trim();
    // Second: check localStorage (user-entered key)
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  const [showKeyPanel, setShowKeyPanel] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    const trimmed = keyInput.trim();
    setGeminiApiKey(trimmed);
    if (typeof localStorage !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    }
    setKeySaveMessage(trimmed ? 'API Key saved! Gemini Multimodal AI vision is now active.' : 'API Key removed. Using built-in OCR engine.');
    setTimeout(() => {
      setKeySaveMessage(null);
      if (trimmed) setShowKeyPanel(false);
    }, 2000);
  };

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
          ? 'Camera permission was denied. Please allow camera access in your browser or use the "Upload Photo" tab.'
          : 'Unable to start camera stream. Please use the "Upload Photo" tab to upload a packaging image.'
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

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCapturedImage(base64);
        processImageForIdentification(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process image using AI Identification engine
  const processImageForIdentification = async (imageBase64: string) => {
    setIsScanning(true);
    setExtractedData(null);
    try {
      const data = await identifyProductFromImage(imageBase64, geminiApiKey);
      setExtractedData(data);
    } catch (err) {
      console.error('Error running AI identification:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Field change handler for user verification
  const handleFieldChange = (field: keyof IdentifiedProductData, value: any) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      [field]: value
    });
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
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
                  MULTIMODAL AI OCR
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload or capture real product packaging to extract and verify statutory declarations
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

        {/* AI Vision Engine Status & Gemini Key Configuration Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            {geminiApiKey ? (
              <span className="text-slate-300">
                AI Vision Engine: <strong className="text-emerald-400">Gemini Vision Connected — Accurate Extraction Active</strong>
              </span>
            ) : (
              <span className="text-slate-300">
                AI Vision Engine: <strong className="text-amber-400">Tesseract OCR Active</strong>
                <span className="text-slate-500 ml-1">(Connect Gemini for accurate MRP/label reading)</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowKeyPanel(!showKeyPanel)}
            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-semibold hover:underline"
          >
            <Key className="w-3 h-3" />
            <span>{geminiApiKey ? 'Change AI Key' : '+ Connect Gemini API Key'}</span>
            {showKeyPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Gemini Key Panel */}
        {showKeyPanel && (
          <div className="bg-slate-800/95 border-b border-slate-700 px-6 py-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Google AI Studio (Gemini) API Key — Required for Accurate Extraction</span>
              </label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 hover:underline"
              >
                <span>Get Free Key at Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Paste your AIzaSy... key here"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-colors shrink-0"
              >
                Save & Activate
              </button>
            </div>
            {keySaveMessage && (
              <p className="text-[11px] text-emerald-400 font-semibold">{keySaveMessage}</p>
            )}
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <strong className="text-amber-300">Why required:</strong> Gemini Vision reads the real MRP, brand, net quantity, and manufacturer details directly from the label image with ~99% accuracy. Without it, Tesseract OCR is used which works best on clear, high-contrast text but may miss stylized prices or handwritten stickers.
            </p>
          </div>
        )}

        {/* No API Key Warning Banner — shown when no key and not in key panel */}
        {!geminiApiKey && !showKeyPanel && (
          <div className="bg-amber-950/40 border-b border-amber-800/50 px-6 py-2 flex items-center justify-between text-xs shrink-0">
            <span className="text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              For accurate MRP & label data extraction, connect a Gemini API key.
            </span>
            <button
              type="button"
              onClick={() => setShowKeyPanel(true)}
              className="text-amber-400 hover:text-amber-300 font-bold hover:underline text-[11px]"
            >
              Connect Now →
            </button>
          </div>
        )}

        {/* Source Mode Selector (Upload Image or WebCam) */}
        {!capturedImage && (
          <div className="grid grid-cols-2 border-b border-slate-800 text-xs font-semibold text-center bg-slate-900/60 shrink-0">
            <button
              onClick={() => setMode('upload')}
              className={`py-3 transition-colors flex items-center justify-center space-x-2 ${
                mode === 'upload'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Packaging Photo</span>
            </button>
            <button
              onClick={() => setMode('webcam')}
              className={`py-3 transition-colors flex items-center justify-center space-x-2 ${
                mode === 'webcam'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live WebCam Stream</span>
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* STATE 1: Capturing or Selecting */}
          {!capturedImage && (
            <div>
              {/* Upload Image View (Default) */}
              {mode === 'upload' && (
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`p-10 border-2 border-dashed rounded-2xl text-center space-y-4 transition-all ${
                    isDragging 
                      ? 'border-blue-400 bg-blue-950/40 scale-[1.01]' 
                      : 'border-slate-700 hover:border-blue-500 bg-slate-950/40'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Select or Drag & Drop Real Packaging Photo</h4>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                      Upload an authentic photo of the front, MRP, or manufacturing declaration panel. The AI multimodal vision engine will read the real text.
                    </p>
                  </div>
                  <div className="pt-2">
                    <label className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg transition-all">
                      <Camera className="w-4 h-4" />
                      <span>Browse Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

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
                    className="w-full aspect-video md:aspect-square object-contain bg-slate-900 rounded-lg"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">Real Field Capture</span>
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
                        <h4 className="text-sm font-bold text-white">Analyzing Real Packaging Image via AI Vision...</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Reading text, MRP, net quantity, batch numbers, and manufacturer declarations.
                        </p>
                      </div>
                    </div>
                  ) : extractedData ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-bold text-white">Extracted Packaging Declarations</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">
                          Confidence {(extractedData.confidenceScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/80">
                        Review and adjust any fields below before applying to the inspection docket.
                      </p>
                    </div>
                  ) : null}

                  {/* Quick Stat Highlight Pills */}
                  {extractedData && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px] font-mono">NET QUANTITY</span>
                        <strong className="text-white text-sm">{extractedData.netQuantity || 'Pending'}</strong>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px] font-mono">RETAIL PRICE (MRP)</span>
                        <strong className="text-emerald-400 text-sm">₹ {Number(extractedData.mrp || 0).toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px] font-mono">UNIT SALE PRICE</span>
                        <strong className="text-blue-300 text-sm">{extractedData.unitSalePrice || '—'}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Real Data Fields Form */}
              {extractedData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Verify & Edit Extracted Details</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Editable for 100% accuracy
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-slate-400 text-[10px] block uppercase font-mono">Commodity / Product Name *</label>
                      <input
                        type="text"
                        value={extractedData.productName}
                        onChange={(e) => handleFieldChange('productName', e.target.value)}
                        placeholder="e.g. Pure Mustard Oil"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-slate-400 text-[10px] block uppercase font-mono">Brand Name</label>
                      <input
                        type="text"
                        value={extractedData.brand}
                        onChange={(e) => handleFieldChange('brand', e.target.value)}
                        placeholder="e.g. Fortune"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-slate-400 text-[10px] block uppercase font-mono">Declared Net Quantity *</label>
                      <input
                        type="text"
                        value={extractedData.netQuantity}
                        onChange={(e) => handleFieldChange('netQuantity', e.target.value)}
                        placeholder="e.g. 1 L or 500 g or 5 kg"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-slate-400 text-[10px] block uppercase font-mono">Maximum Retail Price (₹ MRP) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.mrp || ''}
                        onChange={(e) => handleFieldChange('mrp', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 175.00"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-slate-400 text-[10px] block uppercase font-mono">Month & Year of Packing (MM/YYYY)</label>
                      <input
                        type="text"
                        value={extractedData.monthYearOfManufacture}
                        onChange={(e) => handleFieldChange('monthYearOfManufacture', e.target.value)}
                        placeholder="e.g. 08/2026"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-slate-400 text-[10px] block uppercase font-mono">Batch / Lot Identifier</label>
                      <input
                        type="text"
                        value={extractedData.batchNumber}
                        onChange={(e) => handleFieldChange('batchNumber', e.target.value)}
                        placeholder="e.g. LOT-2026-B891"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 sm:col-span-2 space-y-1">
                      <label className="text-slate-400 text-[10px] block uppercase font-mono">Manufacturer / Packer Name & Address</label>
                      <input
                        type="text"
                        value={extractedData.manufacturerName}
                        onChange={(e) => handleFieldChange('manufacturerName', e.target.value)}
                        placeholder="e.g. Adani Wilmar Limited"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-blue-500 mb-1"
                      />
                      <input
                        type="text"
                        value={extractedData.manufacturerAddress}
                        onChange={(e) => handleFieldChange('manufacturerAddress', e.target.value)}
                        placeholder="e.g. Fortune House, Ahmedabad, Gujarat 380009"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 sm:col-span-2 space-y-1">
                      <label className="text-slate-400 text-[10px] block uppercase font-mono">Consumer Care Contact</label>
                      <input
                        type="text"
                        value={extractedData.consumerCareDetails}
                        onChange={(e) => handleFieldChange('consumerCareDetails', e.target.value)}
                        placeholder="e.g. 1800-233-9999 | care@brand.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
                      />
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
