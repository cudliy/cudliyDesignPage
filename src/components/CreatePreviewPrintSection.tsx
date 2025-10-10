import { useEffect, useState, useRef } from "react";

const CreatePreviewPrintSection = () => {
  const imageRef = useRef<HTMLImageElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  // Rotation values are applied directly to style; no need to keep in state

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isRotating || !imageRef.current) return;
      
      const deltaX = (e.clientX - startPosition.x) * 0.5;
      const deltaY = (e.clientY - startPosition.y) * 0.5;
      
      imageRef.current.style.transform = `perspective(1000px) rotateY(${deltaX}deg) rotateX(${-deltaY}deg)`;
    };

    const handleMouseUp = () => {
      if (!isRotating) return;
      
      setIsRotating(false);
      
      if (imageRef.current) {
        imageRef.current.style.cursor = 'grab';
        imageRef.current.style.transition = 'transform 0.5s ease-out';
        imageRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
      }
      
      // Show tooltip again after interaction
      setTimeout(() => {
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1';
        }
        if (imageRef.current) {
          imageRef.current.style.transition = 'transform 0.1s';
        }
      }, 500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isRotating || !imageRef.current) return;
      
      const deltaX = (e.touches[0].clientX - startPosition.x) * 0.5;
      const deltaY = (e.touches[0].clientY - startPosition.y) * 0.5;
      
      imageRef.current.style.transform = `perspective(1000px) rotateY(${deltaX}deg) rotateX(${-deltaY}deg)`;
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    if (isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRotating, startPosition]);

  const handleRotationStart = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
    e.preventDefault();
    setIsRotating(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setStartPosition({ x: clientX, y: clientY });
    
    if (imageRef.current) {
      imageRef.current.style.cursor = 'grabbing';
    }
    
    // Hide tooltip when interacting
    if (tooltipRef.current) {
      tooltipRef.current.style.opacity = '0';
    }
  };

  return (
    <section className="py-12 sm:py-16 gap-36 md:gap-40 lg:gap-48 md:py-20 mt-16 md:mt-24 lg:mt-32 px-4 sm:px-6 md:px-8" id="create-preview-print">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left side - Video Preview */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <video
                autoPlay
                loop
                muted
                playsInline
                onMouseDown={handleRotationStart}
                onTouchStart={handleRotationStart}
                className="w-full ml-20 max-w-lg lg:max-w-xl transition-transform duration-300 hover:scale-105"
                style={{ 
                  aspectRatio: "858/536",
                  borderRadius: "30px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #e5e7eb",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  objectFit: "cover",
                  objectPosition: "center",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <source src="/GIFS/Untitled video - Made with Clipchamp (1).mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Professional instruction tooltip */}
              <div 
                ref={tooltipRef}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-800 text-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-3 transition-opacity duration-300 font-medium"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-semibold">Click to rotate</span>
                </div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* 3D effect particles */}
              <div 
                className="absolute -top-4 -right-4 w-8 h-8 bg-pink-400 rounded-full opacity-20"
                style={{
                  animation: 'float 3s ease-in-out infinite'
                }}
              />
              <div 
                className="absolute -bottom-6 -left-6 w-12 h-12 bg-purple-400 rounded-full opacity-20"
                style={{
                  animation: 'float 3s ease-in-out infinite',
                  animationDelay: '1s'
                }}
              />
            </div>
          </div>

          {/* Right side - Text Content */}
          <div className="ml-16 text-center lg:text-left space-y-6 lg:space-y-8">
            <div className="space-y-2 lg:space-y-4">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-normal text-gray-300 leading-none font-abril tracking-tight">
                Create
              </h3>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-normal leading-none font-abril tracking-tight" style={{ background: 'linear-gradient(135deg, #E70A55 0%, #F4900C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Preview
              </h3>
              <div className="py-4 lg:py-6">
                <p className="text-base sm:text-lg lg:text-xl font-medium text-gray-700 max-w-md mx-auto lg:mx-0 leading-relaxed">
                  Experience your creation in real-time with our immersive 360° view. Rotate, zoom, and explore every detail before printing.
                </p>
              </div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-normal text-gray-300 leading-none font-abril tracking-tight">
                Print
              </h3>
            </div>
            
            {/* CTA Button */}
            <div className="pt-6">
              <button className="text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300" style={{ background: 'linear-gradient(135deg, #E70A55 0%, #F4900C 100%)' }}>
                Start Creating Now
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {/* Add CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .font-abril {
          font-family: 'Abril Fatface', serif;
        }
      `}</style>
    </section>
  );
};

export default CreatePreviewPrintSection;