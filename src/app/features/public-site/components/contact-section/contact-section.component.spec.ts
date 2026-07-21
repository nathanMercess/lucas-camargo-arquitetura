import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { ContactSectionConfig } from '../../../../shared/models/contact-section-config.model';
import { RichTextComponent } from '../rich-text/rich-text.component';
import { ContactSectionComponent } from './contact-section.component';

const defaultContactConfig = DEFAULT_SITE_CONFIG.sections.find(
  (section) => section.type === 'contact',
);

if (!defaultContactConfig)
  throw new Error('A configuração padrão de contato é obrigatória.');

describe('ContactSectionComponent', () => {
  let fixture: ComponentFixture<ContactSectionComponent>;

  const config: ContactSectionConfig = {
    ...defaultContactConfig,
    contactChannels: [
      {
        id: 'email',
        label: 'E-mail',
        value: 'arquiteto@lucascamargo.com',
        href: 'mailto:arquiteto@lucascamargo.com',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContactSectionComponent, RichTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactSectionComponent);
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
  });

  it('should render contact channels without decorative icons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const emailLink = compiled.querySelector('a[href="mailto:arquiteto@lucascamargo.com"]');

    expect(emailLink?.textContent).toContain('arquiteto@lucascamargo.com');
    expect(compiled.querySelector('svg')).toBeNull();
  });
});
