// Google Identity Services Type Definitions

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (handleCredentialResponse: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  ux_mode?: 'popup' | 'redirect';
  login_uri?: string;
  native_callback?: (response: any) => void;
  intermediate_iframe_close_callback?: () => void;
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
}

export interface CredentialResponse {
  credential: string;
  select_by: string;
  client_id?: string;
}

export interface PromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => 'browser_not_supported' | 'invalid_client' | 'missing_client_id' | 'opt_out_or_no_session' | 'secure_http_required' | 'suppressed_by_user' | 'unregistered_origin' | 'unknown_reason';
  isSkippedMoment: () => boolean;
  getSkippedReason: () => 'auto_cancel' | 'user_cancel' | 'tap_outside' | 'issuing_failed';
  isDismissedMoment: () => boolean;
  getDismissedReason: () => 'credential_returned' | 'cancel_called' | 'flow_restarted';
  getMomentType: () => 'display' | 'skipped' | 'dismissed';
}

export interface GsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string | number;
  locale?: string;
}

export interface RevocationResponse {
  successful: boolean;
  error?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          prompt: (momentListener?: (res: PromptMomentNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void;
          disableAutoSelect: () => void;
          storeCredential: (credentials: { id: string; password: string }, callback: () => void) => void;
          cancel: () => void;
          onGoogleLibraryLoad: () => void;
          revoke: (hint: string, callback: (done: RevocationResponse) => void) => void;
        };
      };
    };
    gapi?: any;
  }
}
