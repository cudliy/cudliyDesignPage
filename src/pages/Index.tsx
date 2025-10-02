import GlassNav from "@/components/GlassNav";
import HeroSection from "@/components/HeroSection";
import IntroSection from "@/components/IntroSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";


const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <GlassNav />
      <HeroSection />
      <IntroSection/>
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;


