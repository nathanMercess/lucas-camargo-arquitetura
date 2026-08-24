import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

const PREVIEW_ACCESS_KEY = '2026082414';
const PREVIEW_QUERY_PARAMETER = 'key';
const PREVIEW_SESSION_STORAGE_KEY = 'lucas-camargo-public-site-preview-enabled';

@Injectable({
  providedIn: 'root',
})
export class PreviewAccessService {
  private readonly document = inject(DOCUMENT);

  isEnabled(): boolean {
    const browserWindow = this.document.defaultView;

    if (!browserWindow)
      return false;

    const queryKey = new URLSearchParams(browserWindow.location.search).get(PREVIEW_QUERY_PARAMETER);

    if (queryKey !== null && queryKey !== PREVIEW_ACCESS_KEY)
      return false;

    if (queryKey === PREVIEW_ACCESS_KEY) {
      this.persistSessionAccess(browserWindow);
      return true;
    }

    return this.hasSessionAccess(browserWindow);
  }

  private persistSessionAccess(browserWindow: Window): void {
    try {
      browserWindow.sessionStorage.setItem(PREVIEW_SESSION_STORAGE_KEY, 'true');
    } catch {
      // A chave atual continua liberando a prévia quando o storage está indisponível.
    }
  }

  private hasSessionAccess(browserWindow: Window): boolean {
    try {
      return browserWindow.sessionStorage.getItem(PREVIEW_SESSION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
