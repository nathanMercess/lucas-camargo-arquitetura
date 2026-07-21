import { TestBed } from '@angular/core/testing';

import { VisualBuilderRendererService } from './visual-builder-renderer.service';

describe('VisualBuilderRendererService', () => {
  let service: VisualBuilderRendererService;

  beforeEach(() => {
    service = TestBed.inject(VisualBuilderRendererService);
  });

  it('removes executable markup and unsafe URLs from published pages', () => {
    const sanitized = service.sanitizeHtml(
      '<script>alert(1)</script><img src="/content/image.webp" onerror="alert(1)"><a href="javascript:alert(1)">Link</a>',
    );

    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('/content/image.webp');
  });

  it('preserves safe inline presentation and protects external tabs', () => {
    const sanitized = service.sanitizeHtml(
      '<section style="--lc-accent:#e36571"><a href="https://example.com" target="_blank">Abrir</a></section>',
    );

    expect(sanitized).toContain('--lc-accent:#e36571');
    expect(sanitized).toContain('rel="noopener noreferrer"');
  });

  it('removes unsafe CSS directives', () => {
    const sanitized = service.sanitizeCss(
      '@import "https://evil.example/x.css";.safe{color:#fff}.bad{behavior:url(x);background:javascript:x}',
    );

    expect(sanitized).not.toContain('@import');
    expect(sanitized).not.toContain('behavior');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('.safe{color:#fff}');
  });
});
