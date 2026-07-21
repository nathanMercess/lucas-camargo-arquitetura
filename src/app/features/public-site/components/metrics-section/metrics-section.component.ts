import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Metric } from '../../../../shared/models/metric.model';

@Component({
  selector: 'app-metrics-section',
  templateUrl: './metrics-section.component.html',
  standalone: false,
  styleUrls: ['./metrics-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsSectionComponent {
  readonly metrics = input.required<readonly Metric[]>();
}
