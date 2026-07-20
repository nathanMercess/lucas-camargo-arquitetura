import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContactChannel } from '../../../../shared/models/contact-channel.model';

@Component({
  selector: 'app-contact-section',
  templateUrl: './contact-section.component.html',
  standalone: false,
  styleUrls: ['./contact-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSectionComponent {
  public readonly contactChannels = input.required<readonly ContactChannel[]>();
}
