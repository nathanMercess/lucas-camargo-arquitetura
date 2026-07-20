import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonModule } from 'primeng/button';

import { NavigationItem } from '../../../../shared/models/navigation-item.model';
import { SiteHeaderComponent } from './site-header.component';

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;
  let component: SiteHeaderComponent;

  const navigationItems: readonly NavigationItem[] = [
    { id: 'portfolio', label: 'Portfólio', href: '#portfolio' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule],
      declarations: [SiteHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('navigationItems', navigationItems);
    fixture.detectChanges();
  });

  it('should toggle the navigation menu', () => {
    component.toggleMenu();
    expect(component.isMenuOpen()).toBe(true);

    component.closeMenu();
    expect(component.isMenuOpen()).toBe(false);
  });
});
