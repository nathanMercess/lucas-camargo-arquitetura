import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { handleRequest } from '../src/index';
import { ContactBucket } from '../src/models/contact-bucket.model';
import { RateLimiter } from '../src/models/rate-limiter.model';
import { WorkerEnvironment } from '../src/models/worker-environment.model';

const allowedOrigin = 'https://lucascamargo.com';
const validBody = {
  name: 'Nathan Silva',
  email: 'nathan@example.com',
  phone: '+55 (11) 98668-1572',
  subject: 'Projeto residencial',
  message: 'Gostaria de conversar sobre um novo projeto residencial.',
  turnstileToken: 'turnstile-token',
  website: '',
};

describe('contact worker', () => {
  let environment: WorkerEnvironment;
  let limit: Mock<RateLimiter['limit']>;
  let put: Mock<ContactBucket['put']>;

  beforeEach(() => {
    limit = vi.fn().mockResolvedValue({ success: true });
    put = vi.fn().mockResolvedValue({ httpEtag: '"contact-etag"' });
    environment = {
      CONTACT_MESSAGES: { put },
      CONTACT_RATE_LIMITER: { limit },
      CORS_ALLOWED_ORIGINS: allowedOrigin,
      TURNSTILE_ALLOWED_HOSTNAMES: 'lucascamargo.com',
      TURNSTILE_SECRET_KEY: 'test-secret',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      action: 'contact',
      hostname: 'lucascamargo.com',
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers an allowed preflight without touching storage or Turnstile', async () => {
    const response = await handleRequest(new Request('https://contact.example/contact', {
      headers: { Origin: allowedOrigin },
      method: 'OPTIONS',
    }), environment);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(allowedOrigin);
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('X-Contact-Form');
    expect(limit).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects absent or untrusted origins and unsupported request shapes', async () => {
    const absentOrigin = await handleRequest(createRequest(validBody, null), environment);
    const untrustedOrigin = await handleRequest(
      createRequest(validBody, 'https://attacker.example'),
      environment,
    );
    const missingMarker = await handleRequest(new Request('https://contact.example/contact', {
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json', Origin: allowedOrigin },
      method: 'POST',
    }), environment);

    expect(absentOrigin.status).toBe(403);
    expect(untrustedOrigin.status).toBe(403);
    expect(missingMarker.status).toBe(415);
    expect(put).not.toHaveBeenCalled();
  });

  it('validates Turnstile and stores an immutable private message', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const response = await handleRequest(createRequest(validBody, allowedOrigin), environment);

    expect(response.status).toBe(202);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(fetch).toHaveBeenCalledOnce();
    expect(limit).toHaveBeenCalledOnce();
    expect(put).toHaveBeenCalledTimes(2);

    const [key, serializedMessage, options] = put.mock.calls[0]!;
    const [indexKey, serializedIndex] = put.mock.calls[1]!;
    const storedMessage = JSON.parse(serializedMessage) as Record<string, unknown>;
    const storedIndex = JSON.parse(serializedIndex) as Record<string, unknown>;

    expect(key).toMatch(
      /^contacts\/messages\/\d{4}\/\d{2}\/\d{2}\/\d{8}T\d{9}Z-[0-9a-f-]+\.json$/,
    );
    expect(storedMessage).toMatchObject({
      schemaVersion: 1,
      status: 'new',
      name: validBody.name,
      email: validBody.email,
      source: 'website',
      turnstileHostname: 'lucascamargo.com',
    });
    expect(serializedMessage).not.toContain(validBody.turnstileToken);
    expect(options.onlyIf).toEqual({ etagDoesNotMatch: '*' });
    expect(indexKey).toBe(`contacts/index/${storedMessage['id']}.json`);
    expect(storedIndex).toEqual({
      schemaVersion: 1,
      id: storedMessage['id'],
      objectKey: key,
    });
    expect(consoleInfo.mock.calls.flat().join(' ')).not.toContain(validBody.email);
  });

  it('normalizes a trusted Turnstile hostname before storage', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      success: true,
      action: 'contact',
      hostname: 'LUCASCAMARGO.COM',
    }), { status: 200 }));

    const response = await handleRequest(createRequest(validBody, allowedOrigin), environment);
    const storedMessage = JSON.parse(put.mock.calls[0]![1]) as Record<string, unknown>;

    expect(response.status).toBe(202);
    expect(storedMessage['turnstileHostname']).toBe('lucascamargo.com');
  });

  it('applies rate limiting before Turnstile and storage', async () => {
    limit.mockResolvedValue({ success: false });

    const response = await handleRequest(createRequest(validBody, allowedOrigin), environment);

    expect(response.status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('keeps rate-limiter failures opaque and skips downstream services', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    limit.mockRejectedValue(new Error(`failed for ${validBody.email}`));

    const response = await handleRequest(createRequest(validBody, allowedOrigin), environment);
    const logged = consoleError.mock.calls.flat().join(' ');

    expect(response.status).toBe(502);
    expect(fetch).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(logged).not.toContain(validBody.email);
  });

  it('rejects invalid Turnstile action or hostname without storage', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      success: true,
      action: 'login',
      hostname: 'attacker.example',
    }), { status: 200 }));

    const response = await handleRequest(createRequest(validBody, allowedOrigin), environment);

    expect(response.status).toBe(403);
    expect(put).not.toHaveBeenCalled();
  });

  it('silently accepts the honeypot without consuming rate limit or storage', async () => {
    const response = await handleRequest(
      createRequest({ ...validBody, website: 'https://spam.example' }, allowedOrigin),
      environment,
    );

    expect(response.status).toBe(202);
    expect(limit).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('enforces the body limit even without a Content-Length header', async () => {
    const response = await handleRequest(
      createRequest({ ...validBody, message: 'x'.repeat(17 * 1024) }, allowedOrigin),
      environment,
    );

    expect(response.status).toBe(413);
    expect(limit).not.toHaveBeenCalled();
  });

  it('keeps storage failures opaque and free of personal data in logs', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    put.mockRejectedValue(new Error(`failed for ${validBody.email}`));

    const response = await handleRequest(createRequest(validBody, allowedOrigin), environment);
    const responseBody = await response.text();
    const logged = consoleError.mock.calls.flat().join(' ');

    expect(response.status).toBe(502);
    expect(responseBody).not.toContain(validBody.email);
    expect(logged).not.toContain(validBody.email);
    expect(logged).not.toContain(validBody.message);
  });

  it('does not acknowledge a message whose private index was not persisted', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    put
      .mockResolvedValueOnce({ httpEtag: '"message-etag"' })
      .mockResolvedValueOnce(null);

    const response = await handleRequest(createRequest(validBody, allowedOrigin), environment);

    expect(response.status).toBe(502);
    expect(put).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledOnce();
  });
});

function createRequest(body: unknown, origin: string | null): Request {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Contact-Form': '1',
  });

  if (origin)
    headers.set('Origin', origin);

  return new Request('https://contact.example/contact', {
    body: JSON.stringify(body),
    headers,
    method: 'POST',
  });
}
