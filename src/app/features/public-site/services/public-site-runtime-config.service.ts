import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { PublicSiteRuntimeWindow } from '../models/public-site-runtime-window.model';

@Injectable({
  providedIn: 'root',
})
export class PublicSiteRuntimeConfigService {
  private readonly document = inject(DOCUMENT);

  public readonly contactEndpointUrl = this.readContactEndpointUrl();

  public readonly turnstileSiteKey = this.readTurnstileSiteKey();

  public readonly isContactEnabled = Boolean(this.contactEndpointUrl && this.turnstileSiteKey);

  private readContactEndpointUrl(): string | null {
    const value = this.readRuntimeWindow()?.__LUCAS_CAMARGO_RUNTIME__?.contactEndpointUrl?.trim();

    if (!value || !this.isSafeEndpointUrl(value))
      return null;

    return value;
  }

  private readTurnstileSiteKey(): string | null {
    const value = this.readRuntimeWindow()?.__LUCAS_CAMARGO_RUNTIME__?.turnstileSiteKey?.trim();

    if (!value || !/^[a-zA-Z0-9_-]{3,100}$/.test(value))
      return null;

    return value;
  }

  private readRuntimeWindow(): PublicSiteRuntimeWindow | null {
    return this.document.defaultView as PublicSiteRuntimeWindow | null;
  }

  private isSafeEndpointUrl(value: string): boolean {
    if (/^\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value))
      return !value.includes('..') && !value.includes('//');

    try {
      const url = new URL(value);

      return (
        url.protocol === 'https:' &&
        url.username === '' &&
        url.password === '' &&
        url.search === '' &&
        url.hash === ''
      );
    } catch {
      return false;
    }
  }
}
