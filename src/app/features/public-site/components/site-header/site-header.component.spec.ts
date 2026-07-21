import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonModule } from 'primeng/button';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { SiteHeaderComponent } from './site-header.component';

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;
  let component: SiteHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule],
      declarations: [SiteHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', DEFAULT_SITE_CONFIG.header);
    fixture.componentRef.setInput('navigationItems', DEFAULT_SITE_CONFIG.navigationItems);
    fixture.componentRef.setInput('uiLabels', DEFAULT_SITE_CONFIG.uiLabels);
    fixture.componentRef.setInput('logoPath', '/assets/brand/logo-light.png');
    fixture.detectChanges();
  });

  afterEach(() => document.body.classList.remove('site-menu-open'));

  it('should toggle the navigation menu', () => {
    component.toggleMenu();
    expect(component.isMenuOpen()).toBe(true);

    component.closeMenu();
    expect(component.isMenuOpen()).toBe(false);
  });

  it('should render configured navigation and calls to action', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Portfólio');
    expect(compiled.textContent).toContain('Iniciar um projeto');
    expect(compiled.querySelector('.site-header-navigation-cta')).not.toBeNull();
  });

  it('should close the mobile menu with Escape and restore focus', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector<HTMLButtonElement>('.site-header-menu-button');

    component.toggleMenu();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.isMenuOpen()).toBe(false);
    expect(document.body.classList.contains('site-menu-open')).toBe(false);
    expect(document.activeElement).toBe(menuButton);
  });

  it('should always release page scrolling when destroyed', () => {
    component.toggleMenu();
    expect(document.body.classList.contains('site-menu-open')).toBe(true);

    fixture.destroy();

    expect(document.body.classList.contains('site-menu-open')).toBe(false);
  });

  it('should contain keyboard focus inside the open mobile navigation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector<HTMLButtonElement>('.site-header-menu-button');
    const navigationLinks = compiled.querySelectorAll<HTMLAnchorElement>('.site-header-navigation a');
    const lastLink = navigationLinks.item(navigationLinks.length - 1);

    component.toggleMenu();
    lastLink.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

    expect(document.activeElement).toBe(menuButton);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));

    expect(document.activeElement).toBe(lastLink);
  });
});
