// Slant3D API Service
// Uses backend proxy to avoid CORS issues
// Based on official Slant3D API documentation: https://api-fe-two.vercel.app/Docs

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:3001/api' : 'https://cudliy.onrender.com/api');

// Debug logging for Slant3D service
console.log('Slant3D API_BASE_URL:', API_BASE_URL);
console.log('Slant3D Environment:', import.meta.env.MODE);
console.log('Slant3D VITE_API_URL:', import.meta.env.VITE_API_URL);

class Slant3DService {
  // Upload model to Slant3D using backend proxy
  async uploadModel(modelUrl, options = {}) {
    try {
      console.log('Uploading model to Slant3D:', modelUrl);
      console.log('Using backend proxy:', API_BASE_URL);

      // Call backend proxy to upload model
      const response = await fetch(`${API_BASE_URL}/slant3d/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelUrl,
          options
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response error:', errorText);
        throw new Error(`Model upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Model upload failed');
      }

      return result;
    } catch (error) {
      console.error('Slant3D model upload error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Backend server is not accessible. Please check if the backend is running.');
      } else {
        throw new Error(`Slant3D upload error: ${error.message}`);
      }
    }
  }

  // Get pricing for a model using the backend proxy
  async getPricing(modelUrl, options = {}) {
    try {
      console.log('Getting Slant3D pricing for:', modelUrl);
      console.log('Using backend proxy:', API_BASE_URL);

      // Call backend proxy
      const response = await fetch(`${API_BASE_URL}/slant3d/pricing/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelUrl,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Pricing request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Pricing request failed');
      }

      return result;
    } catch (error) {
      console.error('Slant3D pricing error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Backend server is not accessible. Please check if the backend is running.');
      } else {
        throw new Error(`Slant3D API error: ${error.message}`);
      }
    }
  }

  // Create order data structure for Slant3D API
  createOrderData(modelUrl, options = {}, customerData = {}) {
    const orderNumber = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = modelUrl.split('/').pop() || 'model.stl';
    
    return {
      email: customerData.email || 'guest@temp.com',
      phone: customerData.phone || '000-000-0000',
      name: customerData.name || 'Guest User',
      orderNumber: orderNumber,
      filename: filename,
      fileURL: modelUrl,
      bill_to_street_1: customerData.address || '123 Temp Street',
      bill_to_street_2: customerData.address2 || '',
      bill_to_street_3: '',
      bill_to_city: customerData.city || 'Temp City',
      bill_to_state: customerData.state || 'CA',
      bill_to_zip: customerData.zip || '12345',
      bill_to_country_as_iso: customerData.country || 'US',
      bill_to_is_US_residential: 'true',
      ship_to_name: customerData.name || 'Guest User',
      ship_to_street_1: customerData.address || '123 Temp Street',
      ship_to_street_2: customerData.address2 || '',
      ship_to_street_3: '',
      ship_to_city: customerData.city || 'Temp City',
      ship_to_state: customerData.state || 'CA',
      ship_to_zip: customerData.zip || '12345',
      ship_to_country_as_iso: customerData.country || 'US',
      ship_to_is_US_residential: 'true',
      order_item_name: filename,
      order_quantity: (options.quantity || 1).toString(),
      order_image_url: customerData.imageUrl || '',
      order_sku: `SKU_${Date.now()}`,
      order_item_color: options.color || 'Black',
      profile: options.material || 'PLA'
    };
  }

  // Create order using backend proxy
  async createOrder(modelUrl, options = {}, customerData = {}) {
    try {
      console.log('Creating Slant3D order for:', modelUrl);
      console.log('Order options:', options);
      console.log('Customer data:', customerData);

      const response = await fetch(`${API_BASE_URL}/slant3d/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelUrl,
          options,
          customerData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Order creation response error:', errorText);
        throw new Error(`Order creation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Order creation result:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Order creation failed');
      }

      return result;
    } catch (error) {
      console.error('Slant3D order creation error:', error);
      throw error;
    }
  }

  // Get shipping estimate using backend proxy
  async getShippingEstimate(modelUrl, options = {}, customerData = {}) {
    try {
      console.log('Getting Slant3D shipping estimate for:', modelUrl);

      const response = await fetch(`${API_BASE_URL}/slant3d/shipping/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelUrl,
          options,
          customerData
        })
      });

      if (!response.ok) {
        throw new Error(`Shipping estimate request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Shipping estimate request failed');
      }

      return result;
    } catch (error) {
      console.error('Slant3D shipping estimate error:', error);
      throw error;
    }
  }

  // Get order tracking using backend proxy
  async getOrderTracking(orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/slant3d/order/${orderId}/tracking`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Tracking request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Tracking request failed');
      }

      return result;
    } catch (error) {
      console.error('Slant3D tracking error:', error);
      throw error;
    }
  }

  // Get all orders using backend proxy
  async getAllOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/slant3d/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get orders request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Get orders request failed');
      }

      return result;
    } catch (error) {
      console.error('Slant3D get orders error:', error);
      throw error;
    }
  }

  // Cancel order using backend proxy
  async cancelOrder(orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/slant3d/order/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Cancel order request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Cancel order request failed');
      }

      return result;
    } catch (error) {
      console.error('Slant3D cancel order error:', error);
      throw error;
    }
  }
}

export const slant3DService = new Slant3DService();
export default slant3DService;