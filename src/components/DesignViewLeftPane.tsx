import { useState } from 'react';

interface DesignViewLeftPaneProps {
  lighting: number;
  setLighting: (value: number) => void;
  background: number;
  setBackground: (value: number) => void;
  size: number;
  setSize: (value: number) => void;
  cameraAngle: number;
  setCameraAngle: (value: number) => void;
  onClose: () => void;
  onGenerateNew?: (prompt: string) => void; // Callback to generate new images
}

export default function DesignViewLeftPane({
  lighting,
  setLighting,
  background,
  setBackground,
  size,
  setSize,
  cameraAngle,
  setCameraAngle,
  onClose,
  onGenerateNew
}: DesignViewLeftPaneProps) {
  const [newPrompt, setNewPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Debug logging
  console.log('🔍 DesignViewLeftPane rendered with onGenerateNew:', !!onGenerateNew);

  const handleGenerateNew = () => {
    if (newPrompt.trim() && onGenerateNew) {
      setIsGenerating(true);
      onGenerateNew(newPrompt.trim());
      setNewPrompt(''); // Clear the input after generating
      
      // Reset generating state after a short delay
      setTimeout(() => setIsGenerating(false), 1000);
    }
  };

  return (
    <aside className="left-pane-scale flex-shrink-0 bg-[#313131] border border-white/5 relative overflow-hidden shadow-2xl"
           style={{
             width: 'clamp(400px, 476px, 476px)',
             minWidth: '400px',
             height: 'calc(100vh - 32px)',
             borderRadius: 'clamp(16px, 2vw, 28px)',
             margin: '0'
           }}>
      
      {/* Brand and title area */}
      <div className="left-pane-content pt-[3rem] px-4 sm:px-6 pb-4 text-white flex flex-col items-center text-center h-full">
        
        {/* Generate New Section - Always show for debugging */}
        <div className="mt-16 w-full max-w-[360px] mb-8 border border-red-500">
          <h3 className="text-white/90 text-sm font-medium mb-4 text-left">Generate New Design</h3>
          <p className="text-xs text-yellow-400 mb-2">Debug: onGenerateNew = {onGenerateNew ? 'YES' : 'NO'}</p>
            
            {/* Input Field - Compact version */}
            <div className="relative w-full bg-[#515151]" style={{ height: '60px', borderRadius: '20px' }}>
              <input
                placeholder="Try a new idea..."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateNew();
                  }
                }}
                className="w-full pt-2 pb-8 pl-4 pr-16 bg-transparent text-white placeholder-gray-400 border-none focus:outline-none text-sm"
                style={{ borderRadius: '20px' }}
              />
              
              {/* Generate button */}
              <button
                onClick={handleGenerateNew}
                disabled={!newPrompt.trim() || isGenerating}
                className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  !newPrompt.trim() || isGenerating
                    ? 'bg-[#313131] cursor-not-allowed'
                    : 'bg-[#E70D57] hover:bg-[#d10c50]'
                }`}
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className={`w-4 h-4 transition-colors ${
                    !newPrompt.trim()
                      ? 'text-gray-400'
                      : 'text-white'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

        {/* Control Sliders Section */}
        <div className="mt-4 w-full max-w-[360px]">
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
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-[360px] mt-12 pt-8 pb-6 flex gap-3 items-center justify-center">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="flex-1 max-w-[200px] h-[54px] text-sm bg-[#313131] hover:bg-[#414141] text-white font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center">
            Save to draft
          </button>
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
    </aside>
  );
}