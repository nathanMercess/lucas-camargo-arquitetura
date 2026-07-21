import { MediaReference } from './media-reference.model';
import { SiteLink } from './site-link.model';

export interface SiteHeader {
  readonly logo: MediaReference;
  readonly homeLink: SiteLink;
  readonly primaryCta: SiteLink;
}
