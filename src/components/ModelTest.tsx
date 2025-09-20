import React, { useState } from 'react';

const ModelTest = () => {
  const [testUrl, setTestUrl] = useState('https://v3b.fal.media/files/b/penguin/dysxl2G1ubcEHGKQnyEg1_mesh-1758385541.glb');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test if the URL is accessible
      const response = await fetch(testUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('Model URL is accessible:', testUrl);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Test CORS
      const corsResponse = await fetch(testUrl, { 
        method: 'GET',
        mode: 'cors'
      });
      
      if (!corsResponse.ok) {
        throw new Error(`CORS test failed: HTTP ${corsResponse.status}`);
      }
      
      console.log('CORS test passed');
      setError('Model URL is accessible and CORS is working!');
      
    } catch (err) {
      console.error('Model test failed:', err);
      setError(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">3D Model Test</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Model URL:</label>
        <input
          type="url"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter model URL"
        />
      </div>
      
      <button
        onClick={handleTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Model URL'}
      </button>
      
      {error && (
        <div className={`mt-4 p-3 rounded-md ${error.includes('accessible') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      )}
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">Test Results:</h4>
        <div className="text-sm text-gray-600">
          <p>URL: {testUrl}</p>
          <p>Status: {isLoading ? 'Testing...' : error ? 'Completed' : 'Ready'}</p>
        </div>
      </div>
    </div>
  );
};

export default ModelTest;
