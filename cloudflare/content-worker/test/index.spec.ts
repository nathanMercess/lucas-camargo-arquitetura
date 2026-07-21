import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { handleRequest } from '../src/index';
import { PublishedContentObjectBody } from '../src/models/published-content-object-body.model';
import { PublishedContentObject } from '../src/models/published-content-object.model';
import { WorkerEnvironment } from '../src/models/worker-environment.model';
import { WorkerExecutionContext } from '../src/models/worker-execution-context.model';

const ALLOWED_ORIGIN = 'https://lucascamargo.com';
const MEDIA_HASH = 'b'.repeat(64);

describe('content worker', () => {
  let cacheMatch: ReturnType<typeof vi.fn>;
  let cachePut: ReturnType<typeof vi.fn>;
  let context: WorkerExecutionContext;
  let environment: WorkerEnvironment;
  let getObject: Mock<(key: string) => Promise<PublishedContentObjectBody | null>>;
  let headObject: Mock<(key: string) => Promise<PublishedContentObject | null>>;
  let pendingTasks: Promise<unknown>[];

  beforeEach(() => {
    cacheMatch = vi.fn().mockResolvedValue(undefined);
    cachePut = vi.fn().mockResolvedValue(undefined);
    getObject = vi.fn();
    headObject = vi.fn();
    pendingTasks = [];

    vi.stubGlobal('caches', {
      default: {
        match: cacheMatch,
        put: cachePut,
      },
    });

    environment = {
      CORS_ALLOWED_ORIGINS: [
        ALLOWED_ORIGIN,
        'https://www.lucascamargo.com',
        'https://lucas-camargo-site-373724198767.us-central1.run.app',
      ].join(','),
      PUBLISHED_CONTENT: {
        get: getObject,
        head: headObject,
      },
    };

    context = {
      waitUntil: vi.fn((task: Promise<unknown>) => pendingTasks.push(task)),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects every method except GET and HEAD without reading R2', async () => {
    const response = await handleRequest(
      new Request('https://content.example.com/content/manifest.json', { method: 'POST' }),
      environment,
      context,
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET, HEAD');
    expect(getObject).not.toHaveBeenCalled();
    expect(headObject).not.toHaveBeenCalled();
  });

  it('rejects an Origin outside the exact HTTPS allowlist', async () => {
    const response = await handleRequest(
      new Request('https://content.example.com/content/manifest.json', {
        headers: { Origin: 'https://attacker.example' },
      }),
      environment,
      context,
    );

    expect(response.status).toBe(403);
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect(getObject).not.toHaveBeenCalled();
  });

  it('serves the manifest with a short cache and request-specific CORS', async () => {
    getObject.mockResolvedValue(createR2Body('published/manifest.json', '{"schemaVersion":1}'));

    const response = await handleRequest(
      new Request('https://content.example.com/content/manifest.json', {
        headers: { Origin: ALLOWED_ORIGIN },
      }),
      environment,
      context,
    );

    await Promise.all(pendingTasks);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"schemaVersion":1}');
    expect(getObject).toHaveBeenCalledWith('published/manifest.json');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60, must-revalidate');
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get('Vary')).toContain('Origin');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(cachePut).toHaveBeenCalledOnce();
  });

  it('derives media content type from the validated extension, never from R2 metadata', async () => {
    getObject.mockResolvedValue(
      createR2Body(`media/${MEDIA_HASH}.svg`, '<svg></svg>', 'text/html'),
    );

    const response = await handleRequest(
      new Request(`https://content.example.com/content/media/${MEDIA_HASH}.svg`),
      environment,
      context,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
  });

  it('uses R2 head for HEAD requests and never returns a response body', async () => {
    headObject.mockResolvedValue(createR2Head('versions/release-1/site.json', 321));

    const response = await handleRequest(
      new Request('https://content.example.com/content/versions/release-1/site.json', {
        method: 'HEAD',
      }),
      environment,
      context,
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
    expect(response.headers.get('Content-Length')).toBe('321');
    expect(headObject).toHaveBeenCalledWith('versions/release-1/site.json');
    expect(getObject).not.toHaveBeenCalled();
  });

  it.each(['"content-etag"', 'W/"content-etag", "another"', '*'])(
    'returns 304 for a matching If-None-Match value: %s',
    async (ifNoneMatch) => {
      getObject.mockResolvedValue(createR2Body('published/manifest.json', '{}'));

      const response = await handleRequest(
        new Request('https://content.example.com/content/manifest.json', {
          headers: { 'If-None-Match': ifNoneMatch },
        }),
        environment,
        context,
      );

      expect(response.status).toBe(304);
      expect(response.headers.get('ETag')).toBe('"content-etag"');
      expect(await response.text()).toBe('');
    },
  );

  it('uses a cached immutable response without performing another R2 operation', async () => {
    cacheMatch.mockResolvedValue(
      new Response('cached', {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: '"cached-etag"',
        },
      }),
    );

    const response = await handleRequest(
      new Request(`https://content.example.com/content/media/${MEDIA_HASH}.webp`, {
        headers: { Origin: ALLOWED_ORIGIN },
      }),
      environment,
      context,
    );

    expect(await response.text()).toBe('cached');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(getObject).not.toHaveBeenCalled();
    expect(headObject).not.toHaveBeenCalled();
  });

  it('returns the same generic 404 for invalid paths and absent objects', async () => {
    getObject.mockResolvedValue(null);

    const absentResponse = await handleRequest(
      new Request('https://content.example.com/content/versions/missing/site.json'),
      environment,
      context,
    );
    const invalidResponse = await handleRequest(
      new Request('https://content.example.com/content/../../private/draft.json'),
      environment,
      context,
    );

    expect(absentResponse.status).toBe(404);
    expect(invalidResponse.status).toBe(404);
  });

  it('keeps storage failures opaque to the caller', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getObject.mockRejectedValue(new Error('private storage details'));

    const response = await handleRequest(
      new Request('https://content.example.com/content/manifest.json'),
      environment,
      context,
    );

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('private storage details');
    expect(consoleError).toHaveBeenCalledOnce();
  });
});

function createR2Body(
  key: string,
  content: string,
  storedContentType = 'application/octet-stream',
): PublishedContentObjectBody {
  const encodedContent = new TextEncoder().encode(content);

  return {
    ...createR2Head(key, encodedContent.byteLength),
    body: new Response(encodedContent).body,
    httpMetadata: { contentType: storedContentType },
  } as unknown as PublishedContentObjectBody;
}

function createR2Head(key: string, size: number): PublishedContentObject {
  return {
    checksums: {},
    customMetadata: {},
    etag: 'content-etag',
    httpEtag: '"content-etag"',
    httpMetadata: {},
    key,
    size,
    storageClass: 'Standard',
    uploaded: new Date('2026-07-20T00:00:00.000Z'),
    version: 'version-1',
    writeHttpMetadata: vi.fn(),
  } as unknown as PublishedContentObject;
}
