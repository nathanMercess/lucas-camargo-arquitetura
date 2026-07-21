import { describe, expect, it } from 'vitest';

import { resolveContentResource } from '../src/routing/resolve-content-resource';

const MEDIA_HASH = 'a'.repeat(64);

describe('resolveContentResource', () => {
  it('maps the public manifest route to the fixed published key', () => {
    const resource = resolveContentResource(
      new URL('https://content.example.com/content/manifest.json'),
    );

    expect(resource).toEqual({
      cacheControl: 'public, max-age=60, must-revalidate',
      contentType: 'application/json; charset=utf-8',
      key: 'published/manifest.json',
    });
  });

  it('maps a validated release to its immutable document', () => {
    const resource = resolveContentResource(
      new URL('https://content.example.com/content/versions/2026-07-20_a1/site.json'),
    );

    expect(resource).toEqual({
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: 'application/json; charset=utf-8',
      key: 'versions/2026-07-20_a1/site.json',
    });
  });

  it('maps a content-addressed media path with a safe content type', () => {
    const resource = resolveContentResource(
      new URL(`https://content.example.com/content/media/${MEDIA_HASH}.webp`),
    );

    expect(resource).toEqual({
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: 'image/webp',
      key: `media/${MEDIA_HASH}.webp`,
    });
  });

  it.each([
    '/content/versions/../site.json',
    '/content/versions/Release-1/site.json',
    '/content/versions/release-1_/site.json',
    '/content/versions/release-1/other.json',
    `/content/media/${MEDIA_HASH}.html`,
    `/content/media/${'g'.repeat(64)}.webp`,
    `/content/media/${MEDIA_HASH}/image.webp`,
    '/content/%2e%2e/manifest.json',
    '/content//manifest.json',
  ])('rejects an unrecognized or unsafe path: %s', (pathname) => {
    expect(resolveContentResource(new URL(`https://content.example.com${pathname}`))).toBeNull();
  });

  it('rejects query parameters so cache keys stay canonical', () => {
    const resource = resolveContentResource(
      new URL('https://content.example.com/content/manifest.json?release=other'),
    );

    expect(resource).toBeNull();
  });
});
