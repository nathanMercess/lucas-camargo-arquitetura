import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonModule } from 'primeng/button';

import { NavigationItem } from '../../../../shared/models/navigation-item.model';
import { SiteHeaderComponent } from '../site-header/site-header.component';
import { HeroSectionComponent } from './hero-section.component';

describe('HeroSectionComponent', () => {
  let fixture: ComponentFixture<HeroSectionComponent>;

  const navigationItems: readonly NavigationItem[] = [
    { id: 'portfolio', label: 'Portfólio', href: '#portfolio' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule],
      declarations: [HeroSectionComponent, SiteHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSectionComponent);
    fixture.componentRef.setInput('navigationItems', navigationItems);
    fixture.detectChanges();
  });

  it('should render the brand mission in the hero', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('excelência');
    expect(compiled.textContent).toContain('valorizar seus sonhos');
  });
});
