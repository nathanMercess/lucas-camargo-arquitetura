import { PracticeArea } from './practice-area.model';
import { RichTextBlock } from './rich-text-block.model';
import { SiteSectionBase } from './site-section-base.model';

export interface PracticeSectionConfig extends SiteSectionBase {
  readonly type: 'practice';
  readonly variant: 'editorial-list-v1';
  readonly indexLabel: string;
  readonly overline: string;
  readonly title: RichTextBlock;
  readonly practiceAreas: readonly PracticeArea[];
}
