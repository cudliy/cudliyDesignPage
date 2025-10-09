import GlassNav from "@/components/GlassNav";
import HeroSection from "@/components/HeroSection";
import IntroSection from "@/components/IntroSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";


const Index = () => {
  return (
    <>
      <SEO 
        title="Cudliy - Design Your Dream Toys in 3D"
        description="Transform your ideas into adorable 3D printed toys with Cudliy. Create custom toys using AI-powered design tools. From imagination to reality in minutes."
        keywords="3D design, toy design, AI toy maker, custom toys, 3D printing, personalized toys, kids toys, design platform, creative tools"
        url="/"
      />
      <div className="min-h-screen overflow-x-hidden">
        <GlassNav />
        <HeroSection />
        <IntroSection/>
        <FAQSection />
        <Footer />
      </div>
    </>
  );
};

export default Index;


