// Simplified Google OAuth Service - Alternative Implementation
// Type definitions are in src/types/google.d.ts

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

class SimpleGoogleAuthService {
  private clientId: string;
  private isInitialized: boolean = false;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '490286678728-q4lqv39qoh8ns3vpb4c9naqbv4nmfj7e.apps.googleusercontent.com';
  }

  // Initialize with popup-based OAuth
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      // Load Google API if not already loaded
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => this.initializeGapi().then(resolve).catch(reject);
        script.onerror = () => reject(new Error('Failed to load Google API'));
        document.head.appendChild(script);
      } else {
        this.initializeGapi().then(resolve).catch(reject);
      }
    });
  }

  private async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load('auth2', {
        callback: () => {
          window.gapi.auth2.init({
            client_id: this.clientId,
            scope: 'email profile'
          }).then(() => {
            this.isInitialized = true;
            resolve();
          }).catch(reject);
        },
        onerror: () => reject(new Error('Failed to load Google Auth2'))
      });
    });
  }

  // Sign in with popup
  async signIn(): Promise<string> {
    await this.initialize();

    const authInstance = window.gapi.auth2.getAuthInstance();
    
    try {
      const googleUser = await authInstance.signIn({
        prompt: 'select_account'
      });
      
      // Get the ID token
      const idToken = googleUser.getAuthResponse().id_token;
      return idToken;
    } catch (error: any) {
      if (error.error === 'popup_closed_by_user') {
        throw new Error('Google sign-in was cancelled.');
      } else if (error.error === 'popup_blocked_by_browser') {
        throw new Error('Google sign-in popup was blocked. Please allow popups and try again.');
      } else {
        throw new Error('Google sign-in failed. Please try again.');
      }
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    if (this.isInitialized && window.gapi?.auth2) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    }
  }
}

export const simpleGoogleAuthService = new SimpleGoogleAuthService();