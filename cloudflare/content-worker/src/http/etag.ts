export function matchesIfNoneMatch(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch || !etag)
    return false;

  return ifNoneMatch
    .split(',')
    .map((candidate) => removeWeakPrefix(candidate.trim()))
    .some((candidate) => candidate === '*' || candidate === removeWeakPrefix(etag));
}

function removeWeakPrefix(etag: string): string {
  return etag.startsWith('W/') ? etag.slice(2) : etag;
}
