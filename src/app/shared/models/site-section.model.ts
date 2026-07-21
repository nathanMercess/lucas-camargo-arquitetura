import { AboutSectionConfig } from './about-section-config.model';
import { ContactSectionConfig } from './contact-section-config.model';
import { HeroSectionConfig } from './hero-section-config.model';
import { ManifestoSectionConfig } from './manifesto-section-config.model';
import { MetricsSectionConfig } from './metrics-section-config.model';
import { PortfolioSectionConfig } from './portfolio-section-config.model';
import { PracticeSectionConfig } from './practice-section-config.model';
import { ProcessSectionConfig } from './process-section-config.model';

export type SiteSection =
  | HeroSectionConfig
  | ManifestoSectionConfig
  | PracticeSectionConfig
  | PortfolioSectionConfig
  | MetricsSectionConfig
  | AboutSectionConfig
  | ProcessSectionConfig
  | ContactSectionConfig;
