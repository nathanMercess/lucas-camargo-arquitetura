import { TestBed } from '@angular/core/testing';

import { PublicSiteRuntimeWindow } from '../models/public-site-runtime-window.model';
import { PublicSiteRuntimeConfigService } from './public-site-runtime-config.service';

describe('PublicSiteRuntimeConfigService', () => {
  afterEach(() => Reflect.deleteProperty(window, '__LUCAS_CAMARGO_RUNTIME__'));

  it('should expose a safe contact endpoint and public Turnstile site key', () => {
    setRuntimeConfig({
      contentBaseUrl: '/content',
      contactEndpointUrl: 'https://lucas-camargo-contact.example.workers.dev/contact',
      turnstileSiteKey: '1x00000000000000000000AA',
    });

    const service = TestBed.inject(PublicSiteRuntimeConfigService);

    expect(service.contactEndpointUrl).toBe(
      'https://lucas-camargo-contact.example.workers.dev/contact',
    );
    expect(service.turnstileSiteKey).toBe('1x00000000000000000000AA');
    expect(service.isContactEnabled).toBe(true);
  });

  it('should fail closed for an unsafe runtime endpoint or site key', () => {
    setRuntimeConfig({
      contentBaseUrl: '/content',
      contactEndpointUrl: 'https://user@example.com/contact?redirect=evil',
      turnstileSiteKey: '<unsafe>',
    });

    const service = TestBed.inject(PublicSiteRuntimeConfigService);

    expect(service.contactEndpointUrl).toBeNull();
    expect(service.turnstileSiteKey).toBeNull();
    expect(service.isContactEnabled).toBe(false);
  });
});

function setRuntimeConfig(
  runtimeConfig: NonNullable<PublicSiteRuntimeWindow['__LUCAS_CAMARGO_RUNTIME__']>,
): void {
  Object.defineProperty(window as PublicSiteRuntimeWindow, '__LUCAS_CAMARGO_RUNTIME__', {
    configurable: true,
    value: runtimeConfig,
  });
}
