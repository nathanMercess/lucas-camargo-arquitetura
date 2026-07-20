import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicSiteComponent } from './public-site.component';

const routes: Routes = [
  {
    path: '',
    component: PublicSiteComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicSiteRoutingModule {}
