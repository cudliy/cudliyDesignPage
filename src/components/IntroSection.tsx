import { Button } from "@/components/ui/button";

const IntroSection = () => {
  return (
    <section className="relative w-full min-h-screen bg-white overflow-visible py-20" id="about">

      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        {/* Section Title */}
        <h2
          className="mb-6"
          style={{
            fontFamily: "FONTSPRING DEMO - Fromage ExtraBold, serif",
            fontWeight: 800,
            fontStyle: "normal",
            fontSize: "40px",
            lineHeight: "81%",
            letterSpacing: 0,
            textAlign: "center",
            verticalAlign: "middle",
            color: "#000",
          }}
        >
          <span className="mr-3">Introducing</span>
          <span className="bg-gradient-to-r from-[#E70A55] via-[#FF6B35] to-[#FBB871] bg-clip-text text-transparent mr-3">Artboard</span>
        </h2>
        
        {/* Section Description */}
        <p
          className="text-gray-900 mb-12 max-w-2xl mx-auto"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontWeight: 500,
            fontStyle: "normal",
            fontSize: "16px",
            lineHeight: "27px",
            letterSpacing: "0%",
            textAlign: "center",
            verticalAlign: "middle",
            opacity: 0.8,
          }}
        >
          Cudliy let you express your creativity however it comes naturally. The inbuilt draw mode give your image a human touch. Add your unique signature to your creation.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Button
            className="text-white font-semibold shadow-md hover:opacity-90"
            style={{
              width: "200px",
              height: "56px",
              borderRadius: "40px",
              backgroundColor: "#E70A55",
              paddingTop: "14px",
              paddingRight: "40px",
              paddingBottom: "14px",
              paddingLeft: "40px",
              gap: "10px",
              opacity: 1,
            }}
          >
            Start Creating
          </Button>
          <Button
            variant="outline"
            className="border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
            style={{
              width: "200px",
              height: "56px",
              borderRadius: "40px",
              paddingTop: "14px",
              paddingRight: "40px",
              paddingBottom: "14px",
              paddingLeft: "40px",
              gap: "10px",
            }}
          >
            Learn More
          </Button>
        </div>
        
        {/* Artboard Preview/Video */}
        <div className="relative rounded-2xl overflow-hidden max-w-4xl mx-auto shadow-2xl">
          <video
            className="w-full h-auto"
            src="/final 2.mp4"
            autoPlay
            muted
            loop
            controls
            playsInline
            preload="auto"
            style={{
              aspectRatio: '16/9',
              borderRadius: '16px',
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default IntroSection;


