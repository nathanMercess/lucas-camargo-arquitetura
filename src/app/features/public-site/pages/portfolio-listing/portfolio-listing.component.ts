import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ContactSectionConfig } from '../../../../shared/models/contact-section-config.model';
import { PageSeo } from '../../../../shared/models/page-seo.model';
import { PortfolioCategory } from '../../../../shared/models/portfolio-category.model';
import { RichTextBlock } from '../../../../shared/models/rich-text-block.model';
import { PublicSiteContentService } from '../../services/public-site-content.service';

@Component({
  selector: 'app-portfolio-listing',
  templateUrl: './portfolio-listing.component.html',
  standalone: false,
  styleUrls: ['./portfolio-listing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioListingComponent {
  public readonly contentService = inject(PublicSiteContentService);

  private readonly route = inject(ActivatedRoute);

  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  public readonly categoryId = computed(() => this.routeParamMap().get('categoryId'));

  public readonly section = this.contentService.portfolioSection;

  public readonly categories = computed<readonly PortfolioCategory[]>(() => {
    const section = this.section();

    if (!section)
      return [];

    const categoriesById = new Map(
      this.contentService.portfolioCategories().map((category) => [category.id, category]),
    );

    return section.categoryIds.flatMap((categoryId) => {
      const category = categoriesById.get(categoryId);

      return category ? [category] : [];
    });
  });

  public readonly selectedCategory = computed(() => {
    const categoryId = this.categoryId();

    if (!categoryId)
      return undefined;

    return this.categories().find((category) => category.id === categoryId);
  });

  public readonly hasInvalidCategory = computed(
    () => this.categoryId() !== null && !this.selectedCategory(),
  );

  public readonly projects = computed(() => {
    const categoryId = this.categoryId();
    const allowedCategoryIds = new Set(this.categories().map((category) => category.id));

    return this.contentService.visibleProjects().filter((project) => {
      if (categoryId)
        return project.categoryIds.includes(categoryId);

      return project.categoryIds.some((projectCategoryId) =>
        allowedCategoryIds.has(projectCategoryId),
      );
    });
  });

  public readonly contactSection = computed<ContactSectionConfig | undefined>(() =>
    this.contentService.visibleSections().find(
      (section): section is ContactSectionConfig => section.type === 'contact',
    ),
  );

  private readonly synchronizeSeo = effect(() => {
    this.contentService.isLoading();

    const config = this.contentService.config();
    const section = this.section();
    const category = this.selectedCategory();
    const categoryId = this.categoryId();
    const defaultImageMediaId = config.seo.openGraph.imageMediaId;
    const canonicalPath = categoryId ? `/portfolio/categoria/${categoryId}` : '/portfolio';

    if (!section || (categoryId && !category)) {
      const unavailableSeo: PageSeo = {
        title: config.seo.title,
        description: config.seo.description,
        canonicalPath,
        imageMediaId: defaultImageMediaId,
        noIndex: true,
      };

      this.contentService.applyPageSeo(
        unavailableSeo,
        config.seo.openGraph.imageAlt,
        'website',
      );
      return;
    }

    const pageTitle = category?.title ?? this.toPlainText(section.title);
    const pageDescription = category?.description ?? section.description.join(' ');
    const imageMediaId =
      category?.coverMediaId ??
      this.categories().find((item) => item.coverMediaId)?.coverMediaId ??
      defaultImageMediaId;
    const pageSeo: PageSeo = {
      title: `${pageTitle} | ${config.identity.brandName}`,
      description: pageDescription,
      canonicalPath,
      imageMediaId,
      noIndex: false,
    };

    this.contentService.applyPageSeo(
      pageSeo,
      category?.title ?? config.seo.openGraph.imageAlt,
      'website',
    );
  });

  private toPlainText(content: RichTextBlock): string {
    return content.lines
      .map((line) => line.segments.map((segment) => segment.text).join(''))
      .join(' ')
      .trim();
  }
}
