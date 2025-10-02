import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { toast } from "@/lib/sonner";

const SignUp = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Removed unused placeholder signUp
  const signInWithGoogle = async () => ({ error: null as any });
  const signInWithApple = async () => ({ error: null as any });
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps = [
    { field: "name", placeholder: "Username" },
    { field: "email", placeholder: "Email Address" },
    { field: "password", placeholder: "Password" },
    { field: "confirmPassword", placeholder: "Confirm Password" }
  ];

  const handleInputChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      [steps[currentStep].field]: value
    }));
  };

  const handleNext = async () => {
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
      const resp: any = await apiService.signup(formData.email, formData.password, formData.name);
      if (resp && resp.error) throw new Error(resp.error || resp.message || 'Signup failed');
      toast.success("Account created successfully! Please sign in.");
      navigate("/signin");
    } catch (error: any) {
      console.error('Signup error:', error);
      
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
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    return currentStep === steps.length - 1 ? "Continue" : "Continue";
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Sign Up Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-8 py-12">
        <div className={`w-full max-w-lg transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className={`text-center mb-8 transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {/* Logo */}
            <div className="mb-4 flex justify-center">
              <img
                src="/Asset 12 1 (1).png"
                alt="Cudliy Logo"
                style={{
                  width: '28.999998092651392px',
                  height: '25.000001907348654px',
                  opacity: 1
                }}
              />
            </div>
            <h1 className="text-3xl font-bold text-black mb-2 font-abril">
              Create Account
            </h1>
          </div>

          <div className={`space-y-6 transform transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {/* Progress Indicator */}
            <div className="flex justify-center space-x-2 mb-6">
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
                    <Input
                      type={step.field === "password" || step.field === "confirmPassword" ? "password" : (step.field === 'email' ? 'email' : 'text')}
                      placeholder={step.placeholder}
                      value={formData[step.field as keyof typeof formData] as string}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E70A55] focus:border-transparent"
                      style={{
                        width: '508px',
                        height: '50px',
                        borderRadius: '25px',
                        borderWidth: '0.5px',
                        padding: '12px 16px'
                      }}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {currentStep > 0 && (
                <Button
                  onClick={handleBack}
                  className="font-medium transition-colors"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '120px',
                    height: '42px',
                    borderRadius: '22px',
                    gap: '10px',
                    paddingTop: '14px',
                    paddingRight: '40px',
                    paddingBottom: '14px',
                    paddingLeft: '40px',
                    background: 'transparent',
                    border: '2px solid #E70A55',
                    color: '#E70A55'
                  }}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="text-white font-medium transition-all duration-200 hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '120px',
                  height: '42px',
                  borderRadius: '22px',
                  gap: '10px',
                  paddingTop: '14px',
                  paddingRight: '40px',
                  paddingBottom: '14px',
                  paddingLeft: '40px',
                  background: '#000000'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account</span>
                  </div>
                ) : (
                  getButtonText()
                )}
              </Button>
            </div>
          </div>

          <div className={`mt-8 text-center transform transition-all duration-700 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-gray-600 mb-4">Sign in with</p>
            <div className="flex justify-center space-x-4">
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
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" preserveAspectRatio="xMidYMid meet">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </button>
            </div>
          </div>

          <div className={`mt-6 text-center transform transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-gray-600">
              Already have an account?{" "}
              <span 
                className="text-[#E70A55] cursor-pointer hover:underline"
                onClick={() => navigate("/signin")}
              >
                Log In
              </span>
            </p>
          </div>

          <div className={`mt-4 text-center text-sm text-gray-500 transform transition-all duration-700 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p>
              By clicking "Create account" or "Continue with Google or Apple", you agree to Cudliy's{" "}
              <span 
                className="text-[#E70A55] cursor-pointer hover:underline"
                onClick={() => navigate("/terms")}
              >
                Terms
              </span> and{" "}
              <span 
                className="text-[#E70A55] cursor-pointer hover:underline"
                onClick={() => navigate("/privacy")}
              >
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Visual Branding */}
      <div 
        className={`hidden lg:flex lg:w-1/2 relative overflow-hidden transform transition-all duration-1000 ease-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
        style={{ backgroundColor: '#F5F5DC' }}
      >
        {/* Central Image - Rectangle 346240796 */}
        <div className={`absolute inset-0 flex items-center justify-center transform transition-all duration-1000 delay-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <img
            src="/Rectangle 346240796.png"
            alt="Rectangle 346240796"
            className="object-cover w-full h-full"
            style={{
              borderRadius: '30px'
            }}
          />
        </div>

        {/* Attribution */}
        <div className={`absolute bottom-8 right-8 z-10 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="text-black font-bold text-lg">Danny</div>
          <div className="text-black text-sm">Designed by Shany</div>
        </div>

        {/* Pagination Indicators */}
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div 
            className="bg-gray-400"
            style={{
              width: '110px',
              height: '8px',
              borderRadius: '20px',
              opacity: 1
            }}
          ></div>
          <div 
            className="bg-gray-400"
            style={{
              width: '110px',
              height: '8px',
              borderRadius: '20px',
              opacity: 1
            }}
          ></div>
          <div 
            className="bg-white"
            style={{
              width: '110px',
              height: '8px',
              borderRadius: '20px',
              opacity: 1
            }}
          ></div>
          <div 
            className="bg-gray-400"
            style={{
              width: '110px',
              height: '8px',
              borderRadius: '20px',
              opacity: 1
            }}
          ></div>
          <div 
            className="bg-gray-400"
            style={{
              width: '110px',
              height: '8px',
              borderRadius: '20px',
              opacity: 1
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;


