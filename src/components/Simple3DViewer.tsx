import { useState, useCallback, Suspense, lazy } from 'react';

// Lazy load ModelViewer to improve initial load time
const ModelViewer = lazy(() => import('./ModelViewer'));

interface Simple3DViewerProps {
  design: any;
  lighting: number;
  background: number;
  size: number;
  cameraAngle: number;
}

export default function Simple3DViewer({ 
  design, 
  lighting, 
  background, 
  size, 
  cameraAngle 
}: Simple3DViewerProps) {
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

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

  const modelUrl = getValidModelUrl();
  const testModelUrl = modelUrl || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Cube/glTF-Binary/Cube.glb';

  const handleModelError = useCallback((error: string) => {
    setModelLoadError(error);
  }, []);

  return (
    <div className="w-full h-full">
      {testModelUrl && !modelLoadError ? (
        <Suspense fallback={
          <div className="w-full h-full bg-[#2C2C2C] rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                {/* Animated spinner */}
                <div className="w-16 h-16 border-4 border-[#3a3a3a] border-t-[#E70D57] rounded-full animate-spin mx-auto mb-4"></div>
              </div>
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
  );
}