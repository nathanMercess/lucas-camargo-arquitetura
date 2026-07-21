import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { GalleriaModule } from 'primeng/galleria';

import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { CustomPageRendererComponent } from './components/custom-page-renderer/custom-page-renderer.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { ManifestoSectionComponent } from './components/manifesto-section/manifesto-section.component';
import { MetricsSectionComponent } from './components/metrics-section/metrics-section.component';
import { PortfolioAccordionComponent } from './components/portfolio-accordion/portfolio-accordion.component';
import { PortfolioGalleryComponent } from './components/portfolio-gallery/portfolio-gallery.component';
import { PortfolioGridComponent } from './components/portfolio-grid/portfolio-grid.component';
import { ProcessSectionComponent } from './components/process-section/process-section.component';
import { PublicPageShellComponent } from './components/public-page-shell/public-page-shell.component';
import { RichTextComponent } from './components/rich-text/rich-text.component';
import { SiteHeaderComponent } from './components/site-header/site-header.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { RevealOnScrollDirective } from './directives/reveal-on-scroll.directive';
import { PortfolioDetailComponent } from './pages/portfolio-detail/portfolio-detail.component';
import { PortfolioListingComponent } from './pages/portfolio-listing/portfolio-listing.component';
import { PublicSiteRoutingModule } from './public-site-routing.module';
import { PublicSiteComponent } from './public-site.component';

@NgModule({
  imports: [CommonModule, ButtonModule, GalleriaModule, PublicSiteRoutingModule],
  declarations: [
    PublicSiteComponent,
    ContactSectionComponent,
    CustomPageRendererComponent,
    HeroSectionComponent,
    ManifestoSectionComponent,
    MetricsSectionComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    PortfolioAccordionComponent,
    PortfolioGalleryComponent,
    PortfolioGridComponent,
    PortfolioDetailComponent,
    PortfolioListingComponent,
    ProcessSectionComponent,
    PublicPageShellComponent,
    RichTextComponent,
    RevealOnScrollDirective,
  ],
})
export class PublicSiteModule {}
