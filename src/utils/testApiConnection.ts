// Test API connection utility
export const testApiConnection = async () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://cudliydesign-production.up.railway.app/api');
  

  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    

    
    if (response.ok) {
      const data = await response.json();

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
