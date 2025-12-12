// Modern Google Identity Services Implementation
import type { 
  CredentialResponse, 
  PromptMomentNotification, 
  GsiButtonConfiguration 
} from '../types/google';

class ModernGoogleAuthService {
  private clientId: string;
  private isInitialized: boolean = false;
  private currentResolve: ((value: string) => void) | null = null;
  private currentReject: ((reason: any) => void) | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '490286678728-q4lqv39qoh8ns3vpb4c9naqbv4nmfj7e.apps.googleusercontent.com';
  }

  // Initialize Google Identity Services
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const initializeGIS = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: this.clientId,
              callback: this.handleCredentialResponse.bind(this),
              auto_select: false,
              cancel_on_tap_outside: true,
              context: 'signin',
              ux_mode: 'popup',
              itp_support: true,
              use_fedcm_for_prompt: false, // Disable FedCM to avoid issues
            });
            this.isInitialized = true;

            resolve();
          } catch (error) {
            console.error('Failed to initialize Google Identity Services:', error);
            reject(new Error('Failed to initialize Google authentication. Please refresh the page and try again.'));
          }
        } else {
          // Wait a bit more for the library to load
          setTimeout(initializeGIS, 100);
        }
      };

      // Check if the script is already loaded
      if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        initializeGIS();
      } else {
        // Load the Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {

          setTimeout(initializeGIS, 100);
        };
        script.onerror = () => {
          console.error('Failed to load Google Identity Services script');
          reject(new Error('Failed to load Google authentication. Please check your internet connection and try again.'));
        };
        document.head.appendChild(script);
      }
    });
  }

  // Handle credential response from Google
  private handleCredentialResponse(response: CredentialResponse): void {

    if (this.currentResolve) {
      this.currentResolve(response.credential);
      this.currentResolve = null;
      this.currentReject = null;
    }
  }

  // Sign in with Google using One Tap or button
  async signIn(): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;

      // Set up timeout (30 seconds)
      const timeout = setTimeout(() => {
        if (this.currentReject) {
          this.currentReject(new Error('Google sign-in timed out. Please try again.'));
          this.currentResolve = null;
          this.currentReject = null;
        }
      }, 30000);

      // Wrap resolve/reject to clear timeout
      const originalResolve = resolve;
      const originalReject = reject;

      this.currentResolve = (value: string) => {
        clearTimeout(timeout);
        originalResolve(value);
      };

      this.currentReject = (reason: any) => {
        clearTimeout(timeout);
        originalReject(reason);
      };

      try {
        // Use the prompt method for One Tap
        window.google?.accounts.id.prompt((notification: PromptMomentNotification) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();

            
            let errorMessage = 'Google sign-in is not available.';
            switch (reason) {
              case 'browser_not_supported':
                errorMessage = 'Your browser does not support Google sign-in. Please try a different browser.';
                break;
              case 'invalid_client':
                errorMessage = 'Google sign-in configuration error. Please contact support.';
                break;
              case 'unregistered_origin':
                errorMessage = 'This website is not authorized for Google sign-in. Please contact support.';
                break;
              case 'opt_out_or_no_session':
                errorMessage = 'Please sign in to your Google account first, then try again.';
                break;
              case 'secure_http_required':
                errorMessage = 'Google sign-in requires a secure connection. Please use HTTPS.';
                break;
              default:
                errorMessage = 'Google sign-in is not available. Please try again later.';
            }
            
            if (this.currentReject) {
              this.currentReject(new Error(errorMessage));
              this.currentResolve = null;
              this.currentReject = null;
            }
          } else if (notification.isSkippedMoment()) {
            const reason = notification.getSkippedReason();

            
            let errorMessage = 'Google sign-in was cancelled.';
            switch (reason) {
              case 'user_cancel':
                errorMessage = 'Google sign-in was cancelled by user.';
                break;
              case 'tap_outside':
                errorMessage = 'Google sign-in was cancelled.';
                break;
              case 'auto_cancel':
                errorMessage = 'Google sign-in was automatically cancelled.';
                break;
              default:
                errorMessage = 'Google sign-in failed. Please try again.';
            }
            
            if (this.currentReject) {
              this.currentReject(new Error(errorMessage));
              this.currentResolve = null;
              this.currentReject = null;
            }
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error('Error triggering Google sign-in:', error);
        reject(new Error('Failed to start Google sign-in. Please refresh the page and try again.'));
      }
    });
  }

  // Render a Google Sign-In button
  async renderButton(element: HTMLElement, options: Partial<GsiButtonConfiguration> = {}): Promise<void> {
    await this.initialize();

    const defaultOptions: GsiButtonConfiguration = {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%',
    };

    const buttonOptions = { ...defaultOptions, ...options };

    try {
      window.google?.accounts.id.renderButton(element, buttonOptions);

    } catch (error) {
      console.error('Failed to render Google Sign-In button:', error);
      throw new Error('Failed to render Google sign-in button');
    }
  }

  // Sign out
  signOut(): void {
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();

      }
    } catch (error) {
      console.error('Error during Google sign-out:', error);
    }
  }

  // Check if Google Identity Services is available
  isAvailable(): boolean {
    return !!(window.google?.accounts?.id);
  }

  // Cancel any ongoing sign-in process
  cancel(): void {
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
      if (this.currentReject) {
        this.currentReject(new Error('Google sign-in was cancelled.'));
        this.currentResolve = null;
        this.currentReject = null;
      }
    } catch (error) {
      console.error('Error cancelling Google sign-in:', error);
    }
  }
}

export const modernGoogleAuthService = new ModernGoogleAuthService();