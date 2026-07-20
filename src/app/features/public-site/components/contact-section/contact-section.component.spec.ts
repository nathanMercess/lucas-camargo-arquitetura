import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactChannel } from '../../../../shared/models/contact-channel.model';
import { ContactSectionComponent } from './contact-section.component';

describe('ContactSectionComponent', () => {
  let fixture: ComponentFixture<ContactSectionComponent>;

  const channels: readonly ContactChannel[] = [
    {
      id: 'email',
      label: 'E-mail',
      value: 'arquiteto@lucascamargo.com',
      href: 'mailto:arquiteto@lucascamargo.com',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContactSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactSectionComponent);
    fixture.componentRef.setInput('contactChannels', channels);
    fixture.detectChanges();
  });

  it('should render contact channels without decorative icons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('a')?.textContent).toContain('arquiteto@lucascamargo.com');
    expect(compiled.querySelector('svg')).toBeNull();
  });
});
