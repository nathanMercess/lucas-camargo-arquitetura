import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { SiteFooterComponent } from './site-footer.component';

describe('SiteFooterComponent', () => {
  let fixture: ComponentFixture<SiteFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SiteFooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.componentRef.setInput('config', DEFAULT_SITE_CONFIG.footer);
    fixture.componentRef.setInput('uiLabels', DEFAULT_SITE_CONFIG.uiLabels);
    fixture.componentRef.setInput('logoPath', '/assets/brand/logo-light.png');
    fixture.detectChanges();
  });

  it('should render configured links and statement', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Projetos');
    expect(compiled.textContent).toContain(DEFAULT_SITE_CONFIG.footer.statement);
  });
});
