export interface TurnstileRenderOptions {
  readonly sitekey: string;
  readonly action: 'contact';
  readonly theme: 'auto';
  readonly size: 'flexible';
  readonly callback: (token: string) => void;
  readonly 'error-callback': () => void;
  readonly 'expired-callback': () => void;
}
