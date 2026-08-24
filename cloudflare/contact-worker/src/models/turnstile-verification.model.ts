export interface TurnstileVerification {
  readonly success: boolean;
  readonly hostname?: string;
  readonly action?: string;
  readonly challenge_ts?: string;
  readonly 'error-codes'?: readonly string[];
}
