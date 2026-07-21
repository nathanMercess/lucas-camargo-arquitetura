import { PortfolioCategory } from '../../../shared/models/portfolio-category.model';
import { PortfolioProject } from '../../../shared/models/portfolio-project.model';

export interface PortfolioProjectCard {
  readonly project: PortfolioProject;
  readonly coverSrc: string;
  readonly coverAlt: string;
  readonly coverWidth: number;
  readonly coverHeight: number;
  readonly coverObjectPosition: string;
  readonly categories: readonly PortfolioCategory[];
}
