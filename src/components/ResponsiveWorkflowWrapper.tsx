import { useState, useEffect } from 'react';
import ImageGenerationWorkflow from './ImageGenerationWorkflow';

interface ResponsiveWorkflowWrapperProps {
  prompt: string;
  enhancedPrompt?: string;
  quality: 'fast' | 'medium' | 'good';
  onComplete: (designId: string) => void;
  onError: (error: string) => void;
}

/**
 * Mobile-optimized wrapper for ImageGenerationWorkflow
 * Automatically detects screen size and renders appropriate layout
 * Desktop: Maintains original 2-column grid layout
 * Mobile: Single-column stacked layout with touch-optimized buttons
 */
export default function ResponsiveWorkflowWrapper(props: ResponsiveWorkflowWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop: Use original component as-is
  if (!isMobile) {
    return <ImageGenerationWorkflow {...props} />;
  }

  // Mobile: Render with mobile-optimized styles
  return (
    <div className="mobile-workflow-container">
      <style>{`
        .mobile-workflow-container {
          width: 100%;
          padding: 16px;
          overflow-x: hidden;
        }
        
        /* Override desktop grid styles for mobile */
        .mobile-workflow-container .grid {
          display: flex !important;
          flex-direction: column !important;
          gap: 20px !important;
        }
        
        /* Mobile image containers */
        .mobile-workflow-container .grid > div {
          width: 100% !important;
          height: auto !important;
          min-height: 280px !important;
          max-height: 400px !important;
          margin: 0 !important;
          border-radius: 16px !important;
        }
        
        /* Mobile buttons - always visible */
        .mobile-workflow-container button {
          min-height: 44px !important;
          min-width: 44px !important;
          font-size: 14px !important;
          padding: 10px 16px !important;
          touch-action: manipulation;
        }
        
        /* Mobile View 3D button - always visible at bottom */
        .mobile-workflow-container .group .absolute {
          position: absolute !important;
          bottom: 12px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          opacity: 1 !important;
          z-index: 20 !important;
        }
        
        /* Remove hover effects on mobile */
        @media (hover: none) {
          .mobile-workflow-container .group:hover .absolute {
            opacity: 1 !important;
          }
          
          .mobile-workflow-container .backdrop-blur-sm {
            backdrop-filter: none !important;
          }
        }
        
        /* Mobile loading state */
        .mobile-workflow-container img[alt*="Generating"] {
          width: 120px !important;
          height: 120px !important;
        }
        
        /* Mobile selection indicators */
        .mobile-workflow-container .ring-2 {
          ring-width: 3px !important;
        }
        
        /* Mobile safe areas */
        .mobile-workflow-container {
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
        }
      `}</style>
      
      <ImageGenerationWorkflow {...props} />
    </div>
  );
}
