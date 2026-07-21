import { applyCorsHeaders, isAllowedOrigin } from './http/cors';
import { createErrorResponse } from './http/create-error-response';
import { createResourceHeaders } from './http/create-resource-headers';
import { matchesIfNoneMatch } from './http/etag';
import { WorkerEnvironment } from './models/worker-environment.model';
import { WorkerExecutionContext } from './models/worker-execution-context.model';
import { resolveContentResource } from './routing/resolve-content-resource';
import { createCacheKey, getEdgeCache, scheduleCacheWrite } from './storage/edge-cache';

const ALLOWED_METHODS = new Set(['GET', 'HEAD']);

export async function handleRequest(
  request: Request,
  environment: WorkerEnvironment,
  context: WorkerExecutionContext,
): Promise<Response> {
  if (!ALLOWED_METHODS.has(request.method)) {
    const response = createErrorResponse(
      405,
      'method_not_allowed',
      'Somente GET e HEAD são permitidos.',
      request.method,
      null,
    );
    response.headers.set('Allow', 'GET, HEAD');

    return response;
  }

  const origin = request.headers.get('Origin');

  if (origin && !isAllowedOrigin(origin, environment.CORS_ALLOWED_ORIGINS))
    return createErrorResponse(
      403,
      'origin_not_allowed',
      'A origem da requisição não é permitida.',
      request.method,
      null,
    );

  const requestUrl = new URL(request.url);
  const resource = resolveContentResource(requestUrl);

  if (!resource)
    return createErrorResponse(
      404,
      'content_not_found',
      'Conteúdo não encontrado.',
      request.method,
      origin,
    );

  const cache = getEdgeCache();
  const cacheKey = createCacheKey(requestUrl);

  try {
    const cachedResponse = await cache?.match(cacheKey);

    if (cachedResponse)
      return createRequestResponse(cachedResponse, request, origin);

    if (request.method === 'HEAD') {
      const object = await environment.PUBLISHED_CONTENT.head(resource.key);

      if (!object)
        return createErrorResponse(
          404,
          'content_not_found',
          'Conteúdo não encontrado.',
          request.method,
          origin,
        );

      const response = new Response(null, {
        headers: createResourceHeaders(resource, object),
        status: 200,
      });

      return createRequestResponse(response, request, origin);
    }

    const object = await environment.PUBLISHED_CONTENT.get(resource.key);

    if (!object)
      return createErrorResponse(
        404,
        'content_not_found',
        'Conteúdo não encontrado.',
        request.method,
        origin,
      );

    const response = new Response(object.body, {
      headers: createResourceHeaders(resource, object),
      status: 200,
    });

    scheduleCacheWrite(cache, cacheKey, response.clone(), context);

    return createRequestResponse(response, request, origin);
  } catch (error: unknown) {
    console.error(
      JSON.stringify({
        error: error instanceof Error ? error.name : 'UnknownError',
        event: 'published_content_read_failed',
        path: requestUrl.pathname,
      }),
    );

    return createErrorResponse(
      502,
      'content_unavailable',
      'Conteúdo temporariamente indisponível.',
      request.method,
      origin,
    );
  }
}

function createRequestResponse(
  response: Response,
  request: Request,
  origin: string | null,
): Response {
  const headers = new Headers(response.headers);

  applyCorsHeaders(headers, origin);

  if (matchesIfNoneMatch(request.headers.get('If-None-Match'), headers.get('ETag') ?? '')) {
    headers.delete('Content-Length');

    return new Response(null, { headers, status: 304 });
  }

  if (request.method === 'HEAD')
    return new Response(null, { headers, status: response.status });

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export default {
  fetch: handleRequest,
};
