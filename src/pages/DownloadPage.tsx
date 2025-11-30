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
          <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-600">Loading design...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Design not found'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-black text-white rounded-full"
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
      <div className="p-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] px-4 lg:px-6 pb-6 gap-6 lg:gap-8">
        {/* Right Side - 3D Model Preview (First on mobile) */}
        <div 
          className="w-full lg:flex-1 h-[400px] md:h-[500px] lg:min-h-0 rounded-[24px] lg:rounded-[32px] p-4 lg:p-6 flex items-center justify-center order-1 lg:order-2"
          style={{ 
            backgroundColor: 'white',
            border: '6px solid #F5F5F5'
          }}
        >
          {modelUrl ? (
            <Suspense fallback={
              <div className="text-center">
                <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-16 h-16 mx-auto mb-2" />
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

        {/* Left Side - Download Section (Second on mobile) */}
        <div className="w-full lg:flex-1 flex flex-col items-center justify-center space-y-6 lg:space-y-8 py-8 order-2 lg:order-1">
          <div className="text-center px-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Your Design is Ready
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Share your creation as a gift or download for personal use
            </p>
          </div>

          {/* Format Selection */}
          <div className="w-full max-w-sm px-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-black outline-none text-base"
            >
              {availableFormats.map((format) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          {/* Send as Gift Button - Primary Action */}
          <div className="w-full max-w-sm px-4">
            <button
              onClick={() => navigate(`/send-gift/${designId}`)}
              className="w-full px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-full font-semibold flex items-center justify-center gap-2 text-sm md:text-base hover:bg-gray-800 transition-colors"
            >
              🎁 Send as Gift
            </button>
          </div>

          {/* Download Icon Button - Secondary Action */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading || !modelUrl}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors group"
              title={`Download as ${selectedFormat}`}
            >
              {downloading ? (
                <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
              )}
            </button>
            <span className="text-xs text-gray-500 font-medium">Download {selectedFormat}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
