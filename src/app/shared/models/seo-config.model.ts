import { OpenGraphConfig } from './open-graph-config.model';
import { OrganizationSchema } from './organization-schema.model';
import { TwitterCardConfig } from './twitter-card-config.model';

export interface SeoConfig {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly robots: string;
  readonly themeColor: string;
  readonly openGraph: OpenGraphConfig;
  readonly twitter: TwitterCardConfig;
  readonly organization: OrganizationSchema;
}
