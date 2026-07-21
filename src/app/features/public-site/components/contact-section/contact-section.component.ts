import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContactSectionConfig } from '../../../../shared/models/contact-section-config.model';

@Component({
  selector: 'app-contact-section',
  templateUrl: './contact-section.component.html',
  standalone: false,
  styleUrls: ['./contact-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSectionComponent {
  public readonly config = input.required<ContactSectionConfig>();
}
