import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const siteConfig = JSON.parse(await readFile('public/content/site-config.v1.json', 'utf8'));
const manifests = await Promise.all([
  readJson('public/content/manifest.json'),
  readJson('deploy/initial-published-manifest.json'),
]);
const serializedConfig = JSON.stringify(siteConfig);
const actualSha256 = createHash('sha256').update(serializedConfig).digest('hex');

for (const manifest of manifests) {
  if (manifest.releaseId !== siteConfig.releaseId)
    throw new Error(`Manifest ${manifest.source} has a releaseId different from the site config.`);

  if (manifest.sha256 !== actualSha256)
    throw new Error(`Manifest ${manifest.source} has an invalid SHA-256.`);
}

console.log(`Content manifests verified: ${actualSha256}`);

async function readJson(path) {
  return {
    ...JSON.parse(await readFile(path, 'utf8')),
    source: path,
  };
}
