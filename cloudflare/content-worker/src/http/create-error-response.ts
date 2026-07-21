import { applyCorsHeaders } from './cors';
import { applySecurityHeaders } from './security-headers';

export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  requestMethod: string,
  origin: string | null,
): Response {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'application/problem+json; charset=utf-8',
  });

  applySecurityHeaders(headers);
  applyCorsHeaders(headers, origin);

  const body = requestMethod === 'HEAD' ? null : JSON.stringify({ code, message, status });

  return new Response(body, { headers, status });
}
