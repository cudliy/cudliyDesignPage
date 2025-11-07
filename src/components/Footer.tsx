import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-8 md:py-12 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Top row: brand + legal + social */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-100 pb-5 md:pb-6 mb-6 md:mb-8 gap-6 md:gap-0">
          {/* Brand and legal links */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <span className="text-base md:text-sm font-manrope font-semibold text-[#E70A55]">Cudliy.</span>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-manrope whitespace-nowrap">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-manrope whitespace-nowrap">
                Terms of Service
              </a>
            </div>
          </div>

          {/* Social media icons */}
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <a 
              aria-label="Facebook" 
              href="#" 
              className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:text-[#E70A55] transition-colors touch-manipulation"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a 
              aria-label="Twitter" 
              href="#" 
              className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:text-[#E70A55] transition-colors touch-manipulation"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a 
              aria-label="Instagram" 
              href="#" 
              className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:text-[#E70A55] transition-colors touch-manipulation"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a 
              aria-label="LinkedIn" 
              href="#" 
              className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:text-[#E70A55] transition-colors touch-manipulation"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Large Cudliy Text at the very bottom */}
        <div className="text-center relative">
          {/* Ensure large wordmark is not clipped */}
          <div className="relative w-full overflow-hidden px-2">
            <h2
              className="leading-none font-extrabold mb-0 font-manrope text-[#E70A55] select-none"
              style={{
                opacity: 1,
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 800,
                fontStyle: 'normal',
                fontSize: 'clamp(60px, 15vw, 363.08px)',
                lineHeight: '100%',
                letterSpacing: '0%',
                margin: '0 auto',
                wordBreak: 'keep-all',
                whiteSpace: 'nowrap'
              }}
            >
              Cudliy
            </h2>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


