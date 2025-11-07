import { Button } from "../components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../lib/sonner";

const GlassNav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const user = null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const liquidGlassStyles = {
    background: `
      linear-gradient(135deg, 
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.05) 25%,
        rgba(255, 255, 255, 0.02) 50%,
        rgba(255, 255, 255, 0.08) 75%,
        rgba(255, 255, 255, 0.03) 100%
      )
    `,
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '30px',
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1)
    `,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  } as const;

  //

  return (
    <>
      {/* Desktop Navigation */}
      <header className={`fixed z-50 left-1/2 transform -translate-x-1/2 top-[37px] w-[1123px] hidden md:block transition-all duration-700 ease-out ${isScrolled ? 'scale-95' : 'scale-100'}`}>
        <nav 
          className="relative h-[70px] flex items-center justify-between px-8 transform transition-all duration-500 hover:scale-[1.02] overflow-hidden font-manrope"
          style={{
            width: '1123px',
            height: '70px',
            borderRadius: '40px',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            opacity: 1,
            position: 'relative',
            left: '0px',
            top: '0px',
            transform: 'rotate(0deg)'
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100
            });
          }}
        >
          {/* Animated liquid background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute w-32 h-32 rounded-full opacity-5 animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(0, 0, 0, 0.1) 0%, transparent 70%)',
                left: `${mousePos.x}%`,
                top: `${mousePos.y}%`,
                transform: 'translate(-50%, -50%)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <div 
              className="absolute w-20 h-20 rounded-full opacity-10 animate-bounce"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                left: `${100 - mousePos.x}%`,
                top: `${100 - mousePos.y}%`,
                transform: 'translate(-50%, -50%)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                animationDelay: '0.2s',
              }}
            />
          </div>

          <div className="flex items-center gap-2 transform transition-transform duration-300 hover:scale-105 relative z-10 flex-1">
            <div className="relative ml-14">
              <img src="/Asset 12 1 (1).png" alt="Logo" className="h-24 w-auto sm:h-10 sm:w-10 object-contain" />
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center space-x-6 md:space-x-8 relative z-10">
            {['Home', 'Community', 'Pricing', 'Blog'].map((item, index) => (
              <button 
                key={item}
                onClick={() => {
                  if (item === 'Home') {
                    // @ts-ignore
                    navigate('/cudliy.com');
                  } else if (item === 'Community') {
                    // @ts-ignore
                    navigate('/'); // Navigate to home and scroll to community section
                  } else if (item === 'Pricing') {
                    // @ts-ignore
                    navigate('/pricing');
                  } else if (item === 'Blog') {
                    // @ts-ignore
                    navigate('/blog');
                  }
                }}
                className="relative text-black transition-all duration-500 font-manrope text-sm md:text-base hover:text-gray-700 hover:scale-110 transform group"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {item}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-500" />
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4 relative z-10 flex-1 justify-end">
            <button 
              onClick={() => navigate('/')} // Navigate to home for now
              className="relative text-black transition-all duration-500 font-manrope text-sm md:text-base hover:text-gray-700 hover:scale-110 transform group"
            >
              Become a Maker
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-500" />
            </button>
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm md:text-base text-black">
                  <User className="h-4 w-4" />
                  <span className="font-manrope">user@example.com</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="relative text-black hover:text-gray-700 font-manrope text-sm md:text-base px-3 sm:px-4 transform transition-all duration-300 hover:scale-105 group overflow-hidden"
                  onClick={() => {
                    // Clear session data
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user_id');
                    sessionStorage.removeItem('user_name');
                    sessionStorage.removeItem('guest_user_id');
                    toast.success("Signed out successfully!");
                    navigate("/");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="relative z-10">Sign out</span>
                  <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                </Button>
              </>
            ) : (
              <Button 
                className="relative font-manrope text-sm md:text-base transform transition-all duration-300 hover:scale-105 overflow-hidden text-white bg-black border border-black hover:bg-gray-800"
                style={{
                  width: '108px',
                  height: '42px',
                  borderRadius: '30px',
                  padding: '10px 20px',
                  gap: '10px'
                }}
                onClick={() => navigate('/')}
              >
                <span className="relative z-10">Login</span>
              </Button>
            )}
          </div>

          {/* Liquid edge effects */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-black to-transparent opacity-20" />
        </nav>
      </header>

      {/* Mobile Navigation */}
      <header className="fixed z-50 top-0 left-0 right-0 md:hidden">
        <nav 
          className="relative h-[60px] flex items-center justify-between px-4 m-2 transform transition-all duration-300 overflow-hidden"
          style={{
            ...liquidGlassStyles,
            borderRadius: '20px',
          }}
        >
          {/* Mobile liquid background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute w-24 h-24 rounded-full opacity-5 animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(0, 0, 0, 0.1) 0%, transparent 70%)',
                left: '20%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>

          <div className="flex items-center gap-2 transform transition-transform duration-300 hover:scale-105 relative z-10">
            <div className="relative ml-5">
              <img src="/Asset 12 1 (1).png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-black transform transition-all duration-500 hover:scale-110 hover:rotate-180 relative z-10 group"
            aria-label="Toggle menu"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#E70A55] to-transparent opacity-0 group-hover:opacity-10 rounded-full blur transition-opacity duration-300" />
            {isMobileMenuOpen ? <X className="h-5 w-5 relative z-10" /> : <Menu className="h-5 w-5 relative z-10" />}
          </button>

          {/* Liquid edge effects for mobile */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-black to-transparent opacity-20" />
        </nav>

        {/* Mobile Menu Overlay */}
        <div 
          className={`relative p-4 transform transition-all duration-500 ease-out overflow-hidden ${
            isMobileMenuOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
          }`}
          style={{
            ...liquidGlassStyles,
            borderRadius: '20px',
            margin: '0 8px',
            marginTop: '4px',
          }}
        >
          {/* Mobile menu liquid background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute w-20 h-20 rounded-full opacity-5 animate-bounce"
              style={{
                background: 'radial-gradient(circle, rgba(0, 0, 0, 0.1) 0%, transparent 70%)',
                right: '20%',
                top: '30%',
                animationDelay: '0.5s',
              }}
            />
            <div 
              className="absolute w-16 h-16 rounded-full opacity-10 animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
                left: '30%',
                bottom: '20%',
                animationDelay: '1s',
              }}
            />
          </div>

          <div className="flex flex-col space-y-4 relative z-10">
            {['Home', 'Community', 'Pricing', 'Blog'].map((item, index) => (
              <button 
                key={item}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (item === 'Home') {
                    navigate('/');
                  } else if (item === 'Community') {
                    navigate('/'); // Navigate to home and scroll to community section
                  } else if (item === 'Pricing') {
                    navigate('/pricing');
                  } else if (item === 'Blog') {
                    navigate('/blog');
                  }
                }}
                className="relative text-black transition-all duration-500 font-abril text-base py-2 hover:text-gray-600 hover:translate-x-2 transform group"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-20px)',
                  transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                {item}
                <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
              </button>
            ))}
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/'); // Navigate to home for now
              }}
              className="relative text-black transition-all duration-500 font-abril text-base py-2 hover:text-gray-600 hover:translate-x-2 transform group"
              style={{
                animationDelay: '0.4s',
                opacity: isMobileMenuOpen ? 1 : 0,
                transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-20px)',
                transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s`,
              }}
            >
              Become a Maker
              <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            </button>
            <div className="flex flex-col space-y-3 pt-4 border-t border-white/20">
              {false ? (
                <>
                  <div className="flex items-center gap-2 text-black py-2">
                    <User className="h-4 w-4" />
                    <span className="font-abril text-sm">user@example.com</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="relative text-black hover:text-gray-600 font-abril justify-start px-0 transform transition-all duration-300 hover:translate-x-2 group"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      // Clear session data
                      sessionStorage.removeItem('token');
                      sessionStorage.removeItem('user_id');
                      sessionStorage.removeItem('user_name');
                      sessionStorage.removeItem('guest_user_id');
                      toast.success("Signed out successfully!");
                      navigate("/");
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="relative z-10">Sign out</span>
                    <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    className="relative font-abril transform transition-all duration-300 hover:scale-105 overflow-hidden text-white bg-black border border-black hover:bg-gray-800"
                    style={{
                      width: '108px',
                      height: '42px',
                      borderRadius: '30px',
                      padding: '10px 20px',
                      gap: '10px'
                    }}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                  >
                    <span className="relative z-10">Login</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Liquid edge effects for mobile menu */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-black to-transparent opacity-20" />
        </div>
      </header>
    </>
  );
};

export default GlassNav;


