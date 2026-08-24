import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { of, throwError } from 'rxjs';

import { ContactFormSectionConfig } from '../../../../shared/models/contact-form-section-config.model';
import { createSiteConfigV2Fixture } from '../../../../shared/testing/create-site-config-v2.fixture';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';
import { ContactSubmissionService } from '../../services/contact-submission.service';
import { PublicSiteRuntimeConfigService } from '../../services/public-site-runtime-config.service';
import { TurnstileService } from '../../services/turnstile.service';
import { RichTextComponent } from '../rich-text/rich-text.component';
import { ContactFormSectionComponent } from './contact-form-section.component';

describe('ContactFormSectionComponent', () => {
  const config = createSiteConfigV2Fixture().pages[0]!.sections.find(
    (section): section is ContactFormSectionConfig => section.type === 'contact-form',
  )!;
  const submissionService = {
    isAvailable: true,
    submit: vi.fn(() => of(undefined)),
  };
  const runtimeConfig: {
    contactEndpointUrl: string | null;
    isContactEnabled: boolean;
    turnstileSiteKey: string | null;
  } = {
    contactEndpointUrl: '/contact',
    isContactEnabled: true,
    turnstileSiteKey: '1x00000000000000000000AA',
  };
  const turnstile = {
    render: vi.fn(
      async (
        _container: HTMLElement,
        _siteKey: string,
        callback: (token: string) => void,
      ) => {
        callback('verified-token');
        return 'contact-widget';
      },
    ),
    reset: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    submissionService.isAvailable = true;
    submissionService.submit.mockReset();
    submissionService.submit.mockReturnValue(of(undefined));
    runtimeConfig.contactEndpointUrl = '/contact';
    runtimeConfig.isContactEnabled = true;
    runtimeConfig.turnstileSiteKey = '1x00000000000000000000AA';
    turnstile.render.mockClear();
    turnstile.reset.mockClear();
    turnstile.remove.mockClear();

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ButtonModule],
      declarations: [
        ContactFormSectionComponent,
        RichTextComponent,
        RevealOnScrollDirective,
      ],
      providers: [
        { provide: ContactSubmissionService, useValue: submissionService },
        { provide: PublicSiteRuntimeConfigService, useValue: runtimeConfig },
        { provide: TurnstileService, useValue: turnstile },
      ],
    }).compileComponents();
  });

  it('should expose accessible fields and submit the exact Worker contract after Turnstile', async () => {
    const fixture = TestBed.createComponent(ContactFormSectionComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
    await fixture.whenStable();

    component.form.setValue({
      name: 'Nathan',
      email: 'nathan@example.com',
      phone: '+55 11 98668-1572',
      subject: 'Novo projeto',
      message: 'Gostaria de conversar sobre uma residência.',
      website: '',
    });
    component.submit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(turnstile.render).toHaveBeenCalled();
    expect(submissionService.submit).toHaveBeenCalledWith({
      name: 'Nathan',
      email: 'nathan@example.com',
      phone: '+55 11 98668-1572',
      subject: 'Novo projeto',
      message: 'Gostaria de conversar sobre uma residência.',
      turnstileToken: 'verified-token',
      website: '',
    });
    expect(turnstile.reset).toHaveBeenCalledWith('contact-widget');
    expect(compiled.querySelector('label[for="contact-form-name"]')).not.toBeNull();
    expect(compiled.querySelector('label[for="contact-form-email"]')).not.toBeNull();
    expect(compiled.querySelector<HTMLInputElement>('#contact-form-website')?.tabIndex).toBe(-1);
    expect(compiled.textContent).toContain(config.successMessage);
  });

  it.each([400, 403, 413, 429, 502])(
    'should show only the configured safe error and reset Turnstile after HTTP %s',
    async (status) => {
      submissionService.submit.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status, statusText: 'Unsafe server detail' })),
      );

      const fixture = TestBed.createComponent(ContactFormSectionComponent);
      const component = fixture.componentInstance;

      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();
      await fixture.whenStable();
      component.form.setValue({
        name: 'Nathan',
        email: 'nathan@example.com',
        phone: '11986681572',
        subject: 'Contato',
        message: 'Mensagem de contato.',
        website: '',
      });
      component.submit();
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain(config.errorMessage);
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
        'Unsafe server detail',
      );
      expect(turnstile.reset).toHaveBeenCalledWith('contact-widget');
    },
  );

  it('should disable submission and keep a safe page state when runtime configuration is absent', () => {
    submissionService.isAvailable = false;
    runtimeConfig.contactEndpointUrl = null;
    runtimeConfig.isContactEnabled = false;
    runtimeConfig.turnstileSiteKey = null;

    const fixture = TestBed.createComponent(ContactFormSectionComponent);

    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('form')).not.toBeNull();
    expect(compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain(
      'temporariamente indisponível',
    );
    expect(turnstile.render).not.toHaveBeenCalled();
  });

  it('should reject values that the Worker contract cannot accept', () => {
    const fixture = TestBed.createComponent(ContactFormSectionComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();

    component.form.patchValue({
      name: 'N',
      email: 'nathan@example.com',
      phone: '1234567',
      subject: 'Oi',
      message: 'Curta',
    });

    expect(component.form.invalid).toBe(true);
    expect(submissionService.submit).not.toHaveBeenCalled();
  });
});
