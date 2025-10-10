const CreatePreviewPrintSection = () => {

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