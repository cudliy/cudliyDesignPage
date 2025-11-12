import { useState } from 'react';
import { modernGoogleAuthService } from '@/services/googleAuthModern';
import { apiService } from '@/services/api';

export default function GoogleAuthTest() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [loading, setLoading] = useState(false);

  const testGoogleAuth = async () => {
    setLoading(true);
    setStatus('Testing Google OAuth...');

    try {
      // Test 1: Check if Google Identity Services is available
      setStatus('Step 1: Checking Google Identity Services availability...');
      await modernGoogleAuthService.initialize();
      
      if (!modernGoogleAuthService.isAvailable()) {
        throw new Error('Google Identity Services not available');
      }
      setStatus('✅ Google Identity Services loaded successfully');

      // Test 2: Try to get credential
      setStatus('Step 2: Attempting Google sign-in...');
      const credential = await modernGoogleAuthService.signIn();
      setStatus('✅ Google credential received');

      // Test 3: Send to backend
      setStatus('Step 3: Sending credential to backend...');
      const response = await apiService.googleAuth(credential);
      
      if (response.success) {
        setStatus('✅ All tests passed! Google OAuth is working correctly.');
      } else {
        throw new Error(response.error || 'Backend authentication failed');
      }
    } catch (error: any) {
      console.error('Google Auth Test Error:', error);
      setStatus(`❌ Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Google OAuth Test</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Status:</p>
        <p className="text-sm font-mono bg-gray-100 p-2 rounded">{status}</p>
      </div>

      <button
        onClick={testGoogleAuth}
        disabled={loading}
        className={`w-full py-2 px-4 rounded font-medium ${
          loading
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? 'Testing...' : 'Test Google OAuth'}
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p>Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID}</p>
        <p>Origin: {window.location.origin}</p>
      </div>
    </div>
  );
}