import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { ManifestoSectionComponent } from './components/manifesto-section/manifesto-section.component';
import { MetricsSectionComponent } from './components/metrics-section/metrics-section.component';
import { PortfolioAccordionComponent } from './components/portfolio-accordion/portfolio-accordion.component';
import { ProcessSectionComponent } from './components/process-section/process-section.component';
import { SiteHeaderComponent } from './components/site-header/site-header.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { RevealOnScrollDirective } from './directives/reveal-on-scroll.directive';
import { PublicSiteRoutingModule } from './public-site-routing.module';
import { PublicSiteComponent } from './public-site.component';

@NgModule({
  imports: [CommonModule, ButtonModule, PublicSiteRoutingModule],
  declarations: [
    PublicSiteComponent,
    ContactSectionComponent,
    HeroSectionComponent,
    ManifestoSectionComponent,
    MetricsSectionComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    PortfolioAccordionComponent,
    ProcessSectionComponent,
    RevealOnScrollDirective,
  ],
})
export class PublicSiteModule {}
