import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { toast } from "@/lib/sonner";
import ImageCarousel from "@/components/ImageCarousel";
import { modernGoogleAuthService } from "@/services/googleAuthModern";
 

const SignUp = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps = [
    { 
      fields: ["firstName", "lastName", "email"], 
      placeholders: ["First Name", "Last Name", "Email Address"] 
    },
    { field: "password", placeholder: "Password" },
    { field: "confirmPassword", placeholder: "Confirm Password" }
  ];

  const handleInputChange = (value: string, field?: string) => {
    const targetField = field || (steps[currentStep].field as string);
    setFormData(prev => ({
      ...prev,
      [targetField]: value
    }));
  };

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 0) {
      // First step: validate firstName, lastName, and email
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
        toast.error("Please fill in all fields");
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    } else if (currentStep === 1) {
      // Password step
      if (!formData.password.trim()) {
        toast.error("Please enter a password");
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle form submission
      await handleSignUp();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      const resp: any = await apiService.signup(formData.email, formData.password, formData.firstName, formData.lastName);
      if (resp && resp.error) throw new Error(resp.error || resp.message || 'Signup failed');
      // Store user data in sessionStorage for immediate access
      if (resp.data?.user) {
        const user = resp.data.user;
        if (user.id) sessionStorage.setItem('user_id', user.id);
        if (user.profile?.firstName) sessionStorage.setItem('user_firstName', user.profile.firstName);
        if (user.profile?.lastName) sessionStorage.setItem('user_lastName', user.profile.lastName);
        if (user.username) sessionStorage.setItem('user_name', user.username);
        if (resp.token) sessionStorage.setItem('token', resp.token);
      }
      
      toast.success("Account created successfully! Welcome to Cudliy!");
      // Show intro popup and then redirect to design page
      sessionStorage.setItem('show_intro', 'true');
      navigate("/design");
    } catch (error: any) {
      // Parse specific error messages
      let errorMessage = "An unexpected error occurred";
      
      if (error.message) {
        if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = "Please check your email format and password requirements.";
        } else if (error.message.includes('409') || error.message.includes('already exists')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
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
      
      // Send credential to backend for authentication
      const response = await apiService.googleAuth(credential);
      
      // Handle both response formats: {success: true} and {status: 'success'}
      const isSuccess = response.success || (response as any).status === 'success';
      
      if (isSuccess) {
        // Backend returns: {status: 'success', token: '...', data: {user: {...}, isNewUser: true}}
        const token = (response as any).token || response.data?.token;
        const user = (response as any).data?.user || response.data?.user;
        
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
        
        // Always treat Google auth as new user experience for signup page
        toast.success("Welcome to Cudliy! Your account has been created successfully!");
        sessionStorage.setItem('show_intro', 'true');
        // Use window.location for full page reload to ensure sessionStorage is read
        window.location.href = "/design";
      } else {
        throw new Error(response.error || 'Google sign-up failed');
      }
    } catch (error: any) {
      console.error('Google Sign-Up Error:', error);
      
      let errorMessage = "Google sign-up failed. Please try again.";
      
      if (error && typeof error === 'object') {
        if (error.message) {
          if (error.message.includes('cancelled') || error.message.includes('not displayed')) {
            errorMessage = "Google sign-up was cancelled.";
          } else if (error.message.includes('popup') || error.message.includes('blocked')) {
            errorMessage = "Please allow popups for Google sign-up to work.";
          } else if (error.message.includes('network') || error.message.includes('Network')) {
            errorMessage = "Network error. Please check your connection and try again.";
          } else if (error.message.includes('Invalid') || error.message.includes('expired')) {
            errorMessage = "Google authentication failed. Please try again.";
          } else if (error.message.includes('already exists')) {
            errorMessage = "An account with this Google email already exists. Please sign in instead.";
          } else if (error.message.includes('timed out')) {
            errorMessage = "Google sign-up timed out. Please try again.";
          } else if (error.message.includes('refresh')) {
            errorMessage = error.message;
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = "Google sign-up encountered an error. Please refresh the page and try again.";
        }
      }
      
      toast.error(errorMessage);
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
              <p className="text-gray-700 font-medium">Creating your account...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Left Section - Sign Up Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 min-h-screen lg:min-h-0">
        <div className={`w-full max-w-lg transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className={`text-center mb-6 sm:mb-8 transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {/* Logo */}
            <div className="mb-3 sm:mb-4 flex justify-center">
              <img
                src="/CudliyLogo.svg"
                alt="Cudliy Logo"
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                style={{
                  opacity: 1
                }}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 font-abril">
              Create Account
            </h1>
          </div>

          <div className={`space-y-4 sm:space-y-6 transform transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {/* Progress Indicator */}
            <div className="flex justify-center space-x-2 mb-4 sm:mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? "bg-[#E70A55]" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Slider Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentStep * 100}%)` }}
              >
                {steps.map((step, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    {step.fields ? (
                      // First step with multiple fields
                      <div className="space-y-3 sm:space-y-4">
                        {step.fields.map((field, fieldIndex) => (
                          <Input
                            key={fieldIndex}
                            type={field === 'email' ? 'email' : 'text'}
                            placeholder={step.placeholders[fieldIndex]}
                            value={formData[field as keyof typeof formData] as string}
                            onChange={(e) => handleInputChange(e.target.value, field)}
                            className="w-full border-2 border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-0 h-[56px] rounded-full px-6 bg-white text-[#212121] placeholder:text-[#212121] text-base"
                            style={{ fontSize: '16px' }}
                            required
                          />
                        ))}
                      </div>
                    ) : (
                      // Single field steps
                      <Input
                        type={step.field === "password" || step.field === "confirmPassword" ? "password" : "text"}
                        placeholder={step.placeholder}
                        value={formData[step.field as keyof typeof formData] as string}
                        onChange={(e) => handleInputChange(e.target.value, step.field)}
                        className="w-full border-2 border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-0 h-[56px] rounded-full px-6 bg-white text-[#212121] placeholder:text-[#212121] text-base"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-3 sm:gap-4">
              {currentStep > 0 && (
                <Button
                  onClick={handleBack}
                  className="font-medium transition-all duration-200 !rounded-full h-[54px] px-6 sm:px-10"
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: '#E70A55',
                    color: '#E70A55',
                    fontWeight: '600',
                    opacity: 1,
                    minWidth: '80px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E70A55';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#E70A55';
                  }}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="text-white font-medium transition-all duration-200 hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed bg-black !rounded-full h-[54px] w-[120px] px-[40px] py-[14px] gap-[10px]"
                style={{ opacity: 1 }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span className="hidden sm:inline">Creating account...</span>
                  </div>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>

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
            </div>
          </div>

          <div className={`mt-4 sm:mt-6 text-center transform transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-sm sm:text-base text-gray-600 transition-colors duration-300">
              Already have an account?{" "}
              <span 
                className="text-[#E70A55] cursor-pointer hover:underline transition-colors duration-300"
                onClick={() => navigate("/")}
              >
                Log In
              </span>
            </p>
          </div>

          <div className={`mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 transform transition-all duration-700 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} transition-colors duration-300`}>
            <p className="px-2">
              By clicking "Create account" or "Continue with Google", you agree to Cudliy's{" "}
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

export default SignUp;

