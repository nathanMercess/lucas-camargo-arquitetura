import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { MaintenancePageComponent } from '../features/maintenance/maintenance-page.component';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      declarations: [AppComponent, MaintenancePageComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show the site when the preview key is valid', () => {
    window.history.replaceState({}, '', '/?key=2026082414');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-maintenance-page')).toBeFalsy();
  });

  it('should show the maintenance page when the preview key is missing or invalid', () => {
    for (const url of ['/', '/?key=invalid']) {
      window.history.replaceState({}, '', url);

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('router-outlet')).toBeFalsy();
      expect(compiled.querySelector('app-maintenance-page')).toBeTruthy();
      fixture.destroy();
    }
  });

  it('should preserve preview access during the browser session', () => {
    window.history.replaceState({}, '', '/?key=2026082414');

    const authorizedFixture = TestBed.createComponent(AppComponent);
    authorizedFixture.detectChanges();
    authorizedFixture.destroy();

    window.history.replaceState({}, '', '/portfolio');

    const persistedFixture = TestBed.createComponent(AppComponent);
    persistedFixture.detectChanges();
    const compiled = persistedFixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-maintenance-page')).toBeFalsy();
  });
});
