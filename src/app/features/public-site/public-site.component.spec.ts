import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { ManifestoSectionComponent } from './components/manifesto-section/manifesto-section.component';
import { MetricsSectionComponent } from './components/metrics-section/metrics-section.component';
import { PortfolioAccordionComponent } from './components/portfolio-accordion/portfolio-accordion.component';
import { ProcessSectionComponent } from './components/process-section/process-section.component';
import { RichTextComponent } from './components/rich-text/rich-text.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { SiteHeaderComponent } from './components/site-header/site-header.component';
import { RevealOnScrollDirective } from './directives/reveal-on-scroll.directive';
import { PublicSiteComponent } from './public-site.component';

describe('PublicSiteComponent', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ButtonModule, RouterModule.forRoot([])],
      declarations: [
        PublicSiteComponent,
        ContactSectionComponent,
        HeroSectionComponent,
        ManifestoSectionComponent,
        MetricsSectionComponent,
        SiteHeaderComponent,
        SiteFooterComponent,
        PortfolioAccordionComponent,
        ProcessSectionComponent,
        RichTextComponent,
        RevealOnScrollDirective,
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('should preserve the bundled site when the manifest is unavailable', () => {
    const fixture = TestBed.createComponent(PublicSiteComponent);

    fixture.detectChanges();
    httpTestingController.expectOne('/content/manifest.json').flush('Not found', {
      status: 404,
      statusText: 'Not Found',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('permanecem');
    expect(compiled.textContent).toContain('150+');
    expect(compiled.textContent).toContain('arquiteto@lucascamargo.com');
    expect(compiled.textContent).not.toMatch(/[↗↘↑▶Ⅱ]/u);
    expect(compiled.querySelectorAll('.public-site-arrow').length).toBeGreaterThan(0);
  });
});
