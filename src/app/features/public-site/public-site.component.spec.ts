import { TestBed } from '@angular/core/testing';
import { ButtonModule } from 'primeng/button';

import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { PortfolioAccordionComponent } from './components/portfolio-accordion/portfolio-accordion.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { SiteHeaderComponent } from './components/site-header/site-header.component';
import { PublicSiteComponent } from './public-site.component';

describe('PublicSiteComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule],
      declarations: [
        PublicSiteComponent,
        ContactSectionComponent,
        HeroSectionComponent,
        SiteHeaderComponent,
        SiteFooterComponent,
        PortfolioAccordionComponent,
      ],
    }).compileComponents();
  });

  it('should render the public site content', () => {
    const fixture = TestBed.createComponent(PublicSiteComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('excelência');
    expect(compiled.textContent).toContain('150+');
    expect(compiled.textContent).toContain('arquiteto@lucascamargo.com');
  });
});
