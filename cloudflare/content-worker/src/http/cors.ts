export function isAllowedOrigin(origin: string, serializedAllowedOrigins: string): boolean {
  if (!origin.startsWith('https://'))
    return false;

  return serializedAllowedOrigins
    .split(',')
    .map((allowedOrigin) => allowedOrigin.trim())
    .filter(Boolean)
    .includes(origin);
}

export function applyCorsHeaders(headers: Headers, origin: string | null): void {
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD');
  headers.set('Access-Control-Expose-Headers', 'Content-Length, ETag, Last-Modified');
  appendVary(headers, 'Origin');

  if (origin)
    headers.set('Access-Control-Allow-Origin', origin);
}

function appendVary(headers: Headers, value: string): void {
  const currentValues = (headers.get('Vary') ?? '')
    .split(',')
    .map((currentValue) => currentValue.trim())
    .filter(Boolean);

  if (!currentValues.includes(value))
    currentValues.push(value);

  headers.set('Vary', currentValues.join(', '));
}
