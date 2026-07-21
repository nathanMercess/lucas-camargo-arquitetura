import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { MediaAsset } from '../../../../shared/models/media-asset.model';
import { PortfolioCategory } from '../../../../shared/models/portfolio-category.model';
import { PortfolioProject } from '../../../../shared/models/portfolio-project.model';
import { PortfolioProjectCard } from '../../models/portfolio-project-card.model';

@Component({
  selector: 'app-portfolio-grid',
  templateUrl: './portfolio-grid.component.html',
  standalone: false,
  styleUrls: ['./portfolio-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioGridComponent {
  public readonly projects = input.required<readonly PortfolioProject[]>();

  public readonly categories = input.required<readonly PortfolioCategory[]>();

  public readonly mediaAssets = input.required<readonly MediaAsset[]>();

  public readonly mediaPaths = input.required<Readonly<Record<string, string>>>();

  public readonly cards = computed<PortfolioProjectCard[]>(() => {
    const assetsById = new Map(this.mediaAssets().map((asset) => [asset.id, asset]));
    const categoriesById = new Map(this.categories().map((category) => [category.id, category]));

    return this.projects().flatMap((project) => {
      const asset = assetsById.get(project.cover.assetId);
      const coverSrc = this.mediaPaths()[project.cover.assetId];

      if (!asset || !coverSrc)
        return [];

      return [
        {
          project,
          coverSrc,
          coverAlt: project.cover.decorative ? '' : project.cover.alt,
          coverWidth: asset.width,
          coverHeight: asset.height,
          coverObjectPosition: `${project.cover.focalPointX}% ${project.cover.focalPointY}%`,
          categories: project.categoryIds.flatMap((categoryId) => {
            const category = categoriesById.get(categoryId);

            return category ? [category] : [];
          }),
        },
      ];
    });
  });
}
