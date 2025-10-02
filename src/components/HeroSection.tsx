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
      <section ref={sectionRef} className="relative w-full min-h-screen bg-white overflow-visible pb-32 flex flex-col">
        {/* Centered headline group per spec */}
        <div
          className={`absolute z-20 pointer-events-none transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            width: "1058px",
            height: "278px",
            left: "calc(50% - 1058px/2)",
            top: "296px",
            transform: "rotate(0deg)",
          }}
        >
          {/* Main title */}
          <div
            className={`text-center transition-all duration-1200 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{
              width: "780px",
              height: "78px",
              left: "calc(50% - 780px/2)",
              top: "-52px",
              position: "absolute",
              transitionDelay: "200ms",
            }}
          >
            <h1
              className="font-abril"
              style={{
                fontWeight: 600,
                fontStyle: "normal",
                fontSize: "96px",
                lineHeight: "81%",
                letterSpacing: "2px",
                color: "#000",
              }}
            >
              <span className="mr-4 transition-all duration-1000 hover:scale-105 inline-block animate-gentle-float">Design</span>
              <span className="bg-gradient-to-r from-[#E70A55] to-[#FF6B35] bg-clip-text text-transparent transition-all duration-1000 hover:scale-105 inline-block hover:from-[#FF6B35] hover:to-[#E70A55] animate-gradient-flow">Uniquely</span>
            </h1>
          </div>
  
          {/* 'in' outlined */}
  {/* 'in' outlined - Fixed */}
  <div
    className={`transition-all duration-1400 text-stroke ease-out font-abril animate-subtle-bounce ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
    }`}
    style={{
      position: "absolute",
      left: "calc(60% - 187px/2 - 495px)",
      top: "45px",
      fontWeight: 800,
      fontSize: "170px",
      lineHeight: "100%",
      letterSpacing: "0px",
      WebkitTextStrokeWidth: "1px",
      WebkitTextStrokeColor: "#F84E3F",
      color: "transparent",
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      transitionDelay: "600ms",
    }}
  >
    in
  </div>
  
  {/* '3d' outlined - Fixed */}
  <div
    className={`transition-all font-abril duration-1400 ease-out animate-gentle-scale ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
    }`}
    style={{
      position: "absolute",
      left: "calc(50% - 244px/2 + 393px)",
      top: "45px",
      fontWeight: 800,
      fontSize: "170px",
      lineHeight: "100%",
      letterSpacing: "0px",
      WebkitTextStrokeWidth: "1px",
      WebkitTextStrokeColor: "#F84E3F",
      color: "transparent",
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      transitionDelay: "600ms",
    }}
  >
    3d
  </div>
  </div>
        
        {/* Beautiful background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-300 to-orange-300 rounded-full blur-3xl animate-gentle-float"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full blur-2xl animate-subtle-bounce"></div>
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-gradient-to-br from-green-300 to-yellow-300 rounded-full blur-2xl animate-smooth-pulse"></div>
          <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-gradient-to-br from-red-300 to-purple-300 rounded-full blur-xl animate-gentle-scale"></div>
          <div className="absolute bottom-1/3 left-1/4 w-28 h-28 bg-gradient-to-br from-cyan-300 to-pink-300 rounded-full blur-3xl animate-gentle-float"></div>
        </div>
  
        {/* Main Content Container */}
        <div className="relative z-10 flex items-center min-h-screen">
          <div className="container mx-auto px-4 md:px-8 pt-[420px]">
            <div className="grid grid-cols-1 gap-8 items-center">
              {/* Text Content between headline and iPad */}
              <div className={`text-center md:text-left max-w-3xl mx-auto transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: "800ms" }}>
  
                {/* Description */}
                <p
                  className="text-gray-700 mt-[-30px] mb-10 max-w-2xl font-manrope mx-auto text-center"
                  style={{
                    fontWeight: 500,
                    fontSize: "16px",
                    lineHeight: "27px",
                    letterSpacing: 0,
                  }}
                >
                  Create and ship heartfelt objects in less than 3 minutes!<br />
                  No software manuals, No endless settings
                </p>
  
             
              </div>
      
  
              {/* iPad mockup placed below */}
              <div className={`flex items-center justify-center mt-0 pb-8 relative z-20 transition-all duration-1200 ease-out ${
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
              }`}
              style={{ transitionDelay: "1000ms" }}>
      
                <div className="relative md:max-w-[800px] lg:max-w-[650px] xl:max-w-[1053px] group hover:scale-105 transition-transform duration-500 ease-out animate-gentle-float">
                <div className="absolute z-0 left-1/2 transform -translate-x-1/2"
          style={{
            width: "clamp(200px, 100vw, 1396px)",
            height: "clamp(120px, 15vw, 258px)",
            background: "#FBB871",
            borderTopLeftRadius: "40px",
            borderTopRightRadius: "40px",
            opacity: 1,
            bottom: "0",
          }}
        />
                  <img
                    src="/iPad%20Pro.png"
                    alt="iPad Pro frame"
                    className="w-[950px] h-[500px] select-none pointer-events-none drop-shadow-2xl group-hover:drop-shadow-3xl transition-all duration-500 ease-out"
                  />
  
                  {/* Rectangle overlay contained within iPad screen */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      top: "6.0%",
                      left: "3.1%",
                      right: "3.1%",
                      bottom: "1.0%",
                      borderRadius: "20px",
                    }}
                  >
                    <img
                      src="/Rectangle%20346240866.png"
                      alt="iPad screen content"
                      className="w-full h-[475px] rounded-[16px] shadow-lg group-hover:shadow-2xl transition-all duration-500 ease-out"
                    />
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
        
        {/* CTA block placed in normal flow to avoid overlap with next section */}
        <div className={`relative z-20 w-full mt-10 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: "1200ms" }}>
          <div className="container mx-auto px-4 md:px-8 flex flex-col items-center justify-center">
            <button
              style={{
                width: "229px",
                height: "55px",
                borderRadius: "40px",
                paddingTop: "14px",
                paddingRight: "40px",
                paddingBottom: "14px",
                paddingLeft: "40px",
                gap: "10px",
              }}
              className="bg-gradient-to-r mt-10 from-[#E70A55] to-[#FF6B35] text-white font-semibold shadow-md hover:opacity-90 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out transform hover:from-[#FF6B35] hover:to-[#E70A55] animate-smooth-pulse"
            >
              Start Designing
            </button>
            <p
              className="text-center mt-3 mb-10 text-gray-900 px-4 transition-all duration-1000 ease-out hover:opacity-80"
              style={{
                maxWidth: "885px",
                height: "54px",
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
        <div className={`relative w-full mt-40 px-4 pb-16 transition-all duration-1200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}
        style={{ transitionDelay: "1400ms" }}>
          <div className="flex justify-center items-start gap-4 sm:gap-6 md:gap-8 flex-wrap">
            {/* First semicircle - Concept Design */}
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
                    src="/image 89.png"
                    alt="Concept Design"
                    className="w-[300px] h-[285px] object-contain transition-all duration-300 group-hover:filter-none"
                    style={{
                      imageRendering: "auto",
                      filter: "contrast(1.1) saturate(1.1)",
                    }}
                  />
                </div>
              </div>
              <p className="text-center mt-6 text-sm font-semibold text-gray-800 transition-colors duration-300 group-hover:text-[#E70A55]">Concept Design</p>
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
        <div className={`relative w-full mt-10 mb-24 transition-all duration-1200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}
        style={{ transitionDelay: "1600ms" }}>
          {/* Glass.png background elements */}
          <div className="pointer-events-none absolute inset-0 -z-0">
            {/* Left glass element */}
            <div
              className="absolute animate-gentle-float"
              style={{
                left: "4%",
                top: "18%",
                transform: "rotate(-15deg)",
              }}
            >
              <img
                src="/Glass.png"
                alt="Glass element"
                style={{
                  width: "320px",
                  height: "290px",
                  objectFit: "contain",
                  opacity: 1,
                  filter: "drop-shadow(0 35px 90px rgba(0,0,0,0.28))",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                }}
              />
            </div>
            
            {/* Right glass element */}
            <div
              className="absolute animate-subtle-bounce"
              style={{
                right: "6%",
                top: "28%",
                transform: "rotate(20deg)",
              }}
            >
              <img
                src="/Glass.png"
                alt="Glass element"
                style={{
                  width: "320px",
                  height: "290px",
                  objectFit: "contain",
                  opacity: 1,
                  filter: "drop-shadow(0 35px 90px rgba(0,0,0,0.28))",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                }}
              />
            </div>
          </div>
  
          <div className="container mx-auto px-4 flex flex-col items-center text-center">
            <h2
              className="font-abril hover:scale-105 transition-transform duration-500 ease-out cursor-default"
              style={{
                fontWeight: 300,
                fontStyle: "normal",
                fontSize: "72px",
                lineHeight: "100%",
                letterSpacing: 0,
              }}
            >
              <span className="mr-3 transition-all duration-300 hover:text-[#E70A55] inline-block animate-gentle-float">A</span>
              <span className="bg-gradient-to-r from-[#E70A55] via-[#FF6B35] to-[#FBB871] bg-clip-text text-transparent mr-3 transition-all duration-500 hover:from-[#FBB871] hover:via-[#FF6B35] hover:to-[#E70A55] inline-block animate-gradient-flow">New Way</span>
              <span className="transition-all duration-300 hover:text-[#FF6B35] inline-block animate-subtle-bounce">to Make</span>
            </h2>
            <p
              className="text-gray-900"
              style={{
                width: "593px",
                maxWidth: "90vw",
                height: "27px",
                opacity: 0.6,
                marginTop: "12px",
              }}
            >
              Cudliy isn't just an AI Tech Company, it is a new way of Making thing with love
            </p>
          </div>
        </div>
  
        {/* Create Preview Print Section */}
        <CreatePreviewPrintSection />
  
        {/* Full Customization in Seconds section */}
        <div className={`relative w-full mt-40 mb-24 transition-all duration-1200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}
        style={{ transitionDelay: "1800ms" }}>
          <div className="container mx-auto px-4">
            {/* Section Title */}
            <div className="text-center mb-16">
              <h2
                className="font-abril"
                style={{
                  width: "552px",
                  fontWeight: 400,
                  fontStyle: "normal",
                  fontSize: "40px",
                  lineHeight: "81%",
                letterSpacing: "0%",
                textAlign: "center",
                verticalAlign: "middle",
                color: "#000",
                  margin: "0 auto 16px",
                }}
              >
                Full Customization in Seconds
              </h2>
              <p
                className="text-gray-900"
                style={{
                  width: "593px",
                  height: "54px",
                  opacity: 0.6,
                  marginTop: "16px",
                  fontFamily: "Manrope, sans-serif",
                  fontWeight: 500,
                  fontStyle: "normal",
                  fontSize: "16px",
                  lineHeight: "27px",
                  letterSpacing: "0%",
                  textAlign: "center",
                  verticalAlign: "middle",
                  margin: "9px auto 0",
                }}
              >
                Make design choices in seconds. Use the advanced editing option to create specific modification
              </p>
            </div>
            
            {/* Main Content - Three Column Layout */}
            <div className="flex flex-col xl:flex-row items-start justify-between gap-4 xl:gap-2">
              {/* Left Side - Color Picker Interface (PANE.png) */}
              <div className="flex-shrink-0 w-full xl:w-auto flex justify-center group hover:scale-105 transition-transform duration-500 ease-out">
                <img
                  src="/PANE.png"
                  alt="Color Picker Interface"
                  className="object-contain max-w-full transition-all duration-300 group-hover:shadow-2xl animate-gentle-float"
                  style={{
                    width: "487px",
                    height: "410px",
                    borderRadius: "30px",
                    opacity: 1,
                  }}
                />
              </div>
              
              {/* Center - Vertically Stacked CAT Images with proper sizing */}
              <div className="flex flex-col items-center gap-8 w-full xl:w-auto xl:flex-shrink-0">
                {/* CAT1 - Top */}
                <div className="w-full max-w-[500px] flex justify-center group hover:scale-110 transition-transform duration-500 ease-out cursor-pointer animate-subtle-bounce">
                  <img
                    src="/CAT1.png"
                    alt="CAT1 Character"
                    className="max-w-full h-auto object-contain transition-all duration-300 group-hover:drop-shadow-lg"
                    style={{
                      width: "250px",
                      maxWidth: "100%",
                    }}
                  />
                </div>
                
                {/* CAT3 - Middle */}
                <div className="w-full max-w-[550px] flex justify-centerxl:ml-6 group hover:scale-110 transition-transform duration-500 ease-out cursor-pointer animate-gentle-scale">
                  <img
                    src="/CAT3.png"
                    alt="CAT3 Character"
                    className="max-w-full  ml-16 h-auto object-contain transition-all duration-300 group-hover:drop-shadow-lg"
                    style={{
                      width: "250px",
                      maxWidth: "100%",
                    }}
                  />
                </div>
                
                {/* CAT2 - Bottom */}
                <div className="w-full max-w-[520px] flex justify-center ml-0 xl:ml-10 group hover:scale-110 transition-transform duration-500 ease-out cursor-pointer animate-smooth-pulse">
                  <img
                    src="/CAT2.png"
                    alt="CAT2 Character"
                    className="max-w-full h-auto ml-12 object-contain transition-all duration-300 group-hover:drop-shadow-lg"
                    style={{
                      width: "250px",
                      maxWidth: "100%",
                    }}
                  />
                </div>
              </div>
              
              {/* Right Side - CATCAP Image */}
              <div className="flex-shrink-0 w-full xl:w-auto flex items-end xl:ml-32 group hover:scale-105 transition-transform duration-500 ease-out cursor-pointer animate-gentle-float">
                <div
                  className="relative transition-all duration-300 group-hover:shadow-2xl"
                  style={{
                    width: "667.890380859375px",
                    maxWidth: "100%",
                    height: "600px",
                    borderRadius: "10px",
                    opacity: 1,
                    boxShadow: "4px 4px 8px 0px rgba(0,0,0,0.03)",
                    padding: "20px",
                  }}
                >
                  <img
                    src="/CATCAP.png"
                    alt="CATCAP Character"
                    className="mr-[45px] w-full h-full object-contain rounded-[10px] transition-all duration-300 group-hover:filter-none"
                    style={{
                      filter: "contrast(1.1) saturate(1.1)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Gifts you can't Buy section */}
        <div className={`relative w-full mt-40 mb-24 transition-all duration-1200 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}
        style={{ transitionDelay: "2000ms" }}>
          {/* Background glass accents positioned like 'A New Way to Make' */}
          <div className="pointer-events-none absolute inset-0 -z-0">
            {/* Left glass element */}
            <div
              className="absolute animate-gentle-float"
              style={{
                left: "2%",
                top: "18%",
                transform: "rotate(-12deg)",
              }}
            >
              <img
                src="/Glass.png"
                alt="Glass element"
                style={{
                  width: "420px",
                  height: "380px",
                  objectFit: "contain",
                  opacity: 1,
                  filter: "drop-shadow(0 45px 120px rgba(0,0,0,0.32)) saturate(1.05)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
                }}
              />
            </div>
  
            {/* Right glass element */}
            <div
              className="absolute animate-subtle-bounce"
              style={{
                right: "2%",
                top: "26%",
                transform: "rotate(16deg)",
              }}
            >
              <img
                src="/Glass.png"
                alt="Glass element"
                style={{
                  width: "420px",
                  height: "380px",
                  objectFit: "contain",
                  opacity: 1,
                  filter: "drop-shadow(0 45px 120px rgba(0,0,0,0.32)) saturate(1.05)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
                }}
              />
            </div>
          </div>
  
          <div className="container mx-auto px-4 flex flex-col items-center text-center">
            <h2
              className="font-abril hover:scale-105 transition-transform duration-500 ease-out cursor-default"
              style={{
                width: "1121px",
                maxWidth: "90vw",
                height: "122px",
                fontFamily: "CudliyTrademark, serif",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "96px",
                lineHeight: "100%",
                letterSpacing: "0%",
                textAlign: "center",
                color: "#000",
                margin: "0 auto",
                opacity: 1,
              }}
            >
              <span className="mr-4 transition-all duration-300 hover:text-[#E70A55] inline-block animate-gentle-float">Gifts you can't</span>
              <span className="bg-gradient-to-r from-[#E70A55] via-[#FF6B35] to-[#FBB871] bg-clip-text text-transparent mr-4 transition-all duration-500 hover:from-[#FBB871] hover:via-[#FF6B35] hover:to-[#E70A55] inline-block animate-gradient-flow">Buy</span>
            </h2>
            <p
              className="text-gray-900 mt-8"
              style={{
                maxWidth: "800px",
                fontFamily: "Manrope, sans-serif",
                fontWeight: 500,
                fontSize: "20px",
                lineHeight: "32px",
                letterSpacing: "0%",
                textAlign: "center",
                opacity: 0.8,
              }}
            >
              With Cudliy, you make cool stuff? No! You make meaning. Technology can be human again
            </p>
          </div>
        </div>
      </section>
    );
  };
  
export default HeroSection;
  