import { EdgeCacheStorage } from '../models/edge-cache-storage.model';
import { EdgeCache } from '../models/edge-cache.model';
import { WorkerExecutionContext } from '../models/worker-execution-context.model';

declare const caches: EdgeCacheStorage;

export function getEdgeCache(): EdgeCache | null {
  if (typeof caches === 'undefined')
    return null;

  return caches.default;
}

export function createCacheKey(requestUrl: URL): Request {
  const cacheUrl = new URL(requestUrl.pathname, requestUrl.origin);

  return new Request(cacheUrl.toString(), { method: 'GET' });
}

export function scheduleCacheWrite(
  cache: EdgeCache | null,
  cacheKey: Request,
  response: Response,
  context: WorkerExecutionContext,
): void {
  if (!cache || !response.ok)
    return;

  context.waitUntil(
    cache.put(cacheKey, response).catch((error: unknown) => {
      console.error(
        JSON.stringify({
          error: error instanceof Error ? error.name : 'UnknownError',
          event: 'content_edge_cache_write_failed',
        }),
      );
    }),
  );
}
