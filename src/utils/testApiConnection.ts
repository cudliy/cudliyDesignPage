// Test API connection utility
export const testApiConnection = async () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://cudliy.onrender.com/api');
  
  console.log('Testing API connection to:', API_BASE_URL);
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Health check response status:', response.status);
    console.log('Health check response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Health check data:', data);
      return { success: true, data };
    } else {
      console.error('Health check failed:', response.statusText);
      return { success: false, error: response.statusText };
    }
  } catch (error) {
    console.error('Health check error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
