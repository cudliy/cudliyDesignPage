import { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Download, ArrowLeft } from 'lucide-react';
import ModelViewer from '../components/ModelViewer';

export default function DownloadPage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('STL');
  
  const availableFormats = ['STL', 'GLB', 'PLY', 'OBJ'];

  // Fetch design ONCE
  useEffect(() => {
    let isMounted = true;
    
    const fetchDesign = async () => {
      if (!designId) return;
      
      try {
        setLoading(true);
        const response = await apiService.getDesign(designId);
        
        if (isMounted && response.success && response.data) {
          setDesign(response.data);
        } else if (isMounted) {
          setError('Failed to load design');
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load design');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDesign();
    
    return () => {
      isMounted = false;
    };
  }, [designId]);

  const handleDownload = async () => {
    const modelUrl = design?.modelFiles?.storedModelUrl || design?.modelFiles?.modelFile;
    if (!modelUrl || downloading) return;

    setDownloading(true);
    try {
      const { download3DModel } = await import('../utils/downloadUtils');
      await download3DModel(modelUrl, design?.id || designId || 'model', selectedFormat.toLowerCase());
    } catch (error) {
      setError(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Loading design...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">{error || 'Design not found'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 sm:px-6 py-2 text-white rounded-full text-sm sm:text-base"
            style={{ backgroundColor: '#313131' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const modelUrl = design.modelFiles?.storedModelUrl || design.modelFiles?.modelFile;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="p-4 sm:p-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Main Content - Mobile First Approach */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] px-4 sm:px-6 pb-4 sm:pb-6 gap-4 sm:gap-6 lg:gap-8">
        
        {/* 3D Model Preview - Top on mobile, right on desktop */}
        <div className="w-full lg:flex-1 order-1 lg:order-2">
          <div 
            className="w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center justify-center"
            style={{ 
              backgroundColor: 'white',
              border: '3px solid #F5F5F5'
            }}
          >
            {modelUrl ? (
              <Suspense fallback={
                <div className="text-center">
                  <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading 3D model...</p>
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
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm">3D model not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Download Section - Bottom on mobile, left on desktop */}
        <div className="w-full lg:flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8 py-4 sm:py-8 order-2 lg:order-1">
          
          {/* Header */}
          <div className="text-center px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Your Design is Ready
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Share your creation as a gift or download for personal use
            </p>
          </div>

          {/* Format Selection */}
          <div className="w-full max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none text-base"
            >
              {availableFormats.map((format) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-sm space-y-4">
            {/* Send as Gift Button - Primary Action */}
            <button
              onClick={() => navigate(`/send-gift/${designId}`)}
              className="w-full h-[54px] px-6 text-white rounded-full font-semibold flex items-center justify-center gap-2 text-base hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#313131' }}
            >
              🎁 Send as Gift
            </button>

            {/* Download Button - Secondary Action */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading || !modelUrl}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-full transition-colors text-sm font-medium text-gray-700"
                title={`Download as ${selectedFormat}`}
              >
                {downloading ? (
                  <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download {selectedFormat}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
