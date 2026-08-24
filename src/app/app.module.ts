import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { providePrimeNG } from 'primeng/config';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app/app.component';
import { MaintenancePageComponent } from './features/maintenance/maintenance-page.component';

@NgModule({
  declarations: [AppComponent, MaintenancePageComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    providePrimeNG({ unstyled: true }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
