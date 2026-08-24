import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ContactFormSubmission } from '../models/contact-form-submission.model';
import { ContactSubmissionService } from './contact-submission.service';
import { PublicSiteRuntimeConfigService } from './public-site-runtime-config.service';

describe('ContactSubmissionService', () => {
  const runtimeConfig: {
    contactEndpointUrl: string | null;
    isContactEnabled: boolean;
    turnstileSiteKey: string | null;
  } = {
    contactEndpointUrl: 'https://contact.example.com/contact',
    isContactEnabled: true,
    turnstileSiteKey: '1x00000000000000000000AA',
  };
  const submission: ContactFormSubmission = {
    name: 'Nathan',
    email: 'nathan@example.com',
    phone: '+55 11 98668-1572',
    subject: 'Novo projeto',
    message: 'Mensagem de contato.',
    turnstileToken: 'verified-token',
    website: '',
  };

  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    runtimeConfig.contactEndpointUrl = 'https://contact.example.com/contact';
    runtimeConfig.isContactEnabled = true;
    runtimeConfig.turnstileSiteKey = '1x00000000000000000000AA';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PublicSiteRuntimeConfigService, useValue: runtimeConfig },
      ],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('should POST the exact contact contract with its fixed request header and accept only 202', async () => {
    const service = TestBed.inject(ContactSubmissionService);
    const responsePromise = firstValueFrom(service.submit(submission));
    const request = httpTestingController.expectOne(runtimeConfig.contactEndpointUrl!);

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Contact-Form')).toBe('1');
    expect(request.request.body).toEqual(submission);

    request.flush(null, { status: 202, statusText: 'Accepted' });

    await expect(responsePromise).resolves.toBeUndefined();
  });

  it('should reject a successful HTTP response with an unexpected status', async () => {
    const service = TestBed.inject(ContactSubmissionService);
    const responsePromise = firstValueFrom(service.submit(submission));

    httpTestingController.expectOne(runtimeConfig.contactEndpointUrl!).flush(null);

    await expect(responsePromise).rejects.toThrow('Unexpected contact response status.');
  });

  it('should fail closed without making a request when the runtime endpoint is absent', async () => {
    runtimeConfig.contactEndpointUrl = null;
    runtimeConfig.isContactEnabled = false;

    const service = TestBed.inject(ContactSubmissionService);

    await expect(firstValueFrom(service.submit(submission))).rejects.toThrow(
      'Contact endpoint is unavailable.',
    );
  });
});
