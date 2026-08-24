import { appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';
const WIDGET_NAME = 'Formulário de contato - lucascamargo.com';
const WIDGET_DOMAINS = [
  'lucascamargo.com',
  'www.lucascamargo.com',
  'lucas-camargo-site-373724198767.us-central1.run.app',
  'lucas-camargo-site-mxhlj4sa3a-uc.a.run.app',
];

function requiredEnvironmentVariable(name) {
  const value = process.env[name]?.trim();

  if (!value)
    throw new Error(`A variável ${name} é obrigatória.`);

  return value;
}

async function cloudflareRequest(accountId, apiToken, path, init = {}) {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    const details = Array.isArray(payload.errors)
      ? payload.errors.map((error) => error.message).filter(Boolean).join('; ')
      : '';

    throw new Error(details || `A API da Cloudflare respondeu com HTTP ${response.status}.`);
  }

  return payload.result;
}

function sameDomains(actualDomains) {
  if (!Array.isArray(actualDomains) || actualDomains.length !== WIDGET_DOMAINS.length)
    return false;

  const actual = [...actualDomains].sort();
  const expected = [...WIDGET_DOMAINS].sort();

  return expected.every((domain, index) => domain === actual[index]);
}

async function findOrCreateWidget(accountId, apiToken) {
  const filter = encodeURIComponent(`name:${WIDGET_NAME}`);
  const widgets = await cloudflareRequest(
    accountId,
    apiToken,
    `/challenges/widgets?per_page=50&filter=${filter}`,
  );

  if (!Array.isArray(widgets))
    throw new Error('A Cloudflare retornou uma lista de widgets inválida.');

  const matches = widgets.filter((widget) => widget.name === WIDGET_NAME);

  if (matches.length > 1)
    throw new Error(`Há mais de um widget Turnstile com o nome "${WIDGET_NAME}".`);

  if (matches.length === 1)
    return matches[0];

  return cloudflareRequest(accountId, apiToken, '/challenges/widgets', {
    method: 'POST',
    body: JSON.stringify({
      name: WIDGET_NAME,
      domains: WIDGET_DOMAINS,
      mode: 'managed',
    }),
  });
}

async function ensureWidgetConfiguration(accountId, apiToken, widget) {
  const current = await cloudflareRequest(
    accountId,
    apiToken,
    `/challenges/widgets/${encodeURIComponent(widget.sitekey)}`,
  );

  if (current.name === WIDGET_NAME && current.mode === 'managed' && sameDomains(current.domains))
    return current;

  return cloudflareRequest(
    accountId,
    apiToken,
    `/challenges/widgets/${encodeURIComponent(widget.sitekey)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        name: WIDGET_NAME,
        domains: WIDGET_DOMAINS,
        mode: 'managed',
      }),
    },
  );
}

function storeWorkerSecret(secret) {
  process.stdout.write(`::add-mask::${secret}\n`);

  const command = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
  const result = spawnSync(command, ['wrangler', 'secret', 'put', 'TURNSTILE_SECRET_KEY'], {
    input: `${secret}\n`,
    stdio: ['pipe', 'inherit', 'inherit'],
    encoding: 'utf8',
    env: process.env,
  });

  if (result.status !== 0)
    throw new Error('Não foi possível cadastrar o segredo Turnstile no Worker.');
}

async function main() {
  const accountId = requiredEnvironmentVariable('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = requiredEnvironmentVariable('CLOUDFLARE_API_TOKEN');
  const githubOutput = requiredEnvironmentVariable('GITHUB_OUTPUT');
  const widget = await findOrCreateWidget(accountId, apiToken);
  const configuredWidget = await ensureWidgetConfiguration(accountId, apiToken, widget);

  if (!configuredWidget.sitekey || !configuredWidget.secret)
    throw new Error('A Cloudflare não retornou as chaves completas do widget Turnstile.');

  storeWorkerSecret(configuredWidget.secret);
  appendFileSync(githubOutput, `turnstile_site_key=${configuredWidget.sitekey}\n`, 'utf8');
  process.stdout.write(`Widget Turnstile pronto: ${configuredWidget.sitekey}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Falha desconhecida ao configurar o Turnstile.';

  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
