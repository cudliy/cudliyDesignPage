// Apple Sign-In Service
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: AppleSignInConfig) => void;
        signIn: () => Promise<AppleSignInResponse>;
      };
    };
  }
}

interface AppleSignInConfig {
  clientId: string;
  scope: string;
  redirectURI: string;
  state?: string;
  nonce?: string;
  usePopup?: boolean;
}

interface AppleSignInResponse {
  authorization: {
    code: string;
    id_token: string;
    state?: string;
  };
  user?: {
    email: string;
    name?: {
      firstName: string;
      lastName: string;
    };
  };
}

class AppleAuthService {
  private clientId: string;
  private redirectURI: string;
  private isInitialized: boolean = false;

  constructor() {
    this.clientId = import.meta.env.VITE_APPLE_CLIENT_ID || '';
    this.redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin;
  }

  // Load Apple Sign-In SDK
  async loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="appleid.cdn-apple.com"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Apple Sign-In SDK'));
      document.head.appendChild(script);
    });
  }

  // Initialize Apple Sign-In
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.clientId) {
      throw new Error('Apple Client ID is not configured');
    }

    try {
      await this.loadScript();
      
      // Wait for AppleID to be available
      let attempts = 0;
      while (!window.AppleID && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.AppleID) {
        throw new Error('Apple Sign-In SDK failed to load');
      }

      window.AppleID.auth.init({
        clientId: this.clientId,
        scope: 'name email',
        redirectURI: this.redirectURI,
        usePopup: true,
      });

      this.isInitialized = true;

    } catch (error) {
      console.error('Failed to initialize Apple Sign-In:', error);
      throw error;
    }
  }

  // Sign in with Apple
  async signIn(): Promise<{ idToken: string; code: string; user?: { email: string; firstName?: string; lastName?: string } }> {
    await this.initialize();

    try {
      const response = await window.AppleID!.auth.signIn();
      
      return {
        idToken: response.authorization.id_token,
        code: response.authorization.code,
        user: response.user ? {
          email: response.user.email,
          firstName: response.user.name?.firstName,
          lastName: response.user.name?.lastName,
        } : undefined,
      };
    } catch (error: any) {
      console.error('Apple Sign-In error:', error);
      
      if (error.error === 'popup_closed_by_user') {
        throw new Error('Apple sign-in was cancelled');
      }
      
      throw new Error('Apple sign-in failed. Please try again.');
    }
  }

  // Check if Apple Sign-In is available
  isAvailable(): boolean {
    return !!window.AppleID;
  }
}

export const appleAuthService = new AppleAuthService();
