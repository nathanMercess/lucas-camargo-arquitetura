import { PublicSiteRuntimeConfig } from './public-site-runtime-config.model';

export interface PublicSiteRuntimeWindow extends Window {
  readonly __LUCAS_CAMARGO_RUNTIME__?: PublicSiteRuntimeConfig;
}
