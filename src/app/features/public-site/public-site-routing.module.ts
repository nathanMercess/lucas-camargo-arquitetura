import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortfolioDetailComponent } from './pages/portfolio-detail/portfolio-detail.component';
import { PortfolioListingComponent } from './pages/portfolio-listing/portfolio-listing.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PublicSiteComponent } from './public-site.component';

const routes: Routes = [
  {
    path: '',
    component: PublicSiteComponent,
  },
  {
    path: 'portfolio',
    component: PortfolioListingComponent,
  },
  {
    path: 'portfolio/categoria/:categoryId',
    component: PortfolioListingComponent,
  },
  {
    path: 'portfolio/projeto/:slug',
    component: PortfolioDetailComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicSiteRoutingModule {}
