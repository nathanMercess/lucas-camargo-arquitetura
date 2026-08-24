import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigurablePageComponent } from './components/configurable-page/configurable-page.component';
import { PortfolioDetailComponent } from './pages/portfolio-detail/portfolio-detail.component';
import { PortfolioListingComponent } from './pages/portfolio-listing/portfolio-listing.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PublicSiteComponent } from './public-site.component';

export const PUBLIC_SITE_ROUTES: Routes = [
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
    path: ':pageSlug',
    component: ConfigurablePageComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(PUBLIC_SITE_ROUTES)],
  exports: [RouterModule],
})
export class PublicSiteRoutingModule {}
