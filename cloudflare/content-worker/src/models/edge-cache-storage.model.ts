import { EdgeCache } from './edge-cache.model';

export interface EdgeCacheStorage {
  readonly default: EdgeCache;
}
