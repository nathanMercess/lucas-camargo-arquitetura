import { ContentResource } from '../models/content-resource.model';
import { PublishedContentObject } from '../models/published-content-object.model';
import { applySecurityHeaders } from './security-headers';

export function createResourceHeaders(
  resource: ContentResource,
  object: PublishedContentObject,
): Headers {
  const headers = new Headers({
    'Cache-Control': resource.cacheControl,
    'Content-Length': object.size.toString(),
    'Content-Type': resource.contentType,
    ETag: object.httpEtag,
    'Last-Modified': object.uploaded.toUTCString(),
  });

  applySecurityHeaders(headers);

  return headers;
}
