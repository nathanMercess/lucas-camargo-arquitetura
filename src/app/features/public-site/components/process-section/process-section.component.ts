import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-process-section',
  templateUrl: './process-section.component.html',
  standalone: false,
  styleUrls: ['./process-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessSectionComponent {}
