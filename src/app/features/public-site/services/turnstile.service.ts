import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';

import { PublicSiteRuntimeWindow } from '../models/public-site-runtime-window.model';
import { TurnstileApi } from '../models/turnstile-api.model';
import { TurnstileRenderOptions } from '../models/turnstile-render-options.model';

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

@Injectable({
  providedIn: 'root',
})
export class TurnstileService {
  private readonly document = inject(DOCUMENT);

  private readonly renderer: Renderer2 = inject(RendererFactory2).createRenderer(null, null);

  private loadPromise: Promise<TurnstileApi> | null = null;

  public async render(
    container: HTMLElement,
    siteKey: string,
    callback: (token: string) => void,
    errorCallback: () => void,
    expiredCallback: () => void,
  ): Promise<string> {
    const api = await this.load();
    const options: TurnstileRenderOptions = {
      sitekey: siteKey,
      action: 'contact',
      theme: 'auto',
      size: 'flexible',
      callback,
      'error-callback': errorCallback,
      'expired-callback': expiredCallback,
    };

    return api.render(container, options);
  }

  public reset(widgetId: string): void {
    this.readApi()?.reset(widgetId);
  }

  public remove(widgetId: string): void {
    this.readApi()?.remove(widgetId);
  }

  private load(): Promise<TurnstileApi> {
    const existingApi = this.readApi();

    if (existingApi)
      return Promise.resolve(existingApi);

    if (this.loadPromise)
      return this.loadPromise;

    this.loadPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const runtimeWindow = this.readRuntimeWindow();

      if (!runtimeWindow || !this.isAllowedScriptUrl(TURNSTILE_SCRIPT_URL)) {
        reject(new Error('Turnstile is unavailable.'));
        return;
      }

      const existingScript = this.document.getElementById(
        TURNSTILE_SCRIPT_ID,
      ) as HTMLScriptElement | null;

      if (existingScript && existingScript.src !== TURNSTILE_SCRIPT_URL) {
        reject(new Error('Turnstile script origin is not allowed.'));
        return;
      }

      const script = existingScript ?? (this.renderer.createElement('script') as HTMLScriptElement);

      const handleLoad = () => {
        const api = this.readApi();

        if (api)
          resolve(api);
        else
          reject(new Error('Turnstile did not initialize.'));
      };
      const handleError = () => reject(new Error('Turnstile could not be loaded.'));

      this.renderer.listen(script, 'load', handleLoad);
      this.renderer.listen(script, 'error', handleError);

      if (existingScript)
        return;

      this.renderer.setAttribute(script, 'id', TURNSTILE_SCRIPT_ID);
      this.renderer.setAttribute(script, 'src', TURNSTILE_SCRIPT_URL);
      this.renderer.setAttribute(script, 'async', '');
      this.renderer.setAttribute(script, 'defer', '');
      this.renderer.appendChild(this.document.head, script);
    });

    return this.loadPromise;
  }

  private readApi(): TurnstileApi | undefined {
    return this.readRuntimeWindow()?.turnstile;
  }

  private readRuntimeWindow(): PublicSiteRuntimeWindow | null {
    return this.document.defaultView as PublicSiteRuntimeWindow | null;
  }

  private isAllowedScriptUrl(value: string): boolean {
    return value === TURNSTILE_SCRIPT_URL;
  }
}
