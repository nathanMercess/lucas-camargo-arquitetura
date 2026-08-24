import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { GalleriaModule } from 'primeng/galleria';

import { ConfigurablePageComponent } from './components/configurable-page/configurable-page.component';
import { ContactFormSectionComponent } from './components/contact-form-section/contact-form-section.component';
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
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { SiteHeaderComponent } from './components/site-header/site-header.component';
import { WhatsappCtaSectionComponent } from './components/whatsapp-cta-section/whatsapp-cta-section.component';
import { RevealOnScrollDirective } from './directives/reveal-on-scroll.directive';
import { PortfolioDetailComponent } from './pages/portfolio-detail/portfolio-detail.component';
import { PortfolioListingComponent } from './pages/portfolio-listing/portfolio-listing.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PublicSiteRoutingModule } from './public-site-routing.module';
import { PublicSiteComponent } from './public-site.component';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, GalleriaModule, PublicSiteRoutingModule],
  declarations: [
    ConfigurablePageComponent,
    ContactFormSectionComponent,
    ContactSectionComponent,
    CustomPageRendererComponent,
    HeroSectionComponent,
    ManifestoSectionComponent,
    MetricsSectionComponent,
    PortfolioAccordionComponent,
    PortfolioGalleryComponent,
    PortfolioGridComponent,
    PortfolioDetailComponent,
    PortfolioListingComponent,
    NotFoundComponent,
    ProcessSectionComponent,
    PublicSiteComponent,
    PublicPageShellComponent,
    RichTextComponent,
    RevealOnScrollDirective,
    SiteFooterComponent,
    SiteHeaderComponent,
    WhatsappCtaSectionComponent,
  ],
})
export class PublicSiteModule {}
