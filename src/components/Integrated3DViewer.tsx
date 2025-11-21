import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Download } from 'lucide-react';

// Lazy load ModelViewer to improve initial load time
const ModelViewer = lazy(() => import('./ModelViewer'));

interface Integrated3DViewerProps {
  design: any; // The design object from the workflow
  onClose: () => void; // Function to close the 3D viewer and return to grid
  onMakeOrder: (designId: string, modelUrl: string) => void;
  onDownload: (designId: string, modelUrl: string) => void;
  showLeftPane?: boolean; // Whether to show the left control pane (for desktop)
  lighting?: number; // External lighting control
  background?: number; // External background control
  size?: number; // External size control
  cameraAngle?: number; // External camera angle control
}

export default function Integrated3DViewer({ 
  design, 
  onClose, 
  onMakeOrder, 
  onDownload,
  showLeftPane = true,
  lighting: externalLighting,
  background: externalBackground,
  size: externalSize,
  cameraAngle: externalCameraAngle
}: Integrated3DViewerProps) {
  // Control states - use external values if provided, otherwise internal state
  const [lighting, setLighting] = useState(externalLighting ?? 30);
  const [background, setBackground] = useState(externalBackground ?? 0);
  const [size, setSize] = useState(externalSize ?? 50);
  const [cameraAngle, setCameraAngle] = useState(externalCameraAngle ?? 50);

  // Use external values when provided
  const actualLighting = externalLighting ?? lighting;
  const actualBackground = externalBackground ?? background;
  const actualSize = externalSize ?? size;
  const actualCameraAngle = externalCameraAngle ?? cameraAngle;
  
  // Model loading states
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoized helper function to get valid model URL - prioritize GLB files
  const getValidModelUrl = useCallback(() => {
    if (!design) return null;
    
    // Prioritize GLB files first, then other formats
    const urls = [
      design.modelFiles?.storedModelUrl,
      design.modelFiles?.modelFile,
      design.modelFiles?.gaussianPly,
      design.modelFiles?.glb,
      design.modelFiles?.gltf
    ].filter(Boolean);
    
    // Sort URLs to prioritize GLB files
    const sortedUrls = urls.sort((a, b) => {
      const aIsGlb = a.toLowerCase().includes('.glb');
      const bIsGlb = b.toLowerCase().includes('.glb');
      if (aIsGlb && !bIsGlb) return -1;
      if (!aIsGlb && bIsGlb) return 1;
      return 0;
    });
    
    // Find the first valid URL
    for (const url of sortedUrls) {
      if (url && typeof url === 'string' && url.trim() !== '') {
        try {
          new URL(url);
          return url;
        } catch {
          if (url.startsWith('/') || url.startsWith('./') || url.startsWith('data:')) {
            return url;
          }
        }
      }
    }
    
    return null;
  }, [design]);

  // Memoized model URL to prevent unnecessary re-renders
  const modelUrl = useMemo(() => getValidModelUrl(), [getValidModelUrl]);
  
  // Memoized test model URL with fallback
  const testModelUrl = useMemo(() => 
    modelUrl || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Cube/glTF-Binary/Cube.glb',
    [modelUrl]
  );

  // Memoized event handlers
  const handleModelError = useCallback((error: string) => {
    setModelLoadError(error);
  }, []);

  const handleMakeOrder = useCallback(() => {
    if (design?.id && testModelUrl) {
      onMakeOrder(design.id, testModelUrl);
    }
  }, [design, testModelUrl, onMakeOrder]);

  const handleDownload = useCallback(() => {
    if (design?.id && modelUrl) {
      onDownload(design.id, modelUrl);
    }
  }, [design, modelUrl, onDownload]);

  // Mobile View
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col bg-[#1a1a1a] rounded-[32px] overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-[#2a2a2a]">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-white font-medium">3D Preview</h3>
          <button
            onClick={handleDownload}
            disabled={!modelUrl}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 3D Model Viewer */}
        <div className="flex-1 p-4">
          {testModelUrl && !modelLoadError ? (
            <Suspense fallback={
              <div className="w-full h-full bg-[#2C2C2C] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#3a3a3a] border-t-[#E70D57] rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white/70 text-sm">Loading model...</p>
                </div>
              </div>
            }>
              <ModelViewer
                modelUrl={testModelUrl}
                className="w-full h-full rounded-lg"
                lighting={lighting}
                background={background}
                size={size}
                cameraAngle={cameraAngle}
                onError={handleModelError}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
              <div className="text-center text-white p-4">
                <div className="w-16 h-16 bg-red-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Model Loading Failed</h3>
                <p className="text-sm text-gray-300 mb-4">{modelLoadError || 'Unable to load 3D model'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="p-4 bg-[#2a2a2a] space-y-4">
          {/* Quick Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 mb-1 block">Lighting</label>
              <input
                type="range"
                min="0"
                max="100"
                value={lighting}
                onChange={(e) => setLighting(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 mb-1 block">Size</label>
              <input
                type="range"
                min="0"
                max="100"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleMakeOrder}
            className="w-full py-3 bg-[#E70D57] hover:bg-[#d10c50] text-white rounded-full font-medium transition-colors"
          >
            Make Order
          </button>
        </div>
      </div>
    );
  }

  // If showLeftPane is false, only return the model viewer
  if (!showLeftPane) {
    return (
      <div className="w-full h-full">
        {testModelUrl && !modelLoadError ? (
          <Suspense fallback={
            <div className="w-full h-full bg-[#2C2C2C] rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#3a3a3a] border-t-[#E70D57] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/70 text-sm">Loading 3D model...</p>
              </div>
            </div>
          }>
            <ModelViewer
              modelUrl={testModelUrl}
              className="w-full h-full rounded-lg"
              lighting={actualLighting}
              background={actualBackground}
              size={actualSize}
              cameraAngle={actualCameraAngle}
              onError={handleModelError}
            />
          </Suspense>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-red-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Model Loading Failed</h3>
              <p className="text-sm text-gray-300 mb-4">{modelLoadError || 'Unable to load 3D model'}</p>
              
              {design.images && design.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Generated from:</p>
                  <img 
                    src={design.images.find((img: any) => img.selected)?.url || design.images[0]?.url} 
                    alt="Original design" 
                    className="w-24 h-24 object-cover rounded-lg mx-auto border-2 border-gray-600"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop View with full layout
  return (
    <div className="w-full h-full flex bg-[#1a1a1a] rounded-[32px] overflow-hidden">
      {/* 3D Model Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-[#2a2a2a]">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Images
          </button>
          <h3 className="text-white text-lg font-medium">3D Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!modelUrl}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 3D Model Viewer */}
        <div className="flex-1 p-6">
          {testModelUrl && !modelLoadError ? (
            <Suspense fallback={
              <div className="w-full h-full bg-[#2C2C2C] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#3a3a3a] border-t-[#E70D57] rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white/70 text-sm">Loading 3D model...</p>
                </div>
              </div>
            }>
              <ModelViewer
                modelUrl={testModelUrl}
                className="w-full h-full rounded-lg"
                lighting={lighting}
                background={background}
                size={size}
                cameraAngle={cameraAngle}
                onError={handleModelError}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-red-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Model Loading Failed</h3>
                <p className="text-sm text-gray-300 mb-4">{modelLoadError || 'Unable to load 3D model'}</p>
                
                {design.images && design.images.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Generated from:</p>
                    <img 
                      src={design.images.find((img: any) => img.selected)?.url || design.images[0]?.url} 
                      alt="Original design" 
                      className="w-24 h-24 object-cover rounded-lg mx-auto border-2 border-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-6 bg-[#2a2a2a] flex justify-center gap-4">
          <button 
            onClick={handleDownload}
            disabled={!modelUrl}
            className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Download
          </button>
          <button 
            onClick={handleMakeOrder}
            className="px-8 py-3 bg-[#E70D57] hover:bg-[#d10c50] text-white rounded-full font-medium transition-colors"
          >
            Make Order
          </button>
        </div>
      </div>

      {/* Right Control Panel */}
      <div className="w-80 bg-[#313131] p-6 flex flex-col">
        <h4 className="text-white text-lg font-medium mb-6">Adjust Model</h4>
        
        <div className="space-y-6 flex-1">
          {/* Lighting Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/90 text-sm font-medium">Lighting</span>
              <span className="text-white text-xs bg-white/15 px-2 py-1 rounded-md">{lighting}%</span>
            </div>
            <div className="relative h-2">
              <div className="absolute inset-0 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-0 h-2 bg-[#E70D57] rounded-full pointer-events-none"
                style={{ width: `${lighting}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                value={lighting}
                onChange={(e) => setLighting(Number(e.target.value))}
                className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer"
              />
              <div 
                className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-y-1/2 pointer-events-none border-2 border-gray-200"
                style={{ left: `calc(${lighting}% - 10px)` }}
              ></div>
            </div>
          </div>

          {/* Background Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/90 text-sm font-medium">Background</span>
              <span className="text-white text-xs bg-white/15 px-2 py-1 rounded-md">{background}%</span>
            </div>
            <div className="relative h-2">
              <div className="absolute inset-0 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-0 h-2 bg-[#E70D57] rounded-full pointer-events-none"
                style={{ width: `${background}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                value={background}
                onChange={(e) => setBackground(Number(e.target.value))}
                className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer"
              />
              <div 
                className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-y-1/2 pointer-events-none border-2 border-gray-200"
                style={{ left: `calc(${background}% - 10px)` }}
              ></div>
            </div>
          </div>

          {/* Size Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/90 text-sm font-medium">Size</span>
              <span className="text-white text-xs bg-white/15 px-2 py-1 rounded-md">{Math.round(size * 0.8)}</span>
            </div>
            <div className="relative h-2">
              <div className="absolute inset-0 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-0 h-2 bg-[#E70D57] rounded-full pointer-events-none"
                style={{ width: `${size}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer"
              />
              <div 
                className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-y-1/2 pointer-events-none border-2 border-gray-200"
                style={{ left: `calc(${size}% - 10px)` }}
              ></div>
            </div>
          </div>

          {/* Camera Angle Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/90 text-sm font-medium">Camera Angle</span>
              <span className="text-white text-xs bg-white/15 px-2 py-1 rounded-md">{cameraAngle}°</span>
            </div>
            <div className="relative h-2">
              <div className="absolute inset-0 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-0 h-2 bg-[#E70D57] rounded-full pointer-events-none"
                style={{ width: `${cameraAngle}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                value={cameraAngle}
                onChange={(e) => setCameraAngle(Number(e.target.value))}
                className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer"
              />
              <div 
                className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-y-1/2 pointer-events-none border-2 border-gray-200"
                style={{ left: `calc(${cameraAngle}% - 10px)` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button className="w-full py-3 bg-gradient-to-r from-[#575757] to-[#676767] hover:from-[#676767] hover:to-[#575757] text-white font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg mt-6">
          Save to Draft
        </button>
      </div>

      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          outline: none;
        }
        
        input[type="range"]::-webkit-slider-track {
          background: transparent;
          height: 8px;
          border: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 0;
          width: 0;
          background: transparent;
          cursor: pointer;
          border: none;
        }
        
        input[type="range"]::-moz-range-track {
          background: transparent;
          height: 8px;
          border: none;
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 0;
          width: 0;
          background: transparent;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}