import { PublicSiteRuntimeConfig } from './public-site-runtime-config.model';
import { TurnstileApi } from './turnstile-api.model';

export interface PublicSiteRuntimeWindow extends Window {
  readonly __LUCAS_CAMARGO_RUNTIME__?: PublicSiteRuntimeConfig;
  readonly turnstile?: TurnstileApi;
}
