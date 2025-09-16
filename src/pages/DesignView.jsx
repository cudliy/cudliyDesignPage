import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import ModelViewer from '../components/ModelViewer';
import { Upload } from 'lucide-react';
import { slant3DService } from '../services/slant3dService';
import { modelConverter } from '../services/modelConverter';

export default function DesignView() {
  const { designId } = useParams();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [slant3DPricing, setSlant3DPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [stlUrl, setStlUrl] = useState(null);
  const navigate = useNavigate();
  
  // Control states - matching the image positions
  const [lighting, setLighting] = useState(30);
  const [background, setBackground] = useState(45);
  const [size, setSize] = useState(50);
  const [cameraAngle, setCameraAngle] = useState(50);
  
  // Model loading states - must be at top level
  const [modelLoadError, setModelLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Helper functions - defined after all hooks
  const getValidModelUrl = () => {
    console.log('DesignView: getValidModelUrl called, design:', design);
    
    if (!design) {
      console.log('DesignView: No design data available');
      return null;
    }
    
    console.log('DesignView: Design modelFiles:', design.modelFiles);
    
    const urls = [
      design.modelFiles?.storedModelUrl,
      design.modelFiles?.modelFile,
      design.modelFiles?.gaussianPly
    ].filter(Boolean);
    
    console.log('DesignView: Available URLs:', urls);
    
    // Find the first valid URL
    for (const url of urls) {
      if (url && typeof url === 'string' && url.trim() !== '') {
        console.log('DesignView: Checking URL:', url);
        // Basic URL validation
        try {
          new URL(url);
          console.log('DesignView: Valid URL found:', url);
          return url;
        } catch {
          // If it's not a full URL, check if it's a relative path or data URL
          if (url.startsWith('/') || url.startsWith('./') || url.startsWith('data:')) {
            console.log('DesignView: Valid relative/data URL found:', url);
            return url;
          }
        }
      }
    }
    
    console.log('DesignView: No valid model URL found');
    return null;
  };

  // Get model URL after function is defined
  const modelUrl = getValidModelUrl();
  
  // Test with a fallback model URL if no model is available
  const testModelUrl = modelUrl || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Cube/glTF-Binary/Cube.glb';
  
  // Check if model-viewer is available
  useEffect(() => {
    console.log('DesignView: Checking model-viewer availability');
    console.log('DesignView: model-viewer defined:', typeof modelViewer !== 'undefined');
    console.log('DesignView: customElements defined:', typeof customElements !== 'undefined');
    if (typeof customElements !== 'undefined') {
      console.log('DesignView: model-viewer custom element defined:', customElements.get('model-viewer'));
    }
  }, []);

  const handleModelError = (error) => {
    console.error('Model loading error:', error);
    setModelLoadError(error);
  };

  // Convert GLB to STL if needed
  const convertModelToSTL = async (modelUrlParam) => {
    if (!modelUrlParam) return null;
    
    try {
      setConverting(true);
      setConversionProgress(0);
      
      // Check if it's a GLB file
      if (modelUrlParam.toLowerCase().includes('.glb') || modelUrlParam.toLowerCase().includes('glb')) {
        console.log('Converting GLB to STL for 3D printing...');
        
        // Fetch the GLB file
        const response = await fetch(modelUrlParam);
        const glbBlob = await response.blob();
        const glbFile = new File([glbBlob], 'model.glb', { type: 'model/gltf-binary' });
        
        // Convert to STL using smart conversion (client-side first, backend fallback)
        const conversionResult = await modelConverter.convertGLBToSTLSmart(modelUrlParam, {
          binary: true,
          filename: 'model.stl'
        });
        
        if (conversionResult.success) {
          setStlUrl(conversionResult.stlUrl);
          console.log('GLB to STL conversion successful');
          return conversionResult.stlUrl;
        } else {
          throw new Error('GLB to STL conversion failed');
        }
      }
      
      // If it's already an STL file, return the original URL
      return modelUrlParam;
      
    } catch (error) {
      console.error('Model conversion error:', error);
      setError('Failed to convert model for 3D printing');
      return null;
    } finally {
      setConverting(false);
      setConversionProgress(0);
    }
  };

  // Load Slant3D pricing when model is available
  useEffect(() => {
    const loadSlant3DPricing = async () => {
      if (!design) return;

      try {
        setPricingLoading(true);
        
        // Use testModelUrl for pricing (either real model or fallback)
        const pricingModelUrl = testModelUrl;
        
        // Convert model to STL if needed (only for real models, not test models)
        let stlModelUrl = pricingModelUrl;
        
        // Check if we have a blob URL that needs to be converted to HTTP URL
        if (pricingModelUrl && pricingModelUrl.startsWith('blob:')) {
          console.log('DesignView: Blob URL detected, using fallback test model for pricing');
          stlModelUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Cube/glTF-Binary/Cube.glb';
        } else if (modelUrl && !pricingModelUrl.includes('modelviewer.dev') && !pricingModelUrl.includes('githubusercontent.com')) {
          stlModelUrl = await convertModelToSTL(modelUrl);
          if (!stlModelUrl) {
            throw new Error('Failed to prepare model for pricing');
          }
        }
        
          // Use STL URL for pricing calculation
          console.log('DesignView: Getting pricing for URL:', stlModelUrl);
          const pricing = await slant3DService.getPricing(stlModelUrl, {
            material: 'PLA',
            color: 'black', // Use a valid color from the allowed enum
            quantity: 1
          });

        console.log('DesignView: Pricing response:', pricing);
        if (pricing.success) {
          setSlant3DPricing(pricing.data);
          console.log('DesignView: Slant3D pricing set:', pricing.data);
        } else {
          throw new Error('Slant3D pricing request failed');
        }
      } catch (error) {
        console.error('Failed to load Slant3D pricing:', error);
        
        // Check if it's an API configuration issue
        if (error.message.includes('API key not configured')) {
          setError('Slant3D API key not configured. Please set VITE_SLANT3D_API_KEY in your environment variables.');
        } else if (error.message.includes('API is not accessible')) {
          setError('Slant3D API is not accessible. The API is currently in beta and may not be publicly available yet. Please contact Slant3D support for API access.');
        } else if (error.message.includes('too large') || error.message.includes('offset')) {
          setError('The model file is too large for pricing calculation. Please try with a smaller model or contact support for assistance.');
        } else if (error.message.includes('Blob URLs are not supported')) {
          setError('The uploaded model file cannot be used for pricing. Please try with a different model or contact support.');
        } else if (error.message.includes('Invalid color selection')) {
          setError('There was an issue with the color selection. Please try again.');
        } else if (error.message.includes('Invalid model file format')) {
          setError('The model file format is not supported for pricing. Please try with a different model file.');
        } else {
          setError(`Pricing unavailable: ${error.message}. Please check your Slant3D API configuration.`);
        }
        
        setSlant3DPricing(null);
      } finally {
        setPricingLoading(false);
      }
    };

    loadSlant3DPricing();
  }, [design, testModelUrl]);
  const handleRetryModel = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setModelLoadError(null);
      // Force re-render of ModelViewer by updating a state
      setLighting(prev => prev);
    } else {
      // If max retries reached, try regenerating the model
      handleRegenerateModel();
    }
  };

  useEffect(() => {
    if (!designId) return;

    const fetchDesign = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDesign(designId);
        
        if (response.success && response.data) {
          console.log('DesignView: Design data loaded:', response.data);
          console.log('DesignView: Model files:', response.data.modelFiles);
          setDesign(response.data);
        } else {
          console.error('DesignView: Failed to load design:', response);
          setError('Failed to load design');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load design');
      } finally {
        setLoading(false);
      }
    };

    fetchDesign();
  }, [designId]);

  const handleRegenerateModel = async () => {
    if (!design || !design.images || design.images.length === 0) return;
    
    try {
      setRegenerating(true);
      const selectedImage = design.images.find(img => img.selected)?.url || design.images[0]?.url;
      
      if (!selectedImage) {
        throw new Error('No image found to generate 3D model from');
      }

      console.log('Regenerating 3D model from image:', selectedImage);
      
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
            console.log('3D model regenerated successfully');
          }
        }
      } else {
        throw new Error(response.error || 'Failed to regenerate 3D model');
      }
    } catch (err) {
      console.error('Error regenerating 3D model:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate 3D model');
    } finally {
      setRegenerating(false);
    }
  };


  const handleMakeOrder = async () => {
    if (!designId || !testModelUrl) {
      console.error('Missing designId or modelUrl', { designId, testModelUrl });
      return;
    }

    try {
      // Ensure we have an STL file for Slant3D
      let finalModelUrl = testModelUrl;
      
      // Only convert to STL if it's a real model (not the test model)
      if (modelUrl && !testModelUrl.includes('modelviewer.dev')) {
        if (stlUrl) {
          finalModelUrl = stlUrl;
        } else if (modelUrl.toLowerCase().includes('.glb') || modelUrl.toLowerCase().includes('glb')) {
          // Convert GLB to STL if not already done
          const convertedUrl = await convertModelToSTL(modelUrl);
          if (convertedUrl) {
            finalModelUrl = convertedUrl;
          } else {
            throw new Error('Failed to convert model for 3D printing');
          }
        }
      }

      // Store pricing data in session storage for checkout
      if (slant3DPricing) {
        sessionStorage.setItem('slant3d_pricing', JSON.stringify(slant3DPricing));
        sessionStorage.setItem('slant3d_model_url', finalModelUrl);
      }

      // Navigate to checkout with pricing data
      navigate(`/checkout/${designId}`, {
        state: {
          slant3DPricing: slant3DPricing,
          modelUrl: finalModelUrl,
          design: design
        }
      });
    } catch (error) {
      console.error('Error preparing order:', error);
      setError('Failed to prepare order. Please try again.');
    }
  };




  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E70D57] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your 3D model...</p>
        </div>
      </div>
    );
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
    <div className="w-screen h-screen bg-gray-100 overflow-hidden flex p-4 gap-4">
      {/* Left Pane */}
      <aside className="flex-shrink-0 w-full max-w-[476px] min-w-[320px] lg:w-[476px] bg-[#313131] rounded-[40px] relative overflow-hidden">
        <button 
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-sm text-white/70 z-10 hover:text-white transition-colors cursor-pointer"
        >
          Back
        </button>
        
        {/* Brand and title area */}
        <div className="pt-[3rem] sm:pt-[4rem] px-4 sm:px-6 pb-4 text-white flex flex-col items-center text-center h-full overflow-y-auto">
          {/* Mode selector */}
          <div className="mb-2 flex items-center px-1 gap-2 w-full max-w-[222px] h-[31px] rounded-full bg-black/50">
            <button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-colors hover:bg-white/10 font-medium">
              Voice
            </button>
            <button className="flex-1 h-[22px] rounded-full text-xs bg-[#DFDFDF] text-black transition-colors font-medium shadow-sm">
              Chat
            </button>
            <button className="flex-1 h-[22px] rounded-full text-xs text-white/90 transition-colors hover:bg-white/10 font-medium">
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
            <button className="mt-8 w-full max-w-[200px] py-3 bg-[#575757] hover:bg-[#676767] text-white font-medium rounded-full transition-colors hover:scale-105">
              Save to draft
            </button>
          </div>
        </div>
      </aside>

      {/* Center Panel - 3D Model */}
      <div className="flex-1 bg-white rounded-[40px] flex flex-col overflow-hidden">
        {/* 3D Model Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {console.log('DesignView: Rendering model area, modelUrl:', modelUrl, 'testModelUrl:', testModelUrl, 'modelLoadError:', modelLoadError, 'design:', design)}
          {testModelUrl && !modelLoadError ? (
            <div className="w-full h-full max-w-full max-h-full">
              {/* Test with a simple model-viewer element first */}
              <model-viewer
                src={testModelUrl}
                alt="3D Model"
                camera-controls
                auto-rotate
                style={{ width: '100%', height: '100%' }}
                onLoad={() => console.log('Direct model-viewer loaded successfully')}
                onError={(e) => console.error('Direct model-viewer error:', e)}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
            <button className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              Download
            </button>
            <button 
              onClick={handleMakeOrder}
              disabled={converting || pricingLoading || !slant3DPricing}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                converting || pricingLoading || !slant3DPricing
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#E70D57] text-white hover:bg-[#d10c50]'
              }`}
            >
              {converting ? 'Converting...' : pricingLoading ? 'Calculating...' : !slant3DPricing ? 'Pricing Required' : 'Make'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Options */}
      <div className="w-80 bg-[#313131] rounded-[40px] p-6 flex flex-col shadow-lg flex-shrink-0">
        {/* Price */}
        <div className="mb-8 text-right">
          <h3 className="text-white/70 text-sm font-medium mb-1">
            {converting ? 'Converting...' : pricingLoading ? 'Calculating...' : 'Real Price:'}
          </h3>
          {converting ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span className="text-white text-sm">Converting GLB to STL...</span>
              </div>
              <div className="w-32 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-[#E70D57] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${conversionProgress}%` }}
                ></div>
              </div>
            </div>
          ) : pricingLoading ? (
            <div className="flex items-center justify-end gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="text-white text-sm">Loading...</span>
            </div>
          ) : slant3DPricing ? (
            <div>
              <p className="text-4xl font-bold text-white">
                ${slant3DPricing.pricing.total.toFixed(2)}
              </p>
              <div className="text-xs text-white/60 mt-1">
                <div>Material: {slant3DPricing.material}</div>
                <div>Est. {slant3DPricing.estimated_days} days</div>
                {stlUrl && <div className="text-green-400">✓ STL Ready</div>}
              </div>
              {console.log('DesignView: Displaying Slant3D pricing:', slant3DPricing)}
            </div>
          ) : (
            <div>
              <p className="text-4xl font-bold text-red-400">API in Beta</p>
              <div className="text-xs text-red-300 mt-1">
                <div>Slant3D API not accessible</div>
                <div>Contact Slant3D for access</div>
              </div>
              <div className="text-xs text-white/60 mt-1">
                <div>Beta API - Limited Access</div>
                {console.log('DesignView: No Slant3D pricing available, API in beta')}
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-4 p-4 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="font-medium">Creator's Zone</span>
          </button>

          <button className="w-full flex items-center gap-4 p-4 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            <span className="font-medium">View Setting</span>
          </button>

          <button className="w-full flex items-center gap-4 p-4 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
            </svg>
            <span className="font-medium">Design Tips</span>
          </button>

          <button className="w-full flex items-center gap-4 p-4 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.5 7h-17C2.67 7 2 7.67 2 8.5v7C2 16.33 2.67 17 3.5 17h17c.83 0 1.5-.67 1.5-1.5v-7C22 7.67 21.33 7 20.5 7zM12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
            </svg>
            <span className="font-medium">AR/VR</span>
          </button>
        </div>

        {/* Brand - Vertical Text */}
        <div className="text-right mt-auto pt-8">
          <div className="flex justify-end">
            <div className="transform rotate-90 origin-bottom-right">
              <span className="text-white/90 text-lg font-light tracking-wider">
                Cudliy.
              </span>
            </div>
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