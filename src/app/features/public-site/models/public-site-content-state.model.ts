import { SiteConfigV1 } from '../../../shared/models/site-config-v1.model';

export interface PublicSiteContentState {
  readonly config: SiteConfigV1;
  readonly isLoading: boolean;
}
