import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { toast } from "@/lib/sonner";
import ImageCarousel from "@/components/ImageCarousel";
import { modernGoogleAuthService } from "@/services/googleAuthModern";
 

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const resp: any = await apiService.login(email, password);
      const payload = (resp && (resp as any)) || {};
      
      // Store JWT token
      const token = payload.token || payload.data?.token;
      if (token) {
        sessionStorage.setItem('token', token);
      }
      
      const userObj = payload.data?.user || payload.user || payload.data;
      const userId = userObj?.id || userObj?._id || payload.userId;
      if (userId) {
        sessionStorage.setItem('user_id', userId);
        sessionStorage.removeItem('guest_user_id');
      }
      const userName = userObj?.name || userObj?.username || userObj?.email || '';
      if (userName) {
        sessionStorage.setItem('user_name', userName);
      }
      // Store firstName and lastName if available
      if (userObj?.profile?.firstName) {
        sessionStorage.setItem('user_firstName', userObj.profile.firstName);
      }
      if (userObj?.profile?.lastName) {
        sessionStorage.setItem('user_lastName', userObj.profile.lastName);
      }
      toast.success("Welcome back! Signed in successfully.");
      navigate("/dashboard");
    } catch (error: any) {
      // Parse specific error messages
      let errorMessage = "An unexpected error occurred";
      
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
          errorMessage = "Incorrect email or password. Please try again.";
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = "Please check your email and password format.";
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes('API Error:')) {
          errorMessage = error.message.replace('API Error: ', '');
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Get Google credential token using modern Google Identity Services
      const credential = await modernGoogleAuthService.signIn();
      console.log('Got credential from Google, sending to backend...');
      
      // Send credential to backend for authentication
      const response = await apiService.googleAuth(credential);
      console.log('Backend response:', response);
      
      if (response.success && response.data) {
        const { token, user, isNewUser } = response.data;
        
        // Store authentication data
        if (token) {
          sessionStorage.setItem('token', token);
        }
        
        if (user?.id || user?._id) {
          const userId = user.id || user._id;
          sessionStorage.setItem('user_id', userId);
          sessionStorage.removeItem('guest_user_id');
        }
        
        // Store user profile data
        if (user?.profile?.firstName) {
          sessionStorage.setItem('user_firstName', user.profile.firstName);
        }
        if (user?.profile?.lastName) {
          sessionStorage.setItem('user_lastName', user.profile.lastName);
        }
        if (user?.username || user?.email) {
          sessionStorage.setItem('user_name', user.username || user.email);
        }
        
        // Show success message
        if (isNewUser) {
          toast.success("Welcome to Cudliy! Your account has been created successfully.");
          // Show intro for new users
          sessionStorage.setItem('show_intro', 'true');
          navigate("/design");
        } else {
          toast.success("Welcome back! Signed in with Google successfully.");
          navigate("/dashboard");
        }
      } else {
        throw new Error(response.error || 'Google sign-in failed');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      let errorMessage = "Google sign-in failed. Please try again.";
      
      if (error && typeof error === 'object') {
        if (error.message) {
          if (error.message.includes('cancelled') || error.message.includes('not displayed')) {
            errorMessage = "Google sign-in was cancelled.";
          } else if (error.message.includes('popup') || error.message.includes('blocked')) {
            errorMessage = "Please allow popups for Google sign-in to work.";
          } else if (error.message.includes('network') || error.message.includes('Network')) {
            errorMessage = "Network error. Please check your connection and try again.";
          } else if (error.message.includes('Invalid') || error.message.includes('expired')) {
            errorMessage = "Google authentication failed. Please try again.";
          } else if (error.message.includes('timed out')) {
            errorMessage = "Google sign-in timed out. Please try again.";
          } else if (error.message.includes('refresh')) {
            errorMessage = error.message;
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = "Google sign-in encountered an error. Please refresh the page and try again.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      // Apple Sign-In is not implemented yet
      toast.error("Apple Sign-In is coming soon!");
    } catch (error) {
      toast.error("Apple Sign-In is not available yet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-white">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-300 border-t-black"></div>
              <p className="text-gray-700 font-medium">Signing you in...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Left Section - Sign In Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 min-h-screen lg:min-h-0">
        <div className={`w-full max-w-lg transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className={`text-center mb-6 sm:mb-8 transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {/* Logo */}
            <div className="mb-3 sm:mb-4 flex justify-center">
              <img
                src="/CudliyLogo.svg"
                alt="Cudliy Logo"
                className="w-6 h-6 object-contain"
                style={{
                  opacity: 1
                }}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 font-abril">
              Sign in
            </h1>
          </div>

          <form onSubmit={handleSignIn} className={`space-y-4 sm:space-y-6 transform transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="space-y-3 sm:space-y-4">
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-0 h-[56px] rounded-full px-6 bg-white text-black text-base"
                style={{ fontSize: '16px' }}
                required
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-0 h-[56px] rounded-full px-6 bg-white text-black text-base"
                style={{ fontSize: '16px' }}
                required
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="text-white font-medium transition-all duration-200 hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed bg-black !rounded-full h-[42px] w-[120px] px-[40px] py-[14px] gap-[10px]"
                style={{ opacity: 1 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  </div>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </form>

          <div className={`mt-6 sm:mt-8 text-center transform transition-all duration-700 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Sign in with</p>
            <div className="flex justify-center space-x-3 sm:space-x-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>
              <button
                onClick={handleAppleSignIn}
                disabled={isLoading}
                className="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <svg className="w-5 h-5 flex-shrink-0 text-black" viewBox="0 0 24 24" fill="currentColor" preserveAspectRatio="xMidYMid meet">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </button>
            </div>
          </div>

          <div className={`mt-4 sm:mt-6 text-center transform transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-sm sm:text-base text-gray-600 transition-colors duration-300">
              Don't have an account?{" "}
              <span 
                className="text-[#E70A55] cursor-pointer hover:underline transition-colors duration-300"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </span>
            </p>
          </div>

          <div className={`mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 transform transition-all duration-700 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} transition-colors duration-300`}>
            <p className="px-2">
              By clicking "Create account" or "Continue with Google or Apple", you agree to Cudliy's{" "}
              <span 
                className="text-[#E70A55] cursor-pointer hover:underline transition-colors duration-300"
                onClick={() => navigate("/terms")}
              >
                Terms
              </span> and{" "}
              <span 
                className="text-[#E70A55] cursor-pointer hover:underline transition-colors duration-300"
                onClick={() => navigate("/privacy")}
              >
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Image Carousel */}
      <div 
        className={`hidden lg:flex lg:w-1/2 relative overflow-hidden transform transition-all duration-1000 ease-out bg-[#F5F5DC] ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'} transition-colors duration-300`}
      >
        {/* Image Carousel */}
        <div className={`absolute inset-0 flex items-center justify-center transform transition-all duration-1000 delay-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <ImageCarousel 
            images={['/Rectangle 346240796.png', '/3d1.webp', '/3d3.webp', '/3d4.webp', '/3d5.webp']}
            autoSlideInterval={5000}
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;


