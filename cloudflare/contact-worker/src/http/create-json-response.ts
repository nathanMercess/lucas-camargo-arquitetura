import { createCorsHeaders } from './cors';

export function createJsonResponse(
  status: number,
  code: string,
  requestId: string,
  origin: string | null,
): Response {
  const headers = origin ? createCorsHeaders(origin) : new Headers();

  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');

  return new Response(JSON.stringify({ code, requestId }), { headers, status });
}
