// Robust Google OAuth Service - Handles CSP and Error Issues
declare global {
  interface Window {
    google: any;
    gapi: any;
    handleGoogleCallback: (response: any) => void;
  }
}

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

class RobustGoogleAuthService {
  private clientId: string;
  private isInitialized: boolean = false;
  private currentResolve: ((value: string) => void) | null = null;
  private currentReject: ((reason: any) => void) | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '490286678728-q4lqv39qoh8ns3vpb4c9naqbv4nmfj7e.apps.googleusercontent.com';
  }

  // Initialize Google OAuth with better error handling
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Set up global callback function
      window.handleGoogleCallback = (response: GoogleAuthResponse) => {
        if (this.currentResolve) {
          this.currentResolve(response.credential);
          this.currentResolve = null;
          this.currentReject = null;
        }
      };

      // Check if Google Identity Services is already loaded
      const checkGoogleLoaded = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: this.clientId,
              callback: window.handleGoogleCallback,
              auto_select: false,
              cancel_on_tap_outside: true,
              use_fedcm_for_prompt: false,
              ux_mode: 'popup',
              context: 'signin',
              itp_support: true,
            });
            this.isInitialized = true;
            resolve();
          } catch (error) {
            console.error('Google OAuth initialization error:', error);
            reject(new Error('Failed to initialize Google OAuth. Please refresh the page and try again.'));
          }
        } else {
          // If Google Identity Services isn't loaded, try to load it
          if (!document.querySelector('script[src*="accounts.google.com"]')) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
              setTimeout(checkGoogleLoaded, 100);
            };
            script.onerror = () => {
              reject(new Error('Failed to load Google OAuth. Please check your internet connection.'));
            };
            document.head.appendChild(script);
          } else {
            setTimeout(checkGoogleLoaded, 100);
          }
        }
      };

      checkGoogleLoaded();
    });
  }

  // Sign in with Google using popup
  async signIn(): Promise<string> {
    try {
      await this.initialize();

      return new Promise((resolve, reject) => {
        this.currentResolve = resolve;
        this.currentReject = reject;

        // Set up timeout
        const timeout = setTimeout(() => {
          if (this.currentReject) {
            this.currentReject(new Error('Google sign-in timed out. Please try again.'));
            this.currentResolve = null;
            this.currentReject = null;
          }
        }, 30000); // 30 second timeout

        try {
          // Clear any existing timeout when we get a response
          const originalResolve = resolve;
          const wrappedResolve = (value: string) => {
            clearTimeout(timeout);
            originalResolve(value);
          };
          
          const originalReject = reject;
          const wrappedReject = (reason: any) => {
            clearTimeout(timeout);
            originalReject(reason);
          };

          this.currentResolve = wrappedResolve;
          this.currentReject = wrappedReject;

          // Trigger the Google sign-in prompt
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              if (this.currentReject) {
                this.currentReject(new Error('Google sign-in popup was blocked. Please allow popups and try again.'));
                this.currentResolve = null;
                this.currentReject = null;
              }
            } else if (notification.isSkippedMoment()) {
              if (this.currentReject) {
                this.currentReject(new Error('Google sign-in was cancelled.'));
                this.currentResolve = null;
                this.currentReject = null;
              }
            }
          });
        } catch (error) {
          clearTimeout(timeout);
          console.error('Google sign-in prompt error:', error);
          reject(new Error('Failed to show Google sign-in. Please refresh the page and try again.'));
        }
      });
    } catch (error) {
      console.error('Google sign-in initialization error:', error);
      throw new Error('Google sign-in is not available. Please refresh the page and try again.');
    }
  }

  // Alternative sign-in method using renderButton
  async renderSignInButton(element: HTMLElement): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.renderButton(element, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: element.offsetWidth || 200,
        });
        resolve();
      } catch (error) {
        console.error('Failed to render Google sign-in button:', error);
        reject(new Error('Failed to render Google sign-in button'));
      }
    });
  }

  // Sign out
  signOut(): void {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.error('Google sign-out error:', error);
      }
    }
  }

  // Check if Google OAuth is available
  isAvailable(): boolean {
    return !!(window.google?.accounts?.id);
  }
}

export const robustGoogleAuthService = new RobustGoogleAuthService();