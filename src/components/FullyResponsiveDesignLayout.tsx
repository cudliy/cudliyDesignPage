import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface FullyResponsiveDesignLayoutProps {
  children: ReactNode;
}

/**
 * Fully Responsive Design Layout Component
 * 
 * This component wraps the entire DesignPage and provides:
 * - Desktop: Original layout unchanged (sidebar + main content)
 * - Mobile: Optimized single-column layout with sticky header
 * - Tablet: Responsive sidebar with toggle
 * 
 * Features:
 * - Automatic device detection
 * - Touch-optimized interactions
 * - iOS safe area support
 * - Smooth transitions
 * - No desktop code changes required
 */
export default function FullyResponsiveDesignLayout({ children }: FullyResponsiveDesignLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Desktop: Render children as-is
  if (!isMobile && !isTablet) {
    return <>{children}</>;
  }

  // Mobile/Tablet: Apply responsive wrapper
  return (
    <>
      <style>{`
        /* ===== MOBILE OPTIMIZATIONS (< 768px) ===== */
        @media (max-width: 767px) {
          /* Force mobile layout */
          .w-screen.h-screen.bg-white.flex {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          
          /* Sidebar becomes full-width header */
          aside.left-pane-scale {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-top: none !important;
          }
          
          /* Sidebar content adjustments */
          .left-pane-content {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Hide desktop mode selector on mobile */
          .left-pane-content > div[class*="absolute top-[70px]"] {
            display: none !important;
          }
          
          /* Mobile title sizing */
          .left-pane-content h1 {
            font-size: 2rem !important;
            margin-top: 0.5rem !important;
          }
          
          /* Mobile subtitle */
          .left-pane-content p {
            font-size: 0.875rem !important;
          }
          
          /* Input container mobile */
          .left-pane-content > div[class*="mt-3 w-full max-w-[320px]"] {
            max-width: 100% !important;
            padding: 0 1rem !important;
          }
          
          /* Mobile input field */
          .left-pane-content input {
            font-size: 16px !important; /* Prevents iOS zoom */
            min-height: 44px !important;
            padding-right: 3.5rem !important;
          }
          
          /* Mobile advanced toggle */
          .left-pane-content button[class*="inline-flex h-4 w-8"] {
            height: 1.5rem !important;
            width: 2.75rem !important;
          }
          
          /* Hide advanced categories on mobile */
          .left-pane-content > div[class*="flex-grow"] {
            display: none !important;
          }
          
          /* Main content area mobile */
          .flex-1.min-w-0.flex.flex-col {
            width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
            border: none !important;
            min-height: 60vh !important;
          }
          
          /* Mobile grid layout - ALL grids */
          .grid.grid-cols-2,
          .grid[style*="grid-template-columns"],
          div[style*="display: grid"] {
            display: flex !important;
            flex-direction: column !important;
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
            padding: 1rem !important;
            margin: 0 !important;
          }
          
          /* Mobile grid items */
          .grid.grid-cols-2 > div,
          .grid[style*="grid-template-columns"] > div,
          div[style*="display: grid"] > div {
            width: 100% !important;
            height: 280px !important;
            min-height: 280px !important;
            max-height: 350px !important;
            margin: 0 !important;
            margin-left: 0 !important;
            border-radius: 1rem !important;
          }
          
          /* ImageGenerationWorkflow specific */
          .w-full.mx-auto.pt-0.mt-0 {
            padding: 1rem !important;
            max-width: 100% !important;
          }
          
          /* Workflow grid container */
          .w-full.mx-auto.pt-0.mt-0 .grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 1rem !important;
          }
          
          /* Workflow images */
          .w-full.mx-auto.pt-0.mt-0 .grid > div {
            width: 100% !important;
            margin: 0 !important;
          }
          
          /* Mobile images */
          .grid.grid-cols-2 img {
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          /* Mobile buttons */
          button {
            min-height: 44px !important;
            min-width: 44px !important;
            touch-action: manipulation !important;
          }
          
          /* Mobile View 3D button - always visible */
          .group .absolute.inset-0,
          .group .absolute.bottom-3,
          .group > div > .absolute {
            position: absolute !important;
            bottom: 1rem !important;
            top: auto !important;
            left: 50% !important;
            right: auto !important;
            inset: auto !important;
            transform: translateX(-50%) !important;
            opacity: 1 !important;
            backdrop-filter: none !important;
            background: transparent !important;
          }
          
          /* Mobile button sizing */
          .group .absolute button,
          .group button {
            padding: 0.625rem 1.25rem !important;
            font-size: 0.875rem !important;
            border-radius: 0.75rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          
          /* Force mobile layout for workflow */
          .md\\:grid-cols-2 {
            grid-template-columns: 1fr !important;
          }
          
          /* Mobile responsive classes override */
          .md\\:h-\\[320px\\],
          .md\\:min-h-\\[300px\\] {
            height: 280px !important;
            min-height: 280px !important;
          }
          
          /* Mobile padding overrides */
          .md\\:px-0,
          .px-4.md\\:px-0 {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          
          /* Mobile gap overrides */
          .md\\:gap-1,
          .lg\\:gap-1,
          .xl\\:gap-2 {
            gap: 1rem !important;
          }
          
          /* Mobile margin overrides */
          .md\\:ml-\\[-20px\\],
          .lg\\:ml-\\[-15px\\],
          .xl\\:ml-\\[-10px\\] {
            margin-left: 0 !important;
          }
          
          /* Remove hover effects on mobile */
          @media (hover: none) {
            .group:hover .absolute {
              opacity: 1 !important;
            }
            
            *:hover {
              transform: none !important;
            }
          }
          
          /* Mobile loading states */
          .mobile-loading img[src*="Loading-State.gif"] {
            width: 120px !important;
            height: 120px !important;
          }
          
          /* Mobile safe areas (notched devices) */
          .left-pane-content {
            padding-top: calc(1rem + env(safe-area-inset-top)) !important;
          }
          
          .grid.grid-cols-2 {
            padding-bottom: calc(1rem + env(safe-area-inset-bottom)) !important;
          }
          
          /* Mobile workspace dropdown */
          .absolute.top-4.left-4 {
            top: calc(0.5rem + env(safe-area-inset-top)) !important;
            left: 1rem !important;
          }
          
          /* Mobile floating help button */
          .fixed.bottom-4.right-4 {
            bottom: calc(1rem + env(safe-area-inset-bottom)) !important;
            right: 1rem !important;
            width: 3rem !important;
            height: 3rem !important;
          }
          
          /* Mobile cancel button */
          .absolute.top-4.right-4.z-20 {
            top: 1rem !important;
            right: 1rem !important;
          }
          
          /* Mobile usage limits banner */
          .bg-gradient-to-r.from-red-50 {
            margin: 0 1rem !important;
            font-size: 0.75rem !important;
          }
          
          /* Mobile error message */
          .text-red-400.text-sm {
            margin: 0 1rem !important;
            padding: 0.75rem !important;
            background: rgba(254, 202, 202, 0.2) !important;
            border-radius: 0.5rem !important;
          }
          
          /* Mobile modal */
          .fixed.inset-0.z-50 > div[class*="bg-gradient-to-br"] {
            width: 90vw !important;
            max-width: 500px !important;
            height: auto !important;
            max-height: 80vh !important;
            padding: 1.5rem !important;
            overflow-y: auto !important;
          }
          
          /* Mobile modal video */
          .fixed.inset-0.z-50 video {
            width: 100% !important;
            height: auto !important;
            max-height: 40vh !important;
          }
          
          /* Mobile text selection disabled for better UX */
          .left-pane-content h1,
          .left-pane-content p {
            -webkit-user-select: none;
            user-select: none;
          }
          
          /* Mobile smooth scrolling */
          * {
            -webkit-overflow-scrolling: touch !important;
          }
          
          /* ===== WORKFLOW SPECIFIC MOBILE OPTIMIZATIONS ===== */
          
          /* Target all grid containers in workflow */
          [class*="grid"],
          [class*="Grid"] {
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Ensure single column for all grid children */
          [class*="grid"] > div,
          [class*="Grid"] > div {
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Mobile image containers */
          .bg-white.flex.items-center.justify-center {
            width: 100% !important;
            margin: 0 !important;
          }
          
          /* Mobile image wrapper */
          .relative.group {
            width: 100% !important;
          }
          
          /* Mobile images full width */
          img[alt*="Generated image"],
          img[alt*="Toy camera"] {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          
          /* Mobile loading GIF sizing */
          img[src*="Loading-State.gif"],
          img[alt*="Loading"],
          img[alt*="Generating"] {
            width: 120px !important;
            height: 120px !important;
            max-width: 120px !important;
            max-height: 120px !important;
          }
          
          /* Mobile selection indicators */
          .absolute.top-2.right-2,
          .absolute.top-2.left-2,
          .absolute.top-3.right-3,
          .absolute.top-3.left-3 {
            width: 2rem !important;
            height: 2rem !important;
          }
          
          /* Mobile View 3D button container */
          .absolute.bottom-3.left-1\\/2 {
            bottom: 1rem !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            opacity: 1 !important;
            z-index: 20 !important;
          }
          
          /* Remove desktop hover overlays on mobile */
          .md\\:absolute.md\\:inset-0,
          .md\\:opacity-0 {
            position: absolute !important;
            opacity: 1 !important;
            inset: auto !important;
            bottom: 1rem !important;
            top: auto !important;
          }
          
          /* Mobile button text sizing */
          button span {
            font-size: 0.875rem !important;
          }
          
          /* Mobile SVG icon sizing */
          button svg {
            width: 1rem !important;
            height: 1rem !important;
          }
          
          /* Workflow container padding */
          .w-full.mx-auto {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          /* Remove max-width constraints on mobile */
          .max-w-4xl,
          .md\\:max-w-4xl {
            max-width: 100% !important;
          }
          
          /* Mobile space-y overrides */
          .space-y-0 {
            gap: 1rem !important;
          }
          
          /* Ensure proper stacking */
          .flex-1.pl-0.pr-0 {
            padding: 1rem !important;
          }
        }
        
        
        /* ===== TABLET OPTIMIZATIONS (768px - 1023px) ===== */
        @media (min-width: 768px) and (max-width: 1023px) {
          /* Tablet sidebar */
          aside.left-pane-scale {
            width: clamp(280px, 30vw, 320px) !important;
          }
          
          /* Tablet grid - 2 columns maintained */
          .grid.grid-cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          
          /* Tablet images */
          .grid.grid-cols-2 > div {
            height: 240px !important;
            min-height: 220px !important;
          }
        }
        
        /* ===== LANDSCAPE MOBILE (< 768px height) ===== */
        @media (max-width: 767px) and (orientation: landscape) {
          .left-pane-content {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          
          .left-pane-content h1 {
            font-size: 1.5rem !important;
            margin-top: 0.25rem !important;
          }
          
          .grid.grid-cols-2 > div {
            height: 200px !important;
            min-height: 180px !important;
          }
        }
        
        /* ===== DARK MODE SUPPORT ===== */
        @media (prefers-color-scheme: dark) and (max-width: 767px) {
          .bg-white {
            background-color: #1F2937 !important;
          }
          
          .text-gray-800 {
            color: #F9FAFB !important;
          }
          
          .border-gray-200 {
            border-color: #374151 !important;
          }
        }
        
        /* ===== REDUCED MOTION ===== */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* ===== HIGH DPI DISPLAYS ===== */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          img {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
        }
        
        /* ===== ACCESSIBILITY ===== */
        @media (max-width: 767px) {
          /* Focus visible for keyboard navigation */
          *:focus-visible {
            outline: 2px solid #3B82F6 !important;
            outline-offset: 2px !important;
          }
          
          /* Larger touch targets for accessibility */
          button, a, input, select, textarea {
            min-height: 44px !important;
            min-width: 44px !important;
          }
        }
      `}</style>
      
      {children}
    </>
  );
}
