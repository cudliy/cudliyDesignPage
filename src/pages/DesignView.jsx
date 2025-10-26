import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Upload, Download, Loader2 } from 'lucide-react';
import { testApiConnection } from '../utils/testApiConnection';

// Lazy load ModelViewer to improve initial load time
const ModelViewer = lazy(() => import('../components/ModelViewer'));

export default function DesignView() {
  const { designId } = useParams();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const navigate = useNavigate();
  
  // Control states - matching the image positions
  const [lighting, setLighting] = useState(30);
  const [background, setBackground] = useState(100);
  const [size, setSize] = useState(50);
  const [cameraAngle, setCameraAngle] = useState(50);
  
  // Model loading states - must be at top level
  const [modelLoadError, setModelLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Memoized helper function to get valid model URL - prioritize GLB files
  const getValidModelUrl = useCallback(() => {
    if (!design) return null;
    
    // Prioritize GLB files first, then other formats
    const urls = [
      design.modelFiles?.storedModelUrl,
      design.modelFiles?.modelFile,
      design.modelFiles?.gaussianPly,
      // Look for GLB files specifically
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
  
  // Check if model-viewer is available and test API connection
  useEffect(() => {
    // Test API connection
    testApiConnection();
  }, []);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleModelError = useCallback((error) => {
    setModelLoadError(error);
  }, []);

  const handleRetryModel = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setModelLoadError(null);
      // Force re-render of ModelViewer by updating a state
      setLighting(prev => prev);
    } else {
      // If max retries reached, try regenerating the model
      handleRegenerateModel();
    }
  }, [retryCount, maxRetries]);

  // Optimized data fetching with better error handling and caching
  useEffect(() => {
    if (!designId) return;

    let isCancelled = false;

    const fetchDesign = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check cache first
        const cacheKey = `design_${designId}`;
        const cachedDesign = sessionStorage.getItem(cacheKey);
        const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
        
        // Use cache if less than 5 minutes old
        if (cachedDesign && cacheTimestamp) {
          const cacheAge = Date.now() - parseInt(cacheTimestamp);
          if (cacheAge < 5 * 60 * 1000) {
            setDesign(JSON.parse(cachedDesign));
            setLoading(false);
            return;
          }
        }
        
        const response = await apiService.getDesign(designId);
        
        if (!isCancelled) {
          if (response.success && response.data) {
            setDesign(response.data);
            // Cache the result
            sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
            sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
          } else {
            setError('Failed to load design');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load design');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchDesign();

    return () => {
      isCancelled = true;
    };
  }, [designId]);

  // Memoized regenerate model function
  const handleRegenerateModel = useCallback(async () => {
    if (!design || !design.images || design.images.length === 0) return;
    
    try {
      setRegenerating(true);
      setError(null);
      
      const selectedImage = design.images.find(img => img.selected)?.url || design.images[0]?.url;
      
      if (!selectedImage) {
        throw new Error('No image found to generate 3D model from');
      }
      
      // Use existing user ID or generate a new one for guest users
      const userId = design.userId || sessionStorage.getItem('guest_user_id') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`;
      if (!sessionStorage.getItem('guest_user_id') && !design.userId) {
        sessionStorage.setItem('guest_user_id', userId);
      }
      
      const response = await apiService.generate3DModel({
        image_url: selectedImage,
        user_id: userId,
        creation_id: design.creationId,
        session_id: design.sessionId,
        options: design.generationOptions || {}
      });

      if (response.success && response.data) {
        // Refresh the design data to get the new model URLs
        if (designId) {
          const updatedResponse = await apiService.getDesign(designId);
          if (updatedResponse.success && updatedResponse.data) {
            setDesign(updatedResponse.data);
            setModelLoadError(null); // Clear any previous errors
          }
        }
      } else {
        throw new Error(response.error || 'Failed to regenerate 3D model');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate 3D model');
    } finally {
      setRegenerating(false);
    }
  }, [design, designId]);


  // Memoized make order function
  const handleMakeOrder = useCallback(async () => {
    if (!designId || !testModelUrl) {
      return;
    }

    try {
      // Use the model URL directly
      const finalModelUrl = testModelUrl;

      // Navigate to checkout
      navigate(`/checkout/${designId}`, {
        state: {
          modelUrl: finalModelUrl,
          originalModelUrl: (modelUrl && !modelUrl.startsWith('blob:') && 
                           (modelUrl.startsWith('http://') || modelUrl.startsWith('https://'))) 
                         ? modelUrl 
                         : testModelUrl,
          design: design
        }
      });
    } catch (error) {
      setError('Failed to prepare order. Please try again.');
    }
  }, [designId, testModelUrl, modelUrl, design, navigate]);

  // Memoized download function - navigate to download page
  const handleDownload = useCallback(() => {
    if (!design) return;

    // Get the best available model URL
    const modelUrl = getValidModelUrl();
    
    if (modelUrl) {
      // Navigate to download page with model URL
      navigate(`/download/${designId}`, {
        state: {
          modelUrl: modelUrl,
          design: design
        }
      });
    } else {
      setError('No valid model URL available for download');
    }
  }, [design, designId, getValidModelUrl, navigate]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="w-screen h-screen bg-gray-100 overflow-hidden flex p-4 gap-4">
      {/* Left Pane Skeleton */}
      <aside className="flex-shrink-0 w-full max-w-[476px] min-w-[320px] lg:w-[476px] bg-[#313131] rounded-[40px] relative overflow-hidden animate-pulse">
        <div className="pt-[3rem] sm:pt-[4rem] px-4 sm:px-6 pb-4 text-white flex flex-col items-center text-center h-full">
          <div className="mb-2 flex items-center px-1 gap-2 w-full max-w-[222px] h-[31px] rounded-full bg-black/50">
            <div className="flex-1 h-[22px] rounded-full bg-white/20"></div>
            <div className="flex-1 h-[22px] rounded-full bg-white/40"></div>
            <div className="flex-1 h-[22px] rounded-full bg-white/20"></div>
          </div>
          <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-32 mb-8"></div>
          <div className="mt-4 w-full max-w-[320px] flex-grow min-h-0 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-4 bg-white/20 rounded w-20 mb-3"></div>
                <div className="h-2 bg-white/20 rounded-full"></div>
              </div>
            ))}
            <div className="mt-8 w-full max-w-[200px] h-12 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </aside>

      {/* Center Panel Skeleton */}
      <div className="flex-1 bg-white rounded-[40px] flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-center">
              <img
                src="/GIFS/Loading-State.gif"
                alt="Loading 3D model"
                className="w-24 h-24 object-contain mx-auto mb-4"
              />
              <p className="text-gray-600">Loading your 3D model...</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <div className="w-6 h-6 rounded-full border border-gray-400 bg-gray-200"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex justify-center gap-4">
            <div className="w-24 h-12 bg-gray-200 rounded-lg"></div>
            <div className="w-16 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Right Panel Skeleton */}
      <div className="w-80 bg-[#313131] rounded-[40px] p-6 flex flex-col shadow-lg flex-shrink-0 animate-pulse">
        <div className="mb-8 text-right">
          <div className="h-4 bg-white/20 rounded w-20 mb-1"></div>
          <div className="h-8 bg-white/20 rounded w-24 mb-1"></div>
          <div className="space-y-1">
            <div className="h-3 bg-white/20 rounded w-16"></div>
            <div className="h-3 bg-white/20 rounded w-20"></div>
          </div>
        </div>
        <div className="space-y-2 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full flex items-center gap-4 p-4">
              <div className="w-5 h-5 bg-white/20 rounded"></div>
              <div className="h-4 bg-white/20 rounded w-24"></div>
            </div>
          ))}
        </div>
        <div className="text-right mt-auto pt-8">
          <div className="h-6 bg-white/20 rounded w-16"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Design</h2>
          <p className="text-gray-600 mb-4">{error || 'Design not found'}</p>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden flex p-4 gap-4">
      {/* Left Pane */}
      <aside className="flex-shrink-0 h-screen bg-[#313131] border border-white/5 relative overflow-hidden shadow-2xl"
             style={{
               width: 'clamp(400px, 27vw, 500px)',
               borderRadius: 'clamp(20px, 4vw, 40px)',
             }}>
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 px-4 py-2 text-sm text-white/80 hover:text-white transition-all duration-300 cursor-pointer bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/10 hover:border-white/20 shadow-lg z-10"
        >
          Back
        </button>
        
        {/* Brand and title area */}
        <div className="pt-[3rem] sm:pt-[4rem] px-4 sm:px-6 pb-4 text-white flex flex-col items-center text-center h-full overflow-y-auto">
          {/* Mode selector */}
          <div className="mb-2 flex items-center px-1 gap-2 w-full max-w-[222px] h-[31px] rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
            <button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-all duration-300 hover:bg-white/10 font-medium">
              Voice
            </button>
            <button className="flex-1 h-[22px] rounded-full text-xs bg-gradient-to-r from-white to-gray-100 text-black transition-all duration-300 font-medium shadow-lg">
              Chat
            </button>
            <button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-all duration-300 hover:bg-white/10 font-medium">
              Draw
            </button>
          </div>
          
          {/* Title */}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-center max-w-full mb-2">
            Playground
          </h1>
          <p className="mt-1 lg:mt-2 opacity-80 text-xs sm:text-sm mb-8">
            You are a Vibe Designer now
          </p>

          {/* Control Sliders Section */}
          <div className="mt-4 w-full max-w-[320px] flex-grow min-h-0">
            <div className="space-y-6">
              {/* Lighting Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/90 text-sm font-medium">Lighting</span>
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
                    className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer slider"
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
                    className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer slider"
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
                  <span className="text-white text-xs bg-white/15 px-2 py-1 rounded-md font-medium">{Math.round(size * 0.8)}</span>
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
                    className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer slider"
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
                    className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer slider"
                  />
                  <div 
                    className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-y-1/2 pointer-events-none border-2 border-gray-200"
                    style={{ left: `calc(${cameraAngle}% - 10px)` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button className="mt-8 w-full max-w-[200px] py-3 bg-gradient-to-r from-[#575757] to-[#676767] hover:from-[#676767] hover:to-[#575757] text-white font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg">
              Save to draft
            </button>
          </div>
        </div>
      </aside>

      {/* Center Panel - 3D Model */}
      <div className="flex-1 bg-white flex flex-col overflow-hidden shadow-xl border border-gray-200/50">
        {/* 3D Model Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {testModelUrl && !modelLoadError ? (
            <div className="w-full h-full max-w-full max-h-full">              <ModelViewer
                modelUrl={testModelUrl}
                className="w-full h-full"
                lighting={lighting}
                background={background}
                size={size}
                cameraAngle={cameraAngle}
                onError={handleModelError}
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {modelLoadError ? '3D Model Loading Failed' : '3D Model Generation Failed'}
              </h3>
              <p className="text-gray-600 mb-4">
                {modelLoadError 
                  ? modelLoadError
                  : design.status === 'completed' 
                    ? 'The design process completed, but the 3D model could not be generated.'
                    : 'The 3D model is still being processed.'}
              </p>
              <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded mb-4">
                <div><strong>Debug Info:</strong></div>
                <div>Model URL: {modelUrl || 'None'}</div>
                <div>Test URL: {testModelUrl || 'None'}</div>
                <div>Design Status: {design?.status || 'Unknown'}</div>
                <div>Model Files: {JSON.stringify(design?.modelFiles || {})}</div>
              </div>
              
              {design.images && design.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Generated from this image:</p>
                  <img 
                    src={design.images.find(img => img.selected)?.url || design.images[0]?.url} 
                    alt="Original design" 
                    className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-200"
                  />
                </div>
              )}
              
              <div className="flex flex-col gap-3 items-center">
                {modelLoadError && retryCount < maxRetries && (
                  <button 
                    onClick={handleRetryModel}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry Loading ({retryCount}/{maxRetries})
                  </button>
                )}
                
                <button 
                  onClick={handleRegenerateModel}
                  disabled={regenerating}
                  className="px-6 py-3 bg-[#E70D57] hover:bg-[#d10c50] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors flex items-center gap-2"
                >
                  {regenerating && (
                    <img
                      src="/GIFS/Loading-State.gif"
                      alt="Loading"
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  {regenerating ? 'Generating 3D Model...' : 'Generate New 3D Model'}
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                <div><strong>Status:</strong> {design.status}</div>
                <div><strong>Model URLs:</strong> {JSON.stringify(design.modelFiles, null, 2)}</div>
                {modelLoadError && <div><strong>Error:</strong> {modelLoadError}</div>}
                {retryCount > 0 && <div><strong>Retry Attempts:</strong> {retryCount}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-6 space-y-4 flex-shrink-0">
          {/* Interaction Hint */}
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7L8 5z"/>
              </svg>
            </div>
            <span className="text-sm">Click & hold to rotate</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={handleDownload}
              disabled={!getValidModelUrl()}
              className="px-8 py-3 bg-gradient-to-r from-black to-gray-800 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button 
              onClick={handleMakeOrder}
              className="px-8 py-3 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-[#E70D57] to-[#d10c50] text-white hover:from-[#d10c50] hover:to-[#E70D57] shadow-lg shadow-[#E70D57]/50 hover:shadow-xl hover:scale-105"
            >
              Make
            </button>
          </div>
        </div>
      </div>


      <style>{`
        .slider {
          background: transparent !important;
        }
        
        .slider::-webkit-slider-track {
          background: transparent;
          height: 8px;
          border: none;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 0;
          width: 0;
          background: transparent;
          cursor: pointer;
          border: none;
        }
        
        .slider::-moz-range-track {
          background: transparent;
          height: 8px;
          border: none;
        }
        
        .slider::-moz-range-thumb {
          height: 0;
          width: 0;
          background: transparent;
          cursor: pointer;
          border: none;
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          outline: none;
        }
      `}</style>
    </div>
  );
}