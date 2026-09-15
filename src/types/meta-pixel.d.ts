interface Fbq {
  (method: 'init', pixelId: string): void;
  (method: 'track', event: string, params?: Record<string, unknown>, options?: { eventID?: string }): void;
  (method: 'trackCustom', event: string, params?: Record<string, unknown>): void;
  (method: 'consent', action: 'grant' | 'revoke'): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: Fbq;
}

interface Window {
  fbq?: Fbq;
  _fbq?: Fbq;
}
