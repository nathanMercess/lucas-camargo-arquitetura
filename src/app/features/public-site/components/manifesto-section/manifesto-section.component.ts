import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-manifesto-section',
  templateUrl: './manifesto-section.component.html',
  standalone: false,
  styleUrls: ['./manifesto-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManifestoSectionComponent {}
