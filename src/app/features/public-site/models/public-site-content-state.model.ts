import { SiteDocument } from '../../../shared/models/site-document.model';

export interface PublicSiteContentState {
  readonly config: SiteDocument;
  readonly isLoading: boolean;
}
