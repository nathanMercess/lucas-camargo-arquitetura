import { TurnstileVerification } from '../models/turnstile-verification.model';

const siteverifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp: string | null,
  allowedHostnames: ReadonlySet<string>,
  fetcher: typeof fetch = fetch,
): Promise<TurnstileVerification | null> {
  const body = new FormData();

  body.set('secret', secret);
  body.set('response', token);
  body.set('idempotency_key', crypto.randomUUID());

  if (remoteIp)
    body.set('remoteip', remoteIp);

  try {
    const response = await fetcher(siteverifyUrl, {
      body,
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok)
      return null;

    const verification = await response.json() as TurnstileVerification;
    const hostname = verification.hostname?.toLowerCase();

    if (
      verification.success !== true ||
      verification.action !== 'contact' ||
      !hostname ||
      !allowedHostnames.has(hostname)
    )
      return null;

    return { ...verification, hostname };
  } catch {
    return null;
  }
}
