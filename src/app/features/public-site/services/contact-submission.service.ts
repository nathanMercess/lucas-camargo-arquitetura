import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, take, throwError } from 'rxjs';

import { ContactFormSubmission } from '../models/contact-form-submission.model';
import { PublicSiteRuntimeConfigService } from './public-site-runtime-config.service';

@Injectable({
  providedIn: 'root',
})
export class ContactSubmissionService {
  private readonly http = inject(HttpClient);

  private readonly runtimeConfig = inject(PublicSiteRuntimeConfigService);

  public readonly isAvailable = this.runtimeConfig.isContactEnabled;

  public submit(submission: ContactFormSubmission): Observable<void> {
    const endpointUrl = this.runtimeConfig.contactEndpointUrl;

    if (!endpointUrl)
      return throwError(() => new Error('Contact endpoint is unavailable.'));

    return this.http
      .post<void>(endpointUrl, submission, {
        headers: new HttpHeaders({ 'X-Contact-Form': '1' }),
        observe: 'response',
      })
      .pipe(
        take(1),
        map((response) => {
          if (response.status !== 202)
            throw new Error('Unexpected contact response status.');
        }),
      );
  }
}
