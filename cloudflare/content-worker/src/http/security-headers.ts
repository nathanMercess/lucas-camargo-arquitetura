export function applySecurityHeaders(headers: Headers): void {
  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; img-src data:; style-src 'unsafe-inline'; frame-ancestors 'none'; sandbox",
  );
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet');
}
