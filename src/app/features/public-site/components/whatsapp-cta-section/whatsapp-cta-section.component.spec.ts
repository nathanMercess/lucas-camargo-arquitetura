import { TestBed } from '@angular/core/testing';

import { SiteContact } from '../../../../shared/models/site-contact.model';
import { WhatsappCtaSectionConfig } from '../../../../shared/models/whatsapp-cta-section-config.model';
import { createSiteConfigV2Fixture } from '../../../../shared/testing/create-site-config-v2.fixture';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';
import { RichTextComponent } from '../rich-text/rich-text.component';
import { WhatsappCtaSectionComponent } from './whatsapp-cta-section.component';

describe('WhatsappCtaSectionComponent', () => {
  const siteDocument = createSiteConfigV2Fixture();
  const config = siteDocument.pages[0]!.sections.find(
    (section): section is WhatsappCtaSectionConfig => section.type === 'whatsapp-cta',
  )!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WhatsappCtaSectionComponent,
        RichTextComponent,
        RevealOnScrollDirective,
      ],
    }).compileComponents();
  });

  it('should build an encoded WhatsApp URL only from validated contact data', () => {
    const fixture = TestBed.createComponent(WhatsappCtaSectionComponent);

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('contact', siteDocument.contact);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a');

    expect(link?.href).toContain('https://wa.me/5511986681572');
    expect(link?.href).toContain(`text=${encodeURIComponent(config.message)}`);
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toBe('noopener noreferrer');
  });

  it('should fail closed instead of rendering a link for an unsafe number', () => {
    const fixture = TestBed.createComponent(WhatsappCtaSectionComponent);
    const unsafeContact: SiteContact = {
      ...siteDocument.contact,
      whatsappNumber: '+5511986681572',
    };

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('contact', unsafeContact);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('a')).toBeNull();
  });
});
