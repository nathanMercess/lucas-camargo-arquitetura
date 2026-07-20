import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterLink } from '../../../../shared/models/footer-link.model';
import { SiteFooterComponent } from './site-footer.component';

describe('SiteFooterComponent', () => {
  let fixture: ComponentFixture<SiteFooterComponent>;

  const links: readonly FooterLink[] = [{ id: 'projects', label: 'Projetos', href: '#portfolio' }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SiteFooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.componentRef.setInput('footerLinks', links);
    fixture.detectChanges();
  });

  it('should render the configured links', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('a')?.textContent).toContain('Projetos');
  });
});
