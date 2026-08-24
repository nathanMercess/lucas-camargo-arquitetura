import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { SiteDocument } from '../../../../shared/models/site-document.model';
import { createSiteConfigV2Fixture } from '../../../../shared/testing/create-site-config-v2.fixture';
import { PortfolioGridComponent } from '../portfolio-grid/portfolio-grid.component';
import { PublicSiteRoutingModule, PUBLIC_SITE_ROUTES } from '../../public-site-routing.module';
import { PublicSiteModule } from '../../public-site.module';
import { PublicSiteContentService } from '../../services/public-site-content.service';
import { ConfigurablePageComponent } from './configurable-page.component';

describe('ConfigurablePageComponent', () => {
  const siteDocument = createSiteConfigV2Fixture();
  const config = signal<SiteDocument>(siteDocument);
  const isLoading = signal(false);
  const applyPageSeo = vi.fn();
  const contentService = {
    config: computed(() => config()),
    isLoading: computed(() => isLoading()),
    visiblePages: computed(() => siteDocument.pages),
    visibleProjects: computed(() => siteDocument.projects),
    navigationItems: computed(() => siteDocument.navigationItems),
    portfolioCategories: computed(() => siteDocument.portfolioCategories),
    mediaPaths: computed(() =>
      Object.fromEntries(siteDocument.media.map((asset) => [asset.id, asset.path])),
    ),
    resolveMediaPath: (assetId: string) =>
      siteDocument.media.find((asset) => asset.id === assetId)?.path ?? '',
    applyPageSeo,
  };

  beforeEach(async () => {
    applyPageSeo.mockReset();

    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), PublicSiteModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ pageSlug: 'missing' })),
            snapshot: { paramMap: convertToParamMap({ pageSlug: 'missing' }) },
          },
        },
        { provide: PublicSiteContentService, useValue: contentService },
      ],
    }).compileComponents();
  });

  it('should render only the explicit V2 section registry with page SEO and accessible landmarks', async () => {
    const fixture = TestBed.createComponent(ConfigurablePageComponent);
    const page = siteDocument.pages[0]!;

    fixture.componentRef.setInput('page', page);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const portfolioGrid = fixture.debugElement.query(By.directive(PortfolioGridComponent))
      .componentInstance as PortfolioGridComponent;
    const whatsappLink = compiled.querySelector<HTMLAnchorElement>(
      'app-whatsapp-cta-section a[target="_blank"]',
    );

    expect(compiled.querySelector('main#conteudo')).not.toBeNull();
    expect(compiled.querySelector('app-hero-section')).not.toBeNull();
    expect(compiled.querySelector('.configurable-page-projects')).not.toBeNull();
    expect(compiled.querySelector('app-whatsapp-cta-section')).not.toBeNull();
    expect(compiled.querySelector('app-contact-form-section')).not.toBeNull();
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain(
      'temporariamente indisponível',
    );
    expect(portfolioGrid.maxColumns()).toBe(3);
    expect(whatsappLink?.href).toContain('wa.me/5511986681572');
    expect(whatsappLink?.rel).toBe('noopener noreferrer');
    expect(applyPageSeo).toHaveBeenCalledWith(
      page.seo,
      siteDocument.seo.openGraph.imageAlt,
      'website',
    );
  });

  it('should render the existing not-found state for an unknown dynamic slug', () => {
    const fixture = TestBed.createComponent(ConfigurablePageComponent);

    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-not-found')).not.toBeNull();
  });

  it('should keep portfolio routes ahead of configurable pages and preserve the wildcard 404', () => {
    const routePaths = PUBLIC_SITE_ROUTES.map((route) => route.path);

    expect(routePaths.indexOf('portfolio')).toBeLessThan(routePaths.indexOf(':pageSlug'));
    expect(routePaths.indexOf('portfolio/categoria/:categoryId')).toBeLessThan(
      routePaths.indexOf(':pageSlug'),
    );
    expect(routePaths.indexOf('portfolio/projeto/:slug')).toBeLessThan(
      routePaths.indexOf(':pageSlug'),
    );
    expect(routePaths.at(-1)).toBe('**');
    expect(PublicSiteRoutingModule).toBeDefined();
  });
});
