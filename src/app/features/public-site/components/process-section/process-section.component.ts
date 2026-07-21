import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ProcessSectionConfig } from '../../../../shared/models/process-section-config.model';

@Component({
  selector: 'app-process-section',
  templateUrl: './process-section.component.html',
  standalone: false,
  styleUrls: ['./process-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessSectionComponent {
  public readonly config = input.required<ProcessSectionConfig>();
}
