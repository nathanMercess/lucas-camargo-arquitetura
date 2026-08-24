import { TestBed } from '@angular/core/testing';

import { TurnstileApi } from '../models/turnstile-api.model';
import { TurnstileService } from './turnstile.service';

describe('TurnstileService', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'turnstile');
    document.getElementById('cloudflare-turnstile-script')?.remove();
  });

  it('should render only the contact action through an available Turnstile API', async () => {
    const api: TurnstileApi = {
      render: vi.fn(() => 'contact-widget'),
      reset: vi.fn(),
      remove: vi.fn(),
    };
    Object.defineProperty(window, 'turnstile', { configurable: true, value: api });

    const service = TestBed.inject(TurnstileService);
    const callback = vi.fn();
    const errorCallback = vi.fn();
    const expiredCallback = vi.fn();
    const container = document.createElement('div');
    const widgetId = await service.render(
      container,
      '1x00000000000000000000AA',
      callback,
      errorCallback,
      expiredCallback,
    );

    expect(widgetId).toBe('contact-widget');
    expect(api.render).toHaveBeenCalledWith(
      container,
      expect.objectContaining({
        action: 'contact',
        sitekey: '1x00000000000000000000AA',
        size: 'flexible',
        theme: 'auto',
      }),
    );

    service.reset(widgetId);
    service.remove(widgetId);

    expect(api.reset).toHaveBeenCalledWith(widgetId);
    expect(api.remove).toHaveBeenCalledWith(widgetId);
  });

  it('should load the widget script only from the fixed Cloudflare allowlist URL', async () => {
    const service = TestBed.inject(TurnstileService);
    const renderPromise = service.render(
      document.createElement('div'),
      '1x00000000000000000000AA',
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );
    const script = document.querySelector<HTMLScriptElement>('#cloudflare-turnstile-script');

    expect(script?.src).toBe(
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    );

    script?.dispatchEvent(new Event('error'));

    await expect(renderPromise).rejects.toThrow('Turnstile could not be loaded.');
  });
});
