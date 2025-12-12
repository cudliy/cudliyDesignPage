import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { Download, ArrowLeft } from 'lucide-react';

// Import ModelViewer directly to avoid lazy loading issues
import ModelViewer from '../components/ModelViewer';

export default function DownloadPage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('STL');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use ref to prevent infinite loops
  const modelUrlSetRef = useRef(false);
  const designFetchedRef = useRef(false);
  
  // Available formats
  const availableFormats = ['STL', 'GLB', 'PLY', 'OBJ'];
  
  // Mobile detection effect - MUST be before any conditional rendering
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch design data
  useEffect(() => {
    if (!designId || designFetchedRef.current) return;

    const fetchDesign = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getDesign(designId);
        
        if (response.success && response.data) {
          designFetchedRef.current = true;
          setDesign(response.data);
          
          // Check if design already has a model (completed)
          const modelUrl = response.data.modelFiles?.storedModelUrl || response.data.modelFiles?.modelFile;
          if (modelUrl && !modelUrlSetRef.current) {
            modelUrlSetRef.current = true;
            setProgress(100);
            setIsProcessing(false);
            setModelUrl(modelUrl);
            // Start downloading immediately if model is already available
            if (!autoDownloadTriggered && !downloading) {
              setAutoDownloadTriggered(true);
              setTimeout(() => handleDownload(), 500);
            }
          }
        } else {
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

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!modelUrl || downloading) return;

    setDownloading(true);
    try {
      // Import download utilities
      const { download3DModel } = await import('../utils/downloadUtils');
      
      // Use selected format for download
      const fileType = selectedFormat.toLowerCase();
      
      // Download the 3D model
      await download3DModel(modelUrl, design?.id || designId || 'model', fileType);
    } catch (error) {
      setError(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  }, [modelUrl, downloading, selectedFormat, design?.id, designId]);

  // Update model URL when design changes (only once)
  useEffect(() => {
    if (modelUrlSetRef.current) return; // Already set, don't run again
    
    if (location.state?.modelUrl) {
      modelUrlSetRef.current = true;
      setModelUrl(location.state.modelUrl);
    } else if (design?.modelFiles?.storedModelUrl) {
      modelUrlSetRef.current = true;
      setModelUrl(design.modelFiles.storedModelUrl);
    } else if (design?.modelFiles?.modelFile) {
      modelUrlSetRef.current = true;
      setModelUrl(design.modelFiles.modelFile);
    }
  }, [design?.modelFiles?.storedModelUrl, design?.modelFiles?.modelFile, location.state?.modelUrl]);

  // Start download immediately when model URL is available
  useEffect(() => {
    if (modelUrl && !autoDownloadTriggered && !downloading) {

      setAutoDownloadTriggered(true);
      
      // Start download immediately
      handleDownload();
    }
  }, [modelUrl, autoDownloadTriggered, downloading, handleDownload]);

  // Real-time progress tracking
  useEffect(() => {
    // Temporarily disabled to prevent infinite loop
    // TODO: Re-implement with proper polling logic
    return;
    
    if (!design || !designId) return;
    
    // Don't start polling if we already have a model
    if (modelUrl && progress >= 100) {
      setIsProcessing(false);
      return;
    }

    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let isPolling = true;
    let pollCount = 0;
    const maxPolls = 150; // Stop after 5 minutes (150 * 2 seconds)
    
    // Force completion after 6 minutes as a safety net
    timeoutId = setTimeout(() => {

      setIsProcessing(false);
      setProgress(100);
      isPolling = false;
      if (progressInterval) clearInterval(progressInterval);
    }, 6 * 60 * 1000); // 6 minutes

    const pollProgress = async () => {
      try {
        pollCount++;
        
        // Poll for progress updates
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/designs/${designId}/progress`);
        if (response.ok) {
          const progressData = await response.json();
          
          if (progressData.success && progressData.data) {
            const { progress: currentProgress, status, hasModel } = progressData.data;
            
            // Update progress
            setProgress(Math.min(currentProgress || 0, 100));
            
            // Check if processing is complete
            if (status === 'completed' || currentProgress >= 100 || hasModel) {
              setIsProcessing(false);
              setProgress(100);
              
              // Clear timeout since we're done
              if (timeoutId) clearTimeout(timeoutId);
              
              // Refresh design data to get the final model URL
              if (designId) {
                try {
                  const designResponse = await apiService.getDesign(designId);
                  if (designResponse.success && designResponse.data) {
                    setDesign(designResponse.data);
                  }
                } catch (error) {
                  console.error('Error refreshing design data:', error);
                }
              }
              
              isPolling = false;
              if (progressInterval) clearInterval(progressInterval);
              return;
            }
          }
        }

        // Stop polling after max attempts to prevent infinite polling
        if (pollCount >= maxPolls) {

          setIsProcessing(false);
          setProgress(100);
          isPolling = false;
          if (progressInterval) clearInterval(progressInterval);
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Error polling progress:', error);
        // Continue polling even if there's an error, but stop after max attempts
        if (pollCount >= maxPolls) {
          setIsProcessing(false);
          setProgress(100);
          isPolling = false;
          if (progressInterval) clearInterval(progressInterval);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    // Start polling immediately
    pollProgress();

    // Set up interval for regular polling (every 2 seconds)
    progressInterval = setInterval(() => {
      if (isPolling && pollCount < maxPolls) {
        pollProgress();
      }
    }, 2000);

    // Cleanup on unmount or when dependencies change
    return () => {
      isPolling = false;
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [designId]); // Only re-run if designId changes

  // Helper function to get progress messages based on progress value
  const getProgressMessage = (progressValue: number): string => {
    if (progressValue < 10) return 'Initializing 3D model generation...';
    if (progressValue < 20) return 'Analyzing input image...';
    if (progressValue < 40) return 'Extracting 3D features...';
    if (progressValue < 60) return 'Generating 3D geometry...';
    if (progressValue < 80) return 'Applying textures and materials...';
    if (progressValue < 90) return 'Optimizing model quality...';
    if (progressValue < 95) return 'Finalizing 3D model...';
    if (progressValue < 100) return 'Almost ready...';
    return 'Processing complete!';
  };

  // Enhanced progress tracking with more realistic progression
  useEffect(() => {
    if (!isProcessing) return;

    // Simulate more realistic progress progression
    const progressInterval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) return 100;
        
        // Add small increments to make progress feel more dynamic
        const increment = Math.random() * 3 + 1; // 1-4% increments
        const newProgress = Math.min(prevProgress + increment, 98); // Cap at 98% until API completion
        
        return newProgress;
      });
    }, 1200); // Update every 1.2 seconds

    return () => clearInterval(progressInterval);
  }, [isProcessing]);





  // Handle format change
  const handleFormatChange = useCallback((format: string) => {
    setSelectedFormat(format);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(`/design/${designId}`);
  }, [navigate, designId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img
            src="/GIFS/Loading-State.gif"
            alt="Processing"
            className="w-64 h-64 object-contain mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your 3D model...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !design) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Design</h2>
          <p className="text-gray-600 mb-4">{error || 'Design not found'}</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-[#212121] hover:bg-[#313131] text-white font-medium rounded-full transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }



  // Mobile View
  if (isMobile) {
    // Show loading state
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-64 h-64 mx-auto mb-4" />
            <p className="text-gray-600">Loading design...</p>
          </div>
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="bg-[#212121] text-white px-4 py-3 flex items-center justify-between">
            <button onClick={handleBack} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Download</h1>
            <div className="w-5"></div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button 
                onClick={handleBack}
                className="px-6 py-2 bg-[#212121] text-white rounded-full"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="bg-white text-[#212121] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#212121]text-slate-100" />
            </button>
            <h1 className="text-lg font-bold text-[#212121]" style={{ fontFamily: 'Inter, sans-serif' }}>Cudliy</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Progress */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-4xl font-bold text-[#212121]text-slate-100 mb-2">
              {Math.round(progress)}%
            </div>
            <p className="text-sm text-[#212121]text-slate-300 opacity-70 mb-3">
              {downloading ? 'Downloading...' : isProcessing ? 'Processing...' : 'Ready to download'}
            </p>
            <div className="w-full bg-gray-200bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blackbg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* 3D Preview */}
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-full h-64 bg-gray-50bg-slate-900 rounded-lg overflow-hidden">
              {modelUrl ? (
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-16 h-16" />
                  </div>
                }>
                  <ModelViewer
                    modelUrl={modelUrl}
                    className="w-full h-full"
                    lighting={50}
                    background={100}
                    size={50}
                    cameraAngle={50}
                  />
                </Suspense>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400text-slate-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-sm">Loading model...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Format Selection */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => handleFormatChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#212121] bg-white text-[#212121]"
            >
              {availableFormats.map((format) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          {/* Send as Gift */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Share as a Gift</h3>
            <button
              onClick={() => navigate(`/send-gift/${designId}`)}
              className="w-full py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              🎁 Send Digital Gift
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Create a personalized gift link with video slides
            </p>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="bg-white p-4 border-t border-gray-200">
          <button
            onClick={handleDownload}
            disabled={downloading || !modelUrl || isProcessing}
            className={`w-full py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
              downloading || !modelUrl || isProcessing
                ? 'bg-gray-400bg-slate-600 text-gray-200text-slate-400 cursor-not-allowed'
                : 'bg-blackbg-white text-whitetext-black hover:bg-gray-800hover:bg-gray-200'
            }`}
          >
            {downloading ? (
              <>
                <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-5 h-5" />
                Downloading...
              </>
            ) : isProcessing ? (
              <>
                <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-5 h-5" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Now
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="p-6">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Return to Design</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)] px-6 pb-6">
        {/* Left Side - Download Section */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          {/* Progress Indicator */}
          <div className="text-center">
            <div className="text-8xl font-bold text-[#212121] mb-4">
              {Math.round(progress)}%
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {downloading ? 'Downloading your 3D model...' : 'Processing your 3D model'}
            </p>
            
            {/* Progress Bar */}
            <div className="w-full max-w-sm mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-[#212121] h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="w-full max-w-sm">
            <label className="block border-b border-black/30 rounded full bg-white/10 pb-2 text-sm font-normal text-gray-700 mb-3">
              Choose Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => handleFormatChange(e.target.value)}
              className="w-full px-4 py-3 border-black rounded-full bg-white/10 focus:ring-2 focus:ring-[#212121] cursor-pointer"
            >
              {availableFormats.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading || !modelUrl || isProcessing}
            className="w-[233px] max-w-sm px-8 py-4 bg-[#212121] rounded-full hover:bg-[#313131] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-normal transition-all duration-300 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <img
                  src="/GIFS/Loading-State.gif"
                  alt="Downloading"
                  className="w-5 h-5 object-contain"
                />
                Downloading...
              </>
            ) : isProcessing ? (
              <>
                <img
                  src="/GIFS/Loading-State.gif"
                  alt="Downloading"
                  className="w-5 h-5 object-contain"
                />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Now
              </>
            )}
          </button>

          {/* Progress Message */}
          {downloading ? (
            <p className="text-sm text-blue-600 text-center max-w-sm">
              📥 Downloading your file in the background...
            </p>
          ) : isProcessing ? (
            <p className="text-sm text-gray-500 text-center max-w-sm">
              {getProgressMessage(progress)}
            </p>
          ) : (
            <p className="text-sm text-green-600 text-center max-w-sm">
              
            </p>
          )}
        </div>

        {/* Right Side - 3D Model Preview & Sharing */}
        <div className="flex-1 flex flex-col space-y-6">
          {/* 3D Model Preview */}
          <div className="flex-1 bg-gray-100 p-6 relative overflow-hidden">
            {modelUrl ? (
              <div className="w-full h-full">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <img
                        src="/GIFS/Loading-State.gif"
                        alt="Loading 3D model"
                        className="w-16 h-16 object-contain mx-auto mb-2"
                      />
                      <p className="text-sm text-gray-600">Loading 3D model...</p>
                    </div>
                  </div>
                }>
                  <ModelViewer
                    modelUrl={modelUrl}
                    className="w-full h-full"
                    lighting={50}
                    background={100}
                    size={50}
                    cameraAngle={50}
                  />
                </Suspense>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm">3D model not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Send as Gift Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              Share as a Gift
            </h3>
            <button
              onClick={() => navigate(`/send-gift/${designId}`)}
              className="w-full py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              🎁 Send Digital Gift
            </button>
            <p className="text-sm text-gray-500 text-center">
              Create a personalized gift link with video slides
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}