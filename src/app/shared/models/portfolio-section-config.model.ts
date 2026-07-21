import { RichTextBlock } from './rich-text-block.model';
import { SiteSectionBase } from './site-section-base.model';

export interface PortfolioSectionConfig extends SiteSectionBase {
  readonly type: 'portfolio';
  readonly variant: 'horizontal-accordion-v1';
  readonly overline: string;
  readonly title: RichTextBlock;
  readonly description: readonly string[];
  readonly categoryIds: readonly string[];
  readonly autoRotationEnabled: boolean;
  readonly autoRotationIntervalMs: number;
}
