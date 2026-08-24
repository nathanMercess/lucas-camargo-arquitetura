import { createCorsHeaders, isAllowedOrigin, parseList } from './http/cors';
import { createJsonResponse } from './http/create-json-response';
import { WorkerEnvironment } from './models/worker-environment.model';
import { verifyTurnstile } from './security/verify-turnstile';
import { calculateSha256 } from './shared/calculate-sha256';
import { storeContactMessage } from './storage/store-contact-message';
import { validateContactSubmission } from './validation/validate-contact-submission';

const contactPath = '/contact';
const maximumBodyBytes = 16 * 1024;

export async function handleRequest(
  request: Request,
  environment: WorkerEnvironment,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get('Origin');
  const requestUrl = new URL(request.url);

  if (requestUrl.pathname !== contactPath || requestUrl.search !== '')
    return createJsonResponse(404, 'not_found', requestId, null);

  if (!isAllowedOrigin(origin, environment.CORS_ALLOWED_ORIGINS))
    return createJsonResponse(403, 'origin_not_allowed', requestId, null);

  if (request.method === 'OPTIONS')
    return new Response(null, { headers: createCorsHeaders(origin), status: 204 });

  if (request.method !== 'POST') {
    const response = createJsonResponse(405, 'method_not_allowed', requestId, origin);
    response.headers.set('Allow', 'POST, OPTIONS');

    return response;
  }

  if (
    request.headers.get('X-Contact-Form') !== '1' ||
    !request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')
  )
    return createJsonResponse(415, 'unsupported_request', requestId, origin);

  const declaredLength = Number(request.headers.get('Content-Length') ?? '0');

  if (Number.isFinite(declaredLength) && declaredLength > maximumBodyBytes)
    return createJsonResponse(413, 'payload_too_large', requestId, origin);

  let serializedBody: string;

  try {
    serializedBody = await request.text();
  } catch {
    return createJsonResponse(400, 'invalid_request', requestId, origin);
  }

  if (new TextEncoder().encode(serializedBody).byteLength > maximumBodyBytes)
    return createJsonResponse(413, 'payload_too_large', requestId, origin);

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(serializedBody);
  } catch {
    return createJsonResponse(400, 'invalid_request', requestId, origin);
  }

  const submission = validateContactSubmission(parsedBody);

  if (!submission)
    return createJsonResponse(400, 'invalid_request', requestId, origin);

  if (submission.website)
    return createJsonResponse(202, 'accepted', requestId, origin);

  let rateLimit: { readonly success: boolean };

  try {
    const emailHash = await calculateSha256(submission.email);
    rateLimit = await environment.CONTACT_RATE_LIMITER.limit({
      key: `contact:${emailHash.slice(0, 32)}`,
    });
  } catch (error: unknown) {
    logOperationalFailure('contact_rate_limit_failed', requestId, error);

    return createJsonResponse(502, 'temporarily_unavailable', requestId, origin);
  }

  if (!rateLimit.success)
    return createJsonResponse(429, 'rate_limited', requestId, origin);

  const allowedHostnames = new Set(
    parseList(environment.TURNSTILE_ALLOWED_HOSTNAMES).map((hostname) => hostname.toLowerCase()),
  );
  const verification = await verifyTurnstile(
    environment.TURNSTILE_SECRET_KEY,
    submission.turnstileToken,
    request.headers.get('CF-Connecting-IP'),
    allowedHostnames,
  );

  if (!verification?.hostname)
    return createJsonResponse(403, 'verification_failed', requestId, origin);

  try {
    const stored = await storeContactMessage(
      environment.CONTACT_MESSAGES,
      submission,
      requestId,
      verification.hostname,
    );

    if (!stored)
      throw new Error('Conditional contact storage failed.');

    console.info(JSON.stringify({ event: 'contact_accepted', requestId, result: 'success' }));

    return createJsonResponse(202, 'accepted', requestId, origin);
  } catch (error: unknown) {
    logOperationalFailure('contact_storage_failed', requestId, error);

    return createJsonResponse(502, 'temporarily_unavailable', requestId, origin);
  }
}

function logOperationalFailure(event: string, requestId: string, error: unknown): void {
  console.error(JSON.stringify({
    error: error instanceof Error ? error.name : 'UnknownError',
    event,
    requestId,
  }));
}

export default {
  fetch: handleRequest,
};
