const allowedHeaders = 'Content-Type, X-Contact-Form';

export function isAllowedOrigin(origin: string | null, allowlist: string): origin is string {
  if (!origin)
    return false;

  return parseList(allowlist).includes(origin);
}

export function createCorsHeaders(origin: string): Headers {
  return new Headers({
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  });
}

export function parseList(value: string): readonly string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
