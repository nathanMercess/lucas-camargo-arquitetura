import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SiteContact } from '../../../../shared/models/site-contact.model';
import { WhatsappCtaSectionConfig } from '../../../../shared/models/whatsapp-cta-section-config.model';

@Component({
  selector: 'app-whatsapp-cta-section',
  templateUrl: './whatsapp-cta-section.component.html',
  standalone: false,
  styleUrls: ['./whatsapp-cta-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappCtaSectionComponent {
  public readonly config = input.required<WhatsappCtaSectionConfig>();

  public readonly contact = input.required<SiteContact>();

  public readonly href = computed(() => {
    const whatsappNumber = this.contact().whatsappNumber;

    if (!/^[1-9][0-9]{7,14}$/.test(whatsappNumber))
      return null;

    const message = this.config().message.trim() || this.contact().whatsappDefaultMessage.trim();

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  });
}
