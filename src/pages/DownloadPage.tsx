import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { Download, ArrowLeft, Instagram, Linkedin, Twitter, Facebook } from 'lucide-react';

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
  
  // Available formats
  const availableFormats = ['STL', 'GLB', 'PLY', 'OBJ'];
  
  // Get model URL from location state or fetch from API
  const getModelUrl = useCallback(() => {
    if (location.state?.modelUrl) {
      return location.state.modelUrl;
    }
    if (design?.modelFiles?.storedModelUrl) {
      return design.modelFiles.storedModelUrl;
    }
    if (design?.modelFiles?.modelFile) {
      return design.modelFiles.modelFile;
    }
    return null;
  }, [location.state, design]);

  // Fetch design data
  useEffect(() => {
    if (!designId) return;

    const fetchDesign = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getDesign(designId);
        
        if (response.success && response.data) {
          setDesign(response.data);
          
          // Check if design already has a model (completed)
          const modelUrl = response.data.modelFiles?.storedModelUrl || response.data.modelFiles?.modelFile;
          if (modelUrl) {
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

  // Update model URL when design changes
  useEffect(() => {
    const url = getModelUrl();
    setModelUrl(url);
  }, [getModelUrl]);

  // Start download immediately when model URL is available
  useEffect(() => {
    if (modelUrl && !autoDownloadTriggered && !downloading) {
      console.log('Model URL available, starting background download...');
      setAutoDownloadTriggered(true);
      
      // Start download immediately
      handleDownload();
    }
  }, [modelUrl, autoDownloadTriggered, downloading, handleDownload]);

  // Real-time progress tracking
  useEffect(() => {
    if (!design || !designId) return;

    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let isPolling = true;
    let pollCount = 0;
    const maxPolls = 150; // Stop after 5 minutes (150 * 2 seconds)
    
    // Force completion after 6 minutes as a safety net
    timeoutId = setTimeout(() => {
      console.log('Progress timeout reached, forcing completion');
      setIsProcessing(false);
      setProgress(100);
      isPolling = false;
      if (progressInterval) clearInterval(progressInterval);
    }, 6 * 60 * 1000); // 6 minutes

    const pollProgress = async () => {
      try {
        pollCount++;
        
        // Check if we have a model URL already (processing complete)
        const currentModelUrl = getModelUrl();
        if (currentModelUrl && currentModelUrl !== modelUrl) {
          setModelUrl(currentModelUrl);
          setProgress(100);
          setIsProcessing(false);
          isPolling = false;
          if (progressInterval) clearInterval(progressInterval);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }

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
              try {
                const designResponse = await apiService.getDesign(designId);
                if (designResponse.success && designResponse.data) {
                  setDesign(designResponse.data);
                }
              } catch (error) {
                console.error('Error refreshing design data:', error);
              }
              
              isPolling = false;
              if (progressInterval) clearInterval(progressInterval);
              return;
            }
          }
        }

        // Stop polling after max attempts to prevent infinite polling
        if (pollCount >= maxPolls) {
          console.log('Max polling attempts reached, stopping progress tracking');
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
  }, [design, designId, getModelUrl, modelUrl]);

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

  // Handle social sharing
  const handleSocialShare = useCallback((platform: string) => {
    const shareUrl = window.location.origin + `/design/${designId}`;
    const shareText = `Check out my 3D design created with Cudliy!`;
    
    let url = '';
    
    switch (platform) {
      case 'instagram':
        // Instagram doesn't support direct URL sharing, open app or show instructions
        alert('Share your design on Instagram by saving the image and posting it!');
        return;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  }, [designId]);

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
            className="w-24 h-24 object-contain mx-auto mb-4"
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
            className="px-6 py-2 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
            <div className="text-8xl font-bold text-[#E70D57] mb-4">
              {Math.round(progress)}%
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {downloading ? 'Downloading your 3D model...' : 'Processing your 3D model'}
            </p>
            
            {/* Progress Bar */}
            <div className="w-full max-w-sm mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-[#E70D57] h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="w-full max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => handleFormatChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E70D57] focus:border-transparent appearance-none bg-white cursor-pointer"
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
            className="w-full max-w-sm px-8 py-4 bg-[#E70D57] hover:bg-[#d10c50] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
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
              ✅ Your 3D model is ready!
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

          {/* Sharing Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              Share Your Image Design
            </h3>
            
            {/* Social Media Icons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleSocialShare('instagram')}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors group"
              >
                <Instagram className="w-5 h-5 text-gray-600 group-hover:text-[#E70D57]" />
              </button>
              
              <button
                onClick={() => handleSocialShare('linkedin')}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors group"
              >
                <Linkedin className="w-5 h-5 text-gray-600 group-hover:text-[#E70D57]" />
              </button>
              
              <button
                onClick={() => handleSocialShare('twitter')}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors group"
              >
                <Twitter className="w-5 h-5 text-gray-600 group-hover:text-[#E70D57]" />
              </button>
              
              <button
                onClick={() => handleSocialShare('facebook')}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors group"
              >
                <Facebook className="w-5 h-5 text-gray-600 group-hover:text-[#E70D57]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
