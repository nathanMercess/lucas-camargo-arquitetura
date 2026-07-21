import { ProcessStep } from './process-step.model';
import { SiteSectionBase } from './site-section-base.model';

export interface ProcessSectionConfig extends SiteSectionBase {
  readonly type: 'process';
  readonly variant: 'steps-v1';
  readonly overline: string;
  readonly title: string;
  readonly steps: readonly ProcessStep[];
}
