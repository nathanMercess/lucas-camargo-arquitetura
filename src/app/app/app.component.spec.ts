import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { MaintenancePageComponent } from '../features/maintenance/maintenance-page.component';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
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

  it('should show the maintenance page', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-maintenance-page')).toBeTruthy();
    expect(compiled.querySelector('h1')?.getAttribute('aria-label')).toBe('Site em manutenção');
  });
});
