import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MetricsSectionConfig } from '../../../../shared/models/metrics-section-config.model';

@Component({
  selector: 'app-metrics-section',
  templateUrl: './metrics-section.component.html',
  standalone: false,
  styleUrls: ['./metrics-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsSectionComponent {
  public readonly config = input.required<MetricsSectionConfig>();
}
