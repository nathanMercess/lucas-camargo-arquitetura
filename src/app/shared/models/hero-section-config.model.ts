import { MediaReference } from './media-reference.model';
import { RichTextBlock } from './rich-text-block.model';
import { SiteLink } from './site-link.model';
import { SiteSectionBase } from './site-section-base.model';

export interface HeroSectionConfig extends SiteSectionBase {
  readonly type: 'hero';
  readonly variant: 'editorial-v1';
  readonly overline: string;
  readonly title: RichTextBlock;
  readonly supportingText: RichTextBlock;
  readonly portfolioLink: SiteLink;
  readonly background: MediaReference;
  readonly indexLabel: string;
  readonly caption: string;
}
