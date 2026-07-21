import { Metric } from './metric.model';
import { SiteSectionBase } from './site-section-base.model';

export interface MetricsSectionConfig extends SiteSectionBase {
  readonly type: 'metrics';
  readonly variant: 'grid-v1';
  readonly indexLabel: string;
  readonly ariaLabel: string;
  readonly metrics: readonly Metric[];
}
