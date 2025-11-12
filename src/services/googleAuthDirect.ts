// Direct Google OAuth Implementation - No Google Identity Services
// Uses direct OAuth 2.0 flow with popup window

export interface GoogleAuthResponse {
  access_token: string;
  id_token: string;
  scope: string;
  expires_in: number;
}

class DirectGoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private scope: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '490286678728-q4lqv39qoh8ns3vpb4c9naqbv4nmfj7e.apps.googleusercontent.com';
    this.redirectUri = window.location.origin;
    this.scope = 'openid email profile';
  }

  // Generate OAuth URL
  private generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'id_token token',
      scope: this.scope,
      nonce: this.generateNonce(),
      state: this.generateState(),
      prompt: 'select_account',
    });

    return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
  }

  // Generate random nonce for security
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Generate random state for security
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Sign in with popup window
  async signIn(): Promise<string> {
    return new Promise((resolve, reject) => {
      const authUrl = this.generateAuthUrl();
      
      // Open popup window
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Google sign-in popup was blocked. Please allow popups and try again.'));
        return;
      }

      // Check if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Google sign-in was cancelled.'));
        }
      }, 1000);

      // Listen for messages from popup
      const messageListener = (event: MessageEvent) => {
        // Only accept messages from Google
        if (event.origin !== 'https://accounts.google.com' && event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve(event.data.id_token);
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error || 'Google authentication failed'));
        }
      };

      window.addEventListener('message', messageListener);

      // Handle URL changes in popup (for implicit flow)
      const checkUrl = setInterval(() => {
        try {
          if (popup.location && popup.location.hash) {
            const hash = popup.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const idToken = params.get('id_token');
            const error = params.get('error');

            if (idToken) {
              clearInterval(checkUrl);
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
              popup.close();
              resolve(idToken);
            } else if (error) {
              clearInterval(checkUrl);
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
              popup.close();
              reject(new Error(`Google authentication error: ${error}`));
            }
          }
        } catch (e) {
          // Cross-origin error - popup is still on Google's domain
          // This is expected and we'll continue checking
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkUrl);
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('Google sign-in timed out. Please try again.'));
      }, 300000);
    });
  }

  // Alternative method using gapi (if available)
  async signInWithGapi(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Load Google API if not already loaded
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          this.initGapi().then(() => this.performGapiSignIn()).then(resolve).catch(reject);
        };
        script.onerror = () => reject(new Error('Failed to load Google API'));
        document.head.appendChild(script);
      } else {
        this.initGapi().then(() => this.performGapiSignIn()).then(resolve).catch(reject);
      }
    });
  }

  private initGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load('auth2', {
        callback: () => {
          window.gapi.auth2.init({
            client_id: this.clientId,
            scope: this.scope
          }).then(resolve).catch(reject);
        },
        onerror: reject
      });
    });
  }

  private async performGapiSignIn(): Promise<string> {
    const authInstance = window.gapi.auth2.getAuthInstance();
    const googleUser = await authInstance.signIn({
      prompt: 'select_account'
    });
    return googleUser.getAuthResponse().id_token;
  }
}

// Add global types
declare global {
  interface Window {
    gapi: any;
  }
}

export const directGoogleAuthService = new DirectGoogleAuthService();