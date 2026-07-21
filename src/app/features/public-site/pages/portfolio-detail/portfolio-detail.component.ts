import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ContactSectionConfig } from '../../../../shared/models/contact-section-config.model';
import { PageSeo } from '../../../../shared/models/page-seo.model';
import { PublicSiteContentService } from '../../services/public-site-content.service';

@Component({
  selector: 'app-portfolio-detail',
  templateUrl: './portfolio-detail.component.html',
  standalone: false,
  styleUrls: ['./portfolio-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioDetailComponent {
  public readonly contentService = inject(PublicSiteContentService);

  private readonly route = inject(ActivatedRoute);

  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  public readonly slug = computed(() => this.routeParamMap().get('slug') ?? '');

  public readonly project = computed(() => {
    const section = this.contentService.portfolioSection();

    if (!section)
      return undefined;

    const publishedCategoryIds = new Set(section.categoryIds);

    return this.contentService
      .visibleProjects()
      .find(
        (project) =>
          project.slug === this.slug() &&
          project.categoryIds.some((categoryId) => publishedCategoryIds.has(categoryId)),
      );
  });

  public readonly projectCategories = computed(() => {
    const project = this.project();

    if (!project)
      return [];

    const categoriesById = new Map(
      this.contentService.portfolioCategories().map((category) => [category.id, category]),
    );

    return project.categoryIds.flatMap((categoryId) => {
      const category = categoriesById.get(categoryId);

      return category ? [category] : [];
    });
  });

  public readonly coverAsset = computed(() => {
    const project = this.project();

    return project ? this.contentService.resolveMediaAsset(project.cover.assetId) : undefined;
  });

  public readonly contactSection = computed<ContactSectionConfig | undefined>(() =>
    this.contentService.visibleSections().find(
      (section): section is ContactSectionConfig => section.type === 'contact',
    ),
  );

  private readonly synchronizeSeo = effect(() => {
    this.contentService.isLoading();

    const config = this.contentService.config();
    const project = this.project();

    if (project) {
      this.contentService.applyPageSeo(
        project.seo,
        project.cover.alt || project.title,
        'article',
      );
      return;
    }

    const unavailableSeo: PageSeo = {
      title: config.seo.title,
      description: config.seo.description,
      canonicalPath: `/portfolio/projeto/${encodeURIComponent(this.slug())}`,
      imageMediaId: config.seo.openGraph.imageMediaId,
      noIndex: true,
    };

    this.contentService.applyPageSeo(
      unavailableSeo,
      config.seo.openGraph.imageAlt,
      'website',
    );
  });
}
