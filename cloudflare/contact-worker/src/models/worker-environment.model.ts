import { ContactBucket } from './contact-bucket.model';
import { RateLimiter } from './rate-limiter.model';

export interface WorkerEnvironment {
  readonly CONTACT_MESSAGES: ContactBucket;
  readonly CONTACT_RATE_LIMITER: RateLimiter;
  readonly CORS_ALLOWED_ORIGINS: string;
  readonly TURNSTILE_ALLOWED_HOSTNAMES: string;
  readonly TURNSTILE_SECRET_KEY: string;
}
