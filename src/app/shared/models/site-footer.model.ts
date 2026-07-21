import { FooterLink } from './footer-link.model';
import { MediaReference } from './media-reference.model';
import { SiteLink } from './site-link.model';
import { SocialLink } from './social-link.model';

export interface SiteFooter {
  readonly logo: MediaReference;
  readonly links: readonly FooterLink[];
  readonly socialLinks: readonly SocialLink[];
  readonly statement: string;
  readonly location: string;
  readonly copyrightOwner: string;
  readonly backToTopLink: SiteLink;
}
