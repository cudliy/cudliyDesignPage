// Google OAuth Service
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

class GoogleAuthService {
  private clientId: string;
  private isInitialized: boolean = false;

  constructor() {
    // You'll need to replace this with your actual Google OAuth Client ID
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
  }

  // Initialize Google OAuth
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      // Wait for Google Identity Services to load
      const checkGoogleLoaded = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: this.clientId,
              callback: this.handleCredentialResponse.bind(this),
              auto_select: false,
              cancel_on_tap_outside: true,
              use_fedcm_for_prompt: false, // Disable FedCM to avoid the error
              ux_mode: 'popup', // Use popup mode instead of redirect
            });
            this.isInitialized = true;
            resolve();
          } catch (error) {
            console.error('Google OAuth initialization error:', error);
            reject(new Error('Failed to initialize Google OAuth'));
          }
        } else {
          setTimeout(checkGoogleLoaded, 100);
        }
      };

      checkGoogleLoaded();
    });
  }

  // Handle the credential response from Google
  private handleCredentialResponse(response: GoogleAuthResponse): void {
    // This will be handled by the component that calls signIn
    console.log('Google credential received:', response);
  }

  // Sign in with Google - returns a promise that resolves with credential token
  async signIn(): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      // Override the callback for this specific sign-in attempt
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: async (response: GoogleAuthResponse) => {
          try {
            // Return the credential token directly
            resolve(response.credential);
          } catch (error) {
            reject(error);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
        ux_mode: 'popup',
      });

      // Trigger the sign-in prompt with error handling
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            reject(new Error('Google sign-in popup was blocked. Please allow popups and try again.'));
          } else if (notification.isSkippedMoment()) {
            reject(new Error('Google sign-in was cancelled.'));
          }
        });
      } catch (error) {
        console.error('Google prompt error:', error);
        reject(new Error('Failed to show Google sign-in. Please try again.'));
      }
    });
  }



  // Render Google Sign-In button
  async renderButton(element: HTMLElement, options: any = {}): Promise<void> {
    await this.initialize();

    const defaultOptions = {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    };

    window.google.accounts.id.renderButton(element, { ...defaultOptions, ...options });
  }

  // Sign out
  signOut(): void {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

export const googleAuthService = new GoogleAuthService();