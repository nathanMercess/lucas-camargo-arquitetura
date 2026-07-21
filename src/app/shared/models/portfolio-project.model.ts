import { MediaReference } from './media-reference.model';
import { PageSeo } from './page-seo.model';

export interface PortfolioProject {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: readonly string[];
  readonly categoryIds: readonly string[];
  readonly cover: MediaReference;
  readonly gallery: readonly MediaReference[];
  readonly location: string;
  readonly year: string;
  readonly services: readonly string[];
  readonly order: number;
  readonly visible: boolean;
  readonly seo: PageSeo;
}
