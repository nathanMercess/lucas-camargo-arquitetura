import { ContactChannel } from './contact-channel.model';
import { RichTextBlock } from './rich-text-block.model';
import { SiteLink } from './site-link.model';
import { SiteSectionBase } from './site-section-base.model';

export interface ContactSectionConfig extends SiteSectionBase {
  readonly type: 'contact';
  readonly variant: 'editorial-v1';
  readonly overline: string;
  readonly title: RichTextBlock;
  readonly cta: SiteLink;
  readonly contactChannels: readonly ContactChannel[];
}
