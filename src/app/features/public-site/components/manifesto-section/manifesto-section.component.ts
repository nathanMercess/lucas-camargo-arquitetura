import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ManifestoSectionConfig } from '../../../../shared/models/manifesto-section-config.model';

@Component({
  selector: 'app-manifesto-section',
  templateUrl: './manifesto-section.component.html',
  standalone: false,
  styleUrls: ['./manifesto-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManifestoSectionComponent {
  public readonly config = input.required<ManifestoSectionConfig>();
}
