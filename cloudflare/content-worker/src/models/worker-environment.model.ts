import { PublishedContentBucket } from './published-content-bucket.model';

export interface WorkerEnvironment {
  readonly CORS_ALLOWED_ORIGINS: string;
  readonly PUBLISHED_CONTENT: PublishedContentBucket;
}
