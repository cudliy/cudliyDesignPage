import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { toast } from "@/lib/sonner";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Removed unused placeholder signIn
  const signInWithGoogle = async () => ({ error: null as any });
  const signInWithApple = async () => ({ error: null as any });
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
      const userObj = payload.data?.user || payload.user || payload.data;
      const userId = userObj?.id || userObj?._id || payload.userId;
      if (userId) {
        sessionStorage.setItem('user_id', userId);
        sessionStorage.removeItem('guest_user_id');
      }
      toast.success("Signed in successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("An unexpected error occurred");
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

    return (
    <div className="min-h-screen flex">
      {/* Left Section - Sign In Form */}
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
              Sign in
            </h1>
          </div>

          <form onSubmit={handleSignIn} className={`space-y-6 transform transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="text-white font-medium transition-colors"
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
                {isLoading ? "Signing in..." : "Continue"}
              </Button>
            </div>
          </form>

          <div className={`mt-8 text-center transform transition-all duration-700 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-gray-600 mb-4">Sign in with</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                className="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </button>
            </div>
          </div>

          <div className={`mt-6 text-center transform transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-gray-600">
              Don't have an account?{" "}
              <span 
                className="text-[#E70A55] cursor-pointer hover:underline"
                onClick={() => navigate("/signup")}
              >
                Sign Up
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

export default SignIn;


