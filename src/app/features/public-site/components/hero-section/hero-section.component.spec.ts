import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonModule } from 'primeng/button';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { RichTextComponent } from '../rich-text/rich-text.component';
import { SiteHeaderComponent } from '../site-header/site-header.component';
import { HeroSectionComponent } from './hero-section.component';

const heroConfig = DEFAULT_SITE_CONFIG.sections.find((section) => section.type === 'hero');

if (!heroConfig)
  throw new Error('A configuração padrão do hero é obrigatória.');

describe('HeroSectionComponent', () => {
  let fixture: ComponentFixture<HeroSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule],
      declarations: [HeroSectionComponent, RichTextComponent, SiteHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSectionComponent);
    fixture.componentRef.setInput('config', heroConfig);
    fixture.componentRef.setInput('headerConfig', DEFAULT_SITE_CONFIG.header);
    fixture.componentRef.setInput('navigationItems', DEFAULT_SITE_CONFIG.navigationItems);
    fixture.componentRef.setInput('uiLabels', DEFAULT_SITE_CONFIG.uiLabels);
    fixture.componentRef.setInput('backgroundPath', '/assets/editorial/architecture-reference.jpg');
    fixture.componentRef.setInput('logoPath', '/assets/brand/logo-light.png');
    fixture.componentRef.setInput('skipTarget', 'essencia');
    fixture.detectChanges();
  });

  it('should render the configured brand mission in the hero', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('permanecem');
    expect(compiled.textContent).toContain('Do primeiro traço');
    expect(compiled.querySelector('.hero-section-skip-link')?.getAttribute('href')).toBe('#essencia');
  });

  it('should render a CSS arrow without an emoji glyph', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const portfolioLink = compiled.querySelector('.hero-section-portfolio-link');

    expect(portfolioLink?.querySelector('.public-site-arrow--south-east')).not.toBeNull();
    expect(portfolioLink?.textContent).not.toMatch(/[↗↘↑▶Ⅱ]/u);
  });
});
