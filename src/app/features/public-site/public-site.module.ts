import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { PortfolioAccordionComponent } from './components/portfolio-accordion/portfolio-accordion.component';
import { SiteHeaderComponent } from './components/site-header/site-header.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { PublicSiteRoutingModule } from './public-site-routing.module';
import { PublicSiteComponent } from './public-site.component';

@NgModule({
  imports: [CommonModule, ButtonModule, PublicSiteRoutingModule],
  declarations: [
    PublicSiteComponent,
    ContactSectionComponent,
    HeroSectionComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    PortfolioAccordionComponent,
  ],
})
export class PublicSiteModule {}
