import { NgModule, inject } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PreviewAccessService } from './core/preview/services/preview-access.service';
import { MaintenancePageComponent } from './features/maintenance/maintenance-page.component';

const routes: Routes = [
  {
    path: '',
    canMatch: [() => inject(PreviewAccessService).isEnabled()],
    loadChildren: () =>
      import('./features/public-site/public-site.module').then((module) => module.PublicSiteModule),
  },
  {
    path: '**',
    component: MaintenancePageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
