import { RichTextBlock } from './rich-text-block.model';
import { SiteLink } from './site-link.model';
import { SiteSectionBase } from './site-section-base.model';

export interface ManifestoSectionConfig extends SiteSectionBase {
  readonly type: 'manifesto';
  readonly variant: 'editorial-v1';
  readonly indexLabel: string;
  readonly title: RichTextBlock;
  readonly body: readonly string[];
  readonly link: SiteLink;
}
