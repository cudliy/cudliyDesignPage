import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        navigate('/signin');
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        toast.error('An unexpected error occurred');
        navigate('/signin');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E70A55] mx-auto mb-4"></div>
        <h2 className="text-xl font-abril text-gray-900 mb-2">
          {isProcessing ? 'Completing sign in...' : 'Redirecting...'}
        </h2>
        <p className="text-gray-600 font-manrope">
          Please wait while we complete your authentication
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;


