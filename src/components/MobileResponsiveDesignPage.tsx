import { useState, useEffect } from 'react';
import ImageGenerationWorkflow from './ImageGenerationWorkflow';

interface MobileResponsiveDesignPageProps {
  // All props from DesignPage
  prompt: string;
  setPrompt: (value: string) => void;
  isAdvanced: boolean;
  selectedQuality: string;
  canGenerateImages: boolean;
  showWorkflow: boolean;
  error: string | null;
  isLoaded: boolean;
  usageLimits: any;
  remainingImages: number;
  canGenerateModels: boolean;
  hasProperties: () => boolean;
  generateEnhancedPrompt: (prompt: string) => string;
  handleCreateClick: () => void;
  handleAdvancedClick: () => void;
  handleQualityChange: (quality: string) => void;
  handleReset: () => void;
  handleWorkflowComplete: (designId: string) => void;
  handleWorkflowError: (error: string) => void;
  completedDesignId: string | null;
  handleViewDesign: () => void;
  // Children for desktop content
  desktopSidebar: React.ReactNode;
  desktopMainContent: React.ReactNode;
}

export default function MobileResponsiveDesignPage(props: MobileResponsiveDesignPageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop view - render as-is
  if (!isMobile) {
    return (
      <div className="w-screen h-screen bg-white flex justify-center p-0 fixed inset-0 overflow-hidden">
        {props.desktopSidebar}
        {props.desktopMainContent}
      </div>
    );
  }


  // Mobile view - optimized layout
  return (
    <div className="mobile-container w-screen min-h-screen bg-white overflow-x-hidden">
      {/* Mobile Header */}
      <div className="mobile-nav mobile-safe-top sticky top-0 z-50 bg-[#313131] border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="mobile-touch-target text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-white font-semibold text-lg">Playground</h1>
          
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="mobile-touch-target text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="mobile-scroll pb-20">
        {/* Input Section */}
        <div className="p-4 bg-[#313131]">
          <div className="relative w-full rounded-2xl bg-[#2a2a2a] p-4">
            <input
              placeholder="Turn landscape into portrait"
              value={props.prompt}
              onChange={(e) => props.setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  props.handleCreateClick();
                }
              }}
              className="mobile-input w-full bg-transparent text-white outline-none placeholder:text-gray-500"
              style={{ caretColor: '#E70D57' }}
            />
          </div>
          
          {/* Advanced Toggle */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={props.handleAdvancedClick}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                  props.isAdvanced ? 'bg-gradient-to-r from-[#E70D57] to-[#d10c50]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    props.isAdvanced ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-white/70 text-sm">Advanced</span>
            </div>
            
            <button 
              onClick={props.handleCreateClick}
              disabled={!props.canGenerateImages}
              className={`mobile-button px-6 py-2 rounded-full font-medium transition-all ${
                !props.canGenerateImages
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#E70D57] to-[#d10c50] text-white'
              }`}
            >
              Create
            </button>
          </div>
        </div>

        {/* Error Message */}
        {props.error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{props.error}</p>
          </div>
        )}

        {/* Usage Limits */}
        {props.usageLimits && (!props.canGenerateImages || !props.canGenerateModels) && (
          <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-red-800">Limit Reached</h4>
                  <p className="text-xs text-red-600">
                    {!props.canGenerateImages && `Images: ${props.remainingImages}/${props.usageLimits.limits.imagesPerMonth === -1 ? '∞' : props.usageLimits.limits.imagesPerMonth}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="mobile-button px-3 py-1 bg-[#E70D57] text-white text-xs font-medium rounded"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}


        {/* Workflow or Default Content */}
        {props.showWorkflow ? (
          <div className="mobile-image-gallery">
            <ImageGenerationWorkflow
              prompt={props.prompt}
              enhancedPrompt={props.hasProperties() ? props.generateEnhancedPrompt(props.prompt) : undefined}
              quality={props.selectedQuality as 'fast' | 'medium' | 'good'}
              onComplete={props.handleWorkflowComplete}
              onError={props.handleWorkflowError}
            />
          </div>
        ) : props.completedDesignId ? (
          <div className="mobile-image-gallery">
            <div className="mobile-image-item bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Success!</h3>
              <p className="text-sm text-gray-600 mb-4">Your design is ready</p>
              <button
                onClick={props.handleViewDesign}
                className="mobile-button w-full px-6 py-3 bg-gradient-to-r from-[#E70D57] to-[#F4900C] text-white font-medium rounded-full"
              >
                View Design
              </button>
            </div>
          </div>
        ) : (
          <div className="mobile-image-gallery">
            {/* Default placeholder images */}
            {[1, 2, 3].map((num) => (
              <div key={num} className="mobile-image-item bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <img 
                  src={`/camera${num}.png`} 
                  alt={`Design ${num}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            
            {/* Generate prompt */}
            <div className="mobile-image-item bg-white border border-gray-200 rounded-2xl flex items-center justify-center p-6">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm">Generate your design</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="mobile-dropdown open mobile-safe-bottom">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="mobile-touch-target text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Quality Selector */}
            <div className="mb-6">
              <label className="mobile-form-label">Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {['fast', 'medium', 'good'].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => {
                      props.handleQualityChange(quality);
                      setShowMobileMenu(false);
                    }}
                    className={`mobile-button py-2 rounded-lg font-medium capitalize transition-all ${
                      props.selectedQuality === quality
                        ? 'bg-[#E70D57] text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Reset Button */}
            {props.showWorkflow && (
              <button
                onClick={() => {
                  props.handleReset();
                  setShowMobileMenu(false);
                }}
                className="mobile-button w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile backdrop */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </div>
  );
}
