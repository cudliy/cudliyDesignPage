import  { useEffect, useRef, useState } from 'react';
import CreatePreviewPrintSection from './CreatePreviewPrintSection';

const HeroSection = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
  
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.1 }
      );
  
      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }
  
      return () => observer.disconnect();
    }, []);
  
    return (
      <section ref={sectionRef} className="relative w-full min-h-screen bg-white overflow-visible pb-16 md:pb-32 flex flex-col">
        {/* Centered headline group per spec */}
        <div
          className={`absolute z-20 pointer-events-none transition-all duration-1000 ease-out px-4 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            width: "100%",
            maxWidth: "1058px",
            left: "50%",
            transform: "translateX(-50%)",
            top: "clamp(200px, 28vh, 400px)",
          }}
        >
          {/* Main title */}
          <div
            className={`text-center transition-all duration-1200 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{
              width: "100%",
              maxWidth: "780px",
              margin: "0 auto 60px auto",
              transitionDelay: "200ms",
            }}
          >
            <h1
              className="font-abril mb-16 md:mb-20 lg:mb-24 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              style={{
                fontWeight: 600,
                fontStyle: "normal",
                lineHeight: "81%",
                letterSpacing: "2px",
                color: "#000",
              }}
            >
              <span className="mr-2 md:mr-4 transition-all duration-1000 hover:scale-105 inline-block animate-gentle-float">Design</span>
              <span className="bg-gradient-to-r from-[#E70A55] to-[#FF6B35] bg-clip-text text-transparent transition-all duration-1000 hover:scale-105 inline-block hover:from-[#FF6B35] hover:to-[#E70A55] animate-gradient-flow">Uniquely</span>
              <br />
              <div style={{ height: "40px" }}></div>
            </h1>
          </div>
  
          {/* 'in' outlined - positioned above iPad area */}
  <div
    className={`transition-all duration-1400 text-stroke ease-out font-abril animate-subtle-bounce ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
    }`}
    style={{
      position: "absolute",
      left: "clamp(1%, 8vw, 5%)",
      top: "clamp(10px, 20vh, 160px)",
      fontWeight: 800,
      fontSize: "clamp(80px, 15vw, 180px)",
      lineHeight: "100%",
      letterSpacing: "0px",
      WebkitTextStrokeWidth: "2px",
      WebkitTextStrokeColor: "#F84E3F",
      color: "transparent",
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      transitionDelay: "600ms",
      opacity: 1,
      zIndex: 10,
    }}
  >
    in
  </div>

  {/* '3d' outlined - positioned above iPad area */}
  <div
    className={`transition-all font-abril duration-1400 ease-out animate-gentle-scale ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
    }`}
    style={{
      position: "absolute",
      right: "clamp(2.4%, 8vw, 5%)",
      top: "clamp(10px, 20vh, 160px)",
      fontWeight: 800,
      fontSize: "clamp(80px, 15vw, 180px)",
      lineHeight: "100%",
      letterSpacing: "0px",
      WebkitTextStrokeWidth: "2px",
      WebkitTextStrokeColor: "#F84E3F",
      color: "transparent",
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      transitionDelay: "600ms",
      opacity: 1,
      zIndex: 10,
    }}
  >
    3d
  </div>
  </div>
        
        {/* Main Content Container */}
        <div className="relative z-10 flex items-center min-h-screen">
          <div className="container mx-auto px-4 md:px-8 pt-[340px] md:pt-[480px]">
            <div className="grid grid-cols-1 gap-8 items-center">
              {/* Text Content between headline and iPad */}
              <div className={`text-center md:text-left max-w-3xl mx-auto transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: "800ms" }}>
  
                {/* Description */}
                <p
                  className="text-gray-700 mt-6 md:mt-4 mb-2 md:mb-10 max-w-2xl font-manrope mx-auto text-center text-sm md:text-base px-4"
                  style={{
                    fontWeight: 500,
                    lineHeight: "27px",
                    letterSpacing: 0,
                  }}
                >
                  Create and ship heartfelt objects in less than 3 minutes!<br />
                  No software manuals, No endless settings
                </p>
  
             
              </div>
      
  
              {/* iPad mockup placed below */}
              <div className={`flex items-center justify-center mt-0 pb-4 md:pb-8 relative z-20 transition-all duration-1200 ease-out px-4 ${
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
              }`}
              style={{ transitionDelay: "1000ms" }}>
                {/* Orange platform background - positioned absolutely to extend beyond iPad */}
                <div 
                  className="absolute z-0 left-1/2 transform -translate-x-1/2"
                  style={{
                    width: "clamp(350px, 100vw, 1396px)",
                    maxWidth: "90vw",
                    height: "clamp(100px, 20vw, 258px)",
                    background: "#FBB871",
                    borderTopLeftRadius: "clamp(20px, 3vw, 40px)",
                    borderTopRightRadius: "clamp(20px, 3vw, 40px)",
                    opacity: 1,
                    bottom: "clamp(16px, 4vw, 32px)",
                  }}
                />
             
                <div className="relative w-full max-w-[300px] sm:max-w-[500px] md:max-w-[650px] lg:max-w-[800px] xl:max-w-[950px] group hover:scale-105 transition-transform duration-500 ease-out animate-gentle-float z-10">
                  <img
                    src="/iPad%20Pro.png"
                    alt="iPad Pro frame"
                    className="w-full h-auto select-none pointer-events-none drop-shadow-2xl group-hover:drop-shadow-3xl transition-all duration-500 ease-out"
                  />
   
      
                  {/* Hero GIF overlay contained within iPad screen */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                    style={{
                      top: "7.0%",
                      left: "3.1%",
                      right: "3.1%",
                      bottom: "0.0%",
                      borderRadius: "clamp(8px, 2vw, 20px)",
                    }}
                  >
                    
                    <img
                      src="/GIFS/Hero-page.gif"
                      alt="Interactive design playground demo"
                      className="w-full h-full object-cover rounded-[8px] md:rounded-[16px] shadow-lg group-hover:shadow-2xl transition-all duration-500 ease-out"
                    />
                    
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
        
        {/* CTA block placed in normal flow to avoid overlap with next section */}
        <div className={`relative z-20 w-full mt-6 md:mt-10 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: "1200ms" }}>
          <div className="container mx-auto px-4 md:px-8 flex flex-col items-center justify-center">
            <button
              className="bg-gradient-to-r mt-6 md:mt-10 from-[#E70A55] to-[#FF6B35] text-white font-semibold shadow-md hover:opacity-90 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out transform hover:from-[#FF6B35] hover:to-[#E70A55] animate-smooth-pulse px-6 md:px-10 py-3 md:py-4 rounded-full text-sm md:text-base w-auto"
              style={{
                minWidth: "180px",
                maxWidth: "229px",
              }}
            >
              Start Designing
            </button>
            <p
              className="text-center mt-3 mb-6 md:mb-10 text-gray-900 px-4 transition-all duration-1000 ease-out hover:opacity-80 text-xs md:text-sm lg:text-base"
              style={{
                maxWidth: "885px",
                opacity: 0.6,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Cudliy celebrate the act of making something unique for yourself or someone you love. No Design Experience needed!
              <br />
              <em>*No Credit Card Required!</em>
            </p>
          </div>
        </div>
  
        {/* 5 Semicircles section with images */}
        <div className={`relative w-full mt-16 md:mt-32 lg:mt-40 px-4 pb-8 md:pb-16 transition-all duration-1200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}
        style={{ transitionDelay: "1400ms" }}>
          <div className="flex justify-center items-start gap-3 sm:gap-4 md:gap-6 lg:gap-8 flex-wrap">
            {/* First semicircle - Concept Design */}
            <div className="flex flex-col items-center mb-8 md:mb-12 lg:mb-16 group hover:scale-105 transition-all duration-500 ease-out cursor-pointer animate-gentle-float">
              <div className="relative">
                <div
                  className="bg-[#D9D9D9] opacity-100 transition-all duration-300 group-hover:opacity-80"
                  style={{
                    width: "clamp(140px, 35vw, 235px)",
                    height: "clamp(63px, 16vw, 105px)",
                    borderTopLeftRadius: "clamp(70px, 18vw, 90px)",
                    borderTopRightRadius: "clamp(70px, 18vw, 90px)",
                  }}
                />
                <div
                  className="absolute top-[-60px] sm:top-[-80px] md:top-[-100px] lg:top-[-120px] left-1/2 transform -translate-x-1/2 transition-all duration-500 group-hover:-translate-y-2"
                  style={{
                    width: "clamp(150px, 35vw, 298px)",
                    height: "clamp(140px, 32vw, 300px)",
                    opacity: 1,
                  }}
                >
                  <img
                    src="/image 89.png"
                    alt="Concept Design"
                    className="w-full h-full object-contain transition-all duration-300 group-hover:filter-none"
                    style={{
                      imageRendering: "auto",
                      filter: "contrast(1.1) saturate(1.1)",
                    }}
                  />
                </div>
              </div>
              <p className="text-center mt-3 md:mt-4 lg:mt-6 text-xs sm:text-sm font-semibold text-gray-800 transition-colors duration-300 group-hover:text-[#E70A55]">Concept Design</p>
            </div>

            {/* Second semicircle - Accessories */}
            <div className="flex flex-col items-center mb-16 group hover:scale-105 transition-all duration-500 ease-out cursor-pointer animate-subtle-bounce">
              <div className="relative">
                <div
                  className="w-[235px] h-[105px] bg-[#D9D9D9] opacity-100 transition-all duration-300 group-hover:opacity-80"
                  style={{
                    borderTopLeftRadius: "90px",
                    borderTopRightRadius: "90px",
                    minWidth: "200px",
                    maxWidth: "235px",
                  }}
                />
                <div
                  className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 transition-all duration-500 group-hover:-translate-y-2"
                  style={{
                    width: "clamp(200px, 25vw, 298px)",
                    height: "clamp(200px, 25vw, 300px)",
                    opacity: 1,
                  }}
                >
                  <img
                    src="/image 85.png"
                    alt="Accessories"
                    className="w-[300px] h-[237px] object-contain transition-all duration-300 group-hover:filter-none"
                    style={{
                      imageRendering: "auto",
                      filter: "contrast(1.1) saturate(1.1)",
                    }}
                  />
                </div>
              </div>
              <p className="text-center mt-6 text-sm font-semibold text-gray-800 transition-colors duration-300 group-hover:text-[#FF6B35]">Accessories</p>
            </div>

            {/* Third semicircle - Custom Figurine */}
            <div className="flex flex-col items-center mb-16 group hover:scale-105 transition-all duration-500 ease-out cursor-pointer animate-smooth-pulse">
              <div className="relative">
                <div
                  className="w-[235px] h-[105px] bg-[#D9D9D9] opacity-100 transition-all duration-300 group-hover:opacity-80"
                  style={{
                    borderTopLeftRadius: "90px",
                    borderTopRightRadius: "90px",
                    minWidth: "200px",
                    maxWidth: "235px",
                  }}
                />
                <div
                  className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 transition-all duration-500 group-hover:-translate-y-2"
                  style={{
                    width: "clamp(200px, 25vw, 298px)",
                    height: "clamp(200px, 25vw, 300px)",
                    opacity: 1,
                  }}
                >
                  <img
                    src="/image 90.png"
                    alt="Custom Figurine"
                    className="w-[300px] h-[245px] object-contain transition-all duration-300 group-hover:filter-none"
                    style={{
                      imageRendering: "auto",
                      filter: "contrast(1.1) saturate(1.1)",
                    }}
                  />
                </div>
              </div>
              <p className="text-center mt-6 text-sm font-semibold text-gray-800 transition-colors duration-300 group-hover:text-[#FBB871]">Custom Figurine</p>
            </div>

            {/* Fourth semicircle - Interior Design */}
            <div className="flex flex-col items-center mb-16 group hover:scale-105 transition-all duration-500 ease-out cursor-pointer animate-gentle-scale">
              <div className="relative">
                <div
                  className="w-[235px] h-[105px] bg-[#D9D9D9] opacity-100 transition-all duration-300 group-hover:opacity-80"
                  style={{
                    borderTopLeftRadius: "90px",
                    borderTopRightRadius: "90px",
                    minWidth: "200px",
                    maxWidth: "235px",
                  }}
                />
                <div
                  className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 transition-all duration-500 group-hover:-translate-y-2"
                  style={{
                    width: "clamp(200px, 25vw, 298px)",
                    height: "clamp(200px, 25vw, 300px)",
                    opacity: 1,
                  }}
                >
                  <img
                    src="/image.png"
                    alt="Interior Design"
                    className="w-full h-full object-contain transition-all duration-300 group-hover:filter-none"
                    style={{
                      imageRendering: "auto",
                      filter: "contrast(1.1) saturate(1.1)",
                    }}
                  />
                </div>
              </div>
              <p className="text-center mt-6 text-sm font-semibold text-gray-800 transition-colors duration-300 group-hover:text-[#E70A55]">Interior Design</p>
            </div>

            {/* Fifth semicircle - Gifts */}
            <div className="flex flex-col items-center mb-16 group hover:scale-105 transition-all duration-500 ease-out cursor-pointer animate-gentle-float">
              <div className="relative">
                <div
                  className="w-[235px] h-[105px] bg-[#D9D9D9] opacity-100 transition-all duration-300 group-hover:opacity-80"
                  style={{
                    borderTopLeftRadius: "90px",
                    borderTopRightRadius: "90px",
                    minWidth: "200px",
                    maxWidth: "235px",
                  }}
                />
                <div
                  className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 transition-all duration-500 group-hover:-translate-y-2"
                  style={{
                    width: "clamp(200px, 25vw, 298px)",
                    height: "clamp(200px, 25vw, 300px)",
                    opacity: 1,
                  }}
                >
                  <img
                    src="/image 102.png"
                    alt="Gifts"
                    className="w-[300px] h-[250px] object-contain transition-all duration-300 group-hover:filter-none"
                    style={{
                      imageRendering: "auto",
                      filter: "contrast(1.1) saturate(1.1)",
                    }}
                  />
                </div>
              </div>
              <p className="text-center mt-6 text-sm font-semibold text-gray-800 transition-colors duration-300 group-hover:text-[#FF6B35]">Gifts</p>
            </div>
          </div>
        </div>
  
        {/* A New Way to Make section */}
        <div className={`relative w-full mt-8 md:mt-12 lg:mt-16 mb-8 md:mb-12 lg:mb-16 transition-all duration-1200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}
        style={{ transitionDelay: "1600ms" }}>
          <div className="container mx-auto px-4 flex flex-col items-center text-center">
            <h2
              className="font-abril hover:scale-105 transition-transform duration-500 ease-out cursor-default text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
              style={{
                fontWeight: 300,
                fontStyle: "normal",
                lineHeight: "100%",
                letterSpacing: 0,
              }}
            >
              <span className="mr-2 md:mr-3 transition-all duration-300 hover:text-[#E70A55] inline-block animate-gentle-float">A</span>
              <span className="bg-gradient-to-r from-[#E70A55] via-[#FF6B35] to-[#FBB871] bg-clip-text text-transparent mr-2 md:mr-3 transition-all duration-500 hover:from-[#FBB871] hover:via-[#FF6B35] hover:to-[#E70A55] inline-block animate-gradient-flow">New Way</span>
              <span className="transition-all duration-300 hover:text-[#FF6B35] inline-block animate-subtle-bounce">to Make</span>
            </h2>
            <p
              className="text-gray-900 text-xs sm:text-sm md:text-base px-4 mt-3 md:mt-4"
              style={{
                maxWidth: "90vw",
                opacity: 0.6,
              }}
            >
              Cudliy isn't just an AI Tech Company, it is a new way of Making thing with love
            </p>
          </div>
        </div>
  
        {/* Create Preview Print Section */}
        <CreatePreviewPrintSection />
  
        {/* Full Customization in Seconds section */}
        <div className={`relative w-full mt-12 md:mt-20 lg:mt-28 mb-8 md:mb-12 lg:mb-16 transition-all duration-1200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}
        style={{ transitionDelay: "1800ms" }}>
          <div className="container mx-auto px-4">
            {/* Section Title */}
            <div className="text-center mb-8 md:mb-12 lg:mb-16">
              <h2
                className="font-abril text-2xl sm:text-3xl md:text-4xl lg:text-5xl px-4"
                style={{
                  maxWidth: "100%",
                  fontWeight: 400,
                  fontStyle: "normal",
                  lineHeight: "81%",
                letterSpacing: "0%",
                textAlign: "center",
                verticalAlign: "middle",
                color: "#000",
                  margin: "0 auto 1rem",
                }}
              >
                Full Customization in Seconds
              </h2>
              <p
                className="text-gray-900 text-xs sm:text-sm md:text-base px-4"
                style={{
                  maxWidth: "593px",
                  opacity: 0.6,
                  fontFamily: "Manrope, sans-serif",
                  fontWeight: 500,
                  fontStyle: "normal",
                  lineHeight: "27px",
                  letterSpacing: "0%",
                  textAlign: "center",
                  verticalAlign: "middle",
                  margin: "1rem auto 0",
                }}
              >
                Make design choices in seconds. Use the advanced editing option to create specific modification
              </p>
            </div>
            
            {/* Main Content - Two Column Layout */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-24 lg:gap-36 max-w-5xl mx-auto">
              {/* Left Side - Color Picker Interface */}
              <div className="flex-shrink-0 group hover:scale-105 transition-transform duration-500 ease-out">
                <img
                  src="/GIFS/Color-wheel.gif"
                  alt="Color Picker Interface"
                  className=" ml-[20px]object-contain transition-all duration-300 group-hover:shadow-2xl animate-gentle-float"
                  style={{
                    width: "450px",
                    height: "380px",
                    borderRadius: "20px",
                    opacity: 1,
                    maxWidth: "100%",
                  }}
                />
              </div>
              
              {/* Right Side - Picture Color Mode GIF - Clean without border */}
              <div className="flex justify-center items-center flex-shrink-0">
                <div className="animate-gentle-float">
                  <img
                    src="/GIFS/Picture-color-mode.gif"
                    alt="Picture Color Mode"
                    className="object-contain"
                    style={{
                      width: "500px",
                      height: "400px",
                      maxWidth: "100%",
                      borderRadius: "20px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Gifts you can't Buy section */}
        <div className={`relative w-full mt-12 md:mt-20 lg:mt-28 mb-8 md:mb-12 lg:mb-16 transition-all duration-1200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}
        style={{ transitionDelay: "2000ms" }}>
          <div className="container mx-auto px-4">
            {/* Two Column Layout - Text and Scene GIF */}
            <div className="grid grid-cols-1 lg:grid-cols-2 items-start justify-items-start gap-8 lg:gap-12 max-w-6xl mx-auto">
              
              {/* Left Side - Scene GIF */}
              <div className="w-full flex justify-center lg:justify-start items-start">
                <div className="animate-gentle-float">
                  <img
                    src="/GIFS/Scene.gif"
                    alt="Scene Animation"
                    className="object-contain"
                    style={{
                      width: "514px",
                      height: "502px",
                      maxWidth: "100%",
                      borderRadius: "30px",
                      opacity: 1,
                    }}
                  />
                </div>
              </div>

              {/* Right Side - Text Content */}
              <div className="w-full flex flex-col items-start text-left" style={{ width: "609px" }}>
                <h2
                  className="transition-transform duration-500 ease-out cursor-default"
                  style={{
                    fontFamily: "FONTSPRING DEMO - Fromage ExtraBold, serif",
                    fontWeight: 800,
                    fontStyle: "normal",
                    fontSize: "76px",
                    lineHeight: "100%",
                    letterSpacing: "0%",
                    color: "#000",
                    width: "488px",
                    height: "176px",
                    opacity: 1,
                    margin: 0,
                  }}
                >
                  <span className="transition-all duration-300 hover:text-[#E70A55] inline-block animate-gentle-float">Make Gifts</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#E70A55] via-[#FF6B35] to-[#FBB871] bg-clip-text text-transparent transition-all duration-500 hover:from-[#FBB871] hover:via-[#FF6B35] hover:to-[#E70A55] inline-block animate-gradient-flow">you can't Buy</span>
                </h2>
                
                <h3
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontWeight: 700,
                    fontStyle: "normal",
                    fontSize: "20px",
                    lineHeight: "18px",
                    letterSpacing: "0%",
                    color: "#000",
                    margin: "20px 0 16px 0",
                  }}
                >
                  Design from the heart.
                </h3>
                
                <p
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontWeight: 400,
                    fontStyle: "normal",
                    fontSize: "15px",
                    lineHeight: "18px",
                    letterSpacing: "0%",
                    color: "#000",
                    margin: 0,
                    verticalAlign: "middle",
                  }}
                >
                  A memory, a moment, a little something that says you matter.
                  <br />
                  On Cudliy, every creation is made with love and that's the whole idea.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    );
  };
  
export default HeroSection;
  