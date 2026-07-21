import { MediaReference } from './media-reference.model';
import { Profile } from './profile.model';
import { RichTextBlock } from './rich-text-block.model';
import { SiteLink } from './site-link.model';
import { SiteSectionBase } from './site-section-base.model';

export interface AboutSectionConfig extends SiteSectionBase {
  readonly type: 'about';
  readonly variant: 'portrait-v1';
  readonly profile: Profile;
  readonly portrait: MediaReference;
  readonly portraitAriaLabel: string;
  readonly title: RichTextBlock;
  readonly link: SiteLink;
}
