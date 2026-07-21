import { ContentResource } from '../models/content-resource.model';

const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const MANIFEST_CACHE_CONTROL = 'public, max-age=60, must-revalidate';

const MEDIA_CONTENT_TYPES: Readonly<Record<string, string>> = {
  avif: 'image/avif',
  gif: 'image/gif',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  mp4: 'video/mp4',
  otf: 'font/otf',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  webm: 'video/webm',
  webp: 'image/webp',
  woff: 'font/woff',
  woff2: 'font/woff2',
};

const MEDIA_PATH_PATTERN =
  /^\/content\/media\/([a-f0-9]{64})\.(avif|gif|ico|jpeg|jpg|mp4|otf|pdf|png|svg|ttf|webm|webp|woff|woff2)$/;
const VERSION_PATH_PATTERN =
  /^\/content\/versions\/([a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?)\/site\.json$/;

export function resolveContentResource(url: URL): ContentResource | null {
  if (url.search || url.pathname.length > 256 || hasUnsafePathSyntax(url.pathname))
    return null;

  if (url.pathname === '/content/manifest.json')
    return {
      cacheControl: MANIFEST_CACHE_CONTROL,
      contentType: 'application/json; charset=utf-8',
      key: 'published/manifest.json',
    };

  const versionMatch = VERSION_PATH_PATTERN.exec(url.pathname);

  if (versionMatch)
    return {
      cacheControl: IMMUTABLE_CACHE_CONTROL,
      contentType: 'application/json; charset=utf-8',
      key: `versions/${versionMatch[1]}/site.json`,
    };

  const mediaMatch = MEDIA_PATH_PATTERN.exec(url.pathname);

  if (!mediaMatch)
    return null;

  const hash = mediaMatch[1];
  const extension = mediaMatch[2];
  const contentType = extension ? MEDIA_CONTENT_TYPES[extension] : undefined;

  if (!hash || !extension || !contentType)
    return null;

  return {
    cacheControl: IMMUTABLE_CACHE_CONTROL,
    contentType,
    key: `media/${hash}.${extension}`,
  };
}

function hasUnsafePathSyntax(pathname: string): boolean {
  return pathname.includes('%') || pathname.includes('\\') || pathname.includes('//');
}
