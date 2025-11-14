import React, { useEffect, useRef, useState } from 'react';

// Import model-viewer only if not already defined
if (typeof customElements !== 'undefined' && !customElements.get('model-viewer')) {
  import('@google/model-viewer');
}

interface ModelViewerProps {
  modelUrl: string;
  className?: string;
  // Control props from sidebar
  lighting?: number; // 0-100 -> controls exposure and light intensity
  background?: number; // 0-100 -> controls environment lighting
  size?: number; // 0-100 -> controls field of view (zoom)
  cameraAngle?: number; // 0-100 -> controls camera orbit position
  onError?: (error: string) => void; // Callback for error handling
}

export default function ModelViewer({ 
  modelUrl, 
  className = '',
  lighting = 50,
  background = 50,
  size = 50,
  cameraAngle = 50,
  onError
}: ModelViewerProps) {
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const modelViewerRef = useRef<any>(null);
  const modelElementRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!modelUrl) {
      setLoadingState('error');
      setErrorMessage('Missing model URL');
      onError?.('Missing model URL');
      return;
    }

    // Validate URL format
    try {
      new URL(modelUrl);
    } catch (error) {
      setLoadingState('error');
      setErrorMessage('Invalid model URL format');
      onError?.('Invalid model URL format');
      return;
    }

    setLoadingState('loading');
    setErrorMessage('');

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a timeout for model loading (45 seconds for large models)
    timeoutRef.current = setTimeout(() => {
      setLoadingState(currentState => {
        if (currentState === 'loading') {
          const timeoutError = 'Model loading timed out. The model might be too large or the server is slow.';
          setErrorMessage(timeoutError);
          onError?.(timeoutError);
          return 'error';
        }
        return currentState;
      });
    }, 45000);

    const createModelViewer = () => {
      // Check if model-viewer custom element is available
      if (typeof customElements !== 'undefined' && !customElements.get('model-viewer')) {
        // Wait a bit and try again
        setTimeout(createModelViewer, 100);
        return;
      }
      
      if (modelViewerRef.current && modelUrl) {
        // Clear existing content
        modelViewerRef.current.innerHTML = '';
        
        // Create model-viewer element
        const modelViewer = document.createElement('model-viewer');
        
        // Basic attributes
        modelViewer.setAttribute('src', modelUrl);
        modelViewer.setAttribute('alt', '3D Model');
        modelViewer.setAttribute('camera-controls', '');
        modelViewer.setAttribute('auto-rotate', '');
        modelViewer.setAttribute('interaction-prompt', 'Click & hold to rotate');
        
        // Camera settings
        modelViewer.setAttribute('camera-orbit', '45deg 75deg 2.5m');
        modelViewer.setAttribute('field-of-view', '30deg');
        modelViewer.setAttribute('min-camera-orbit', 'auto auto 1m');
        modelViewer.setAttribute('max-camera-orbit', 'auto auto 10m');
        modelViewer.setAttribute('min-field-of-view', '10deg');
        modelViewer.setAttribute('max-field-of-view', '45deg');
        
        // Loading and rendering settings
        modelViewer.setAttribute('loading', 'eager');
        modelViewer.setAttribute('reveal', 'auto');
        modelViewer.setAttribute('interpolation-decay', '200');
        
        // Lighting and materials
        modelViewer.setAttribute('shadow-intensity', '1');
        modelViewer.setAttribute('shadow-softness', '0.5');
        modelViewer.setAttribute('exposure', '1');
        modelViewer.setAttribute('tone-mapping', 'commerce');
        modelViewer.setAttribute('poster-color', 'transparent');
        
        // Use default environment (no custom environment images)
        // This prevents HDR loading errors
        
        // Interaction settings
        modelViewer.setAttribute('enable-pan', '');
        modelViewer.setAttribute('auto-rotate-delay', '0');
        modelViewer.setAttribute('interaction-policy', 'allow-when-focused');
        
        // Ensure proper rendering
        modelViewer.setAttribute('render-scale', '1');
        modelViewer.setAttribute('preload', '');
        modelViewer.setAttribute('quick-look-browsers', 'safari chrome');
        
        // Add specific attributes for glTF files
        modelViewer.setAttribute('ios-src', modelUrl);
        modelViewer.setAttribute('ar', '');
        modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
        
        // Set styles
        modelViewer.style.width = '100%';
        modelViewer.style.height = '100%';
        modelViewer.style.backgroundColor = 'transparent';
        
        // Add event listeners
        modelViewer.addEventListener('load', () => {
          handleLoad();
        });
        
        modelViewer.addEventListener('error', (event) => {
          console.error('ModelViewer: Model loading error:', event);
          console.error('ModelViewer: Model URL:', modelUrl);
          console.error('ModelViewer: Error details:', {
            type: event.type,
            target: event.target,
            detail: (event as any).detail,
            src: modelViewer.src
          });
          handleError('Model loading failed');
        });
        
        modelViewer.addEventListener('model-visibility', (event) => {
          console.log('ModelViewer: Model visibility changed:', event);
        });
        
        modelViewer.addEventListener('progress', (event) => {
          console.log('ModelViewer: Loading progress:', event);
        });
        
        // Store reference to model element for controls
        modelElementRef.current = modelViewer;
        
        // Append to container
        modelViewerRef.current.appendChild(modelViewer);
        
        // Apply initial control values
        updateControls(modelViewer);
      }
    };

    // Model Viewer is now imported as a module, so we can create it immediately
    createModelViewer();

    return () => {
      // Cleanup any existing model viewer
      if (modelViewerRef.current) {
        modelViewerRef.current.innerHTML = '';
      }
      // Clear timeout on cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [modelUrl, onError]); // Remove the fallback string to avoid dependency issues

  // Helper function to convert 0-100 values to appropriate ranges
  const updateControls = (modelViewer: any) => {
    if (!modelViewer) return;

    // Ensure textures are always enabled
    modelViewer.setAttribute('shadow-intensity', '1');
    modelViewer.setAttribute('shadow-softness', '0.5');
    modelViewer.setAttribute('tone-mapping', 'commerce');
    modelViewer.setAttribute('material-variant', 'default');
    modelViewer.setAttribute('variant', 'default');

    // Lighting (0-100) -> Controls exposure
    const lightingNormalized = lighting / 100;
    
    // Exposure for direct lighting (0.5 - 2.0)
    const exposureValue = 0.5 + lightingNormalized * 1.5;
    modelViewer.setAttribute('exposure', exposureValue.toString());

    // Background (0-100) -> Controls scene background color/intensity
    const backgroundIntensity = background / 100;
    
    // Set background color without using skybox images
    if (backgroundIntensity < 0.2) {
      modelViewer.style.backgroundColor = '#1a1a1a'; // Dark
    } else if (backgroundIntensity < 0.4) {
      modelViewer.style.backgroundColor = '#404040'; // Medium-dark
    } else if (backgroundIntensity < 0.6) {
      modelViewer.style.backgroundColor = '#808080'; // Medium
    } else if (backgroundIntensity < 0.8) {
      modelViewer.style.backgroundColor = '#c0c0c0'; // Light
    } else {
      modelViewer.style.backgroundColor = '#ffffff'; // White
    }
    
    // Also set the container background to match
    const bgColor = Math.round(backgroundIntensity * 255);
    const containerBg = `rgb(${bgColor}, ${bgColor}, ${bgColor})`;
    if (modelViewer.parentElement) {
      modelViewer.parentElement.style.backgroundColor = containerBg;
    }
    
    // Size (0-100) -> Field of View (60deg - 15deg) - REVERSED so higher = bigger
    const fovValue = 60 - (size / 100) * 45; // Higher size = lower FOV = bigger appearance
    modelViewer.setAttribute('field-of-view', `${fovValue}deg`);

    // Camera Angle (0-100) -> Camera Orbit theta (0deg - 360deg)
    const thetaValue = (cameraAngle / 100) * 360;
    const currentOrbit = modelViewer.getAttribute('camera-orbit') || '45deg 75deg 2.5m';
    const orbitParts = currentOrbit.split(' ');
    const newOrbit = `${thetaValue}deg ${orbitParts[1]} ${orbitParts[2]}`;
    modelViewer.setAttribute('camera-orbit', newOrbit);
  };

  // Update controls when props change
  useEffect(() => {
    if (modelElementRef.current) {
      updateControls(modelElementRef.current);
    }
  }, [lighting, background, size, cameraAngle]);

  const handleLoad = () => {
    console.log('ModelViewer: Model loaded successfully');
    setLoadingState('loaded');
    // Clear timeout on successful load
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleError = (event: any) => {
    console.error('ModelViewer: Error loading model:', event);
    console.error('ModelViewer: Error details:', {
      type: event.type,
      target: event.target,
      currentSrc: event.target?.src,
      error: event.detail
    });
    const errorMsg = 'Failed to load 3D model. Please check the model file.';
    setLoadingState('error');
    setErrorMessage(errorMsg);
    onError?.(errorMsg);
    // Clear timeout on error
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Check if model-viewer custom element is available
  const isModelViewerAvailable = typeof customElements !== 'undefined' && customElements.get('model-viewer');

  return (
    <div className={`w-full h-full min-h-[400px] max-w-full max-h-full rounded-lg overflow-hidden relative ${className}`}>
      {/* Direct Model Viewer - Primary approach */}
      {loadingState !== 'error' && modelUrl && isModelViewerAvailable && React.createElement('model-viewer', {
        ref: (el: any) => {
          if (el) {
            modelElementRef.current = el;
            // Apply controls when element is mounted
            setTimeout(() => updateControls(el), 100);
          }
        },
        src: modelUrl,
        alt: '3D Model',
        'camera-controls': '',
        'auto-rotate': '',
        'interaction-prompt': 'Click & hold to rotate',
        'camera-orbit': '45deg 75deg 2.5m',
        'field-of-view': '30deg',
        'min-camera-orbit': 'auto auto 1m',
        'max-camera-orbit': 'auto auto 10m',
        'min-field-of-view': '10deg',
        'max-field-of-view': '45deg',
        'interpolation-decay': '200',
        loading: 'eager',
        reveal: 'auto',
        'shadow-intensity': '1',
        'shadow-softness': '0.5',
        exposure: '1',
        'tone-mapping': 'commerce',
        'enable-pan': '',
        'interaction-policy': 'allow-when-focused',
        'render-scale': '1',
        preload: '',
        'quick-look-browsers': 'safari chrome',
        'ios-src': modelUrl,
        ar: '',
        'ar-modes': 'webxr scene-viewer quick-look',
        style: {
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff' // Start with white, will be controlled by background slider
        },
        onLoad: handleLoad,
        onError: handleError
      })}
      
      {/* Fallback DOM Container */}
      <div 
        ref={modelViewerRef}
        className="w-full h-full"
        style={{ 
          backgroundColor: '#ffffff',
          display: loadingState === 'error' || !modelUrl || !isModelViewerAvailable ? 'block' : 'none'
        }}
      />
      
      {/* Loading State */}
      {(loadingState === 'loading' || !isModelViewerAvailable) && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
          <div className="text-center">
            <img
              src="/GIFS/Loading-State.gif"
              alt="Loading 3D model"
              className="w-48 h-48 object-contain mx-auto mb-4"
            />
            <p className="text-sm text-gray-600">
              {!isModelViewerAvailable ? 'Initializing 3D viewer...' : 'Loading 3D model...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {loadingState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-800 mb-1">Failed to load 3D model</p>
            <p className="text-xs text-gray-500 break-words">{errorMessage}</p>
            <div className="text-xs text-gray-400 mt-2">
              <p>Model URL: {modelUrl}</p>
              <p>Model Viewer Available: {isModelViewerAvailable ? 'Yes' : 'No'}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-3 py-1 text-xs bg-[#E70D57] text-white rounded-md hover:bg-[#d10c50] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}