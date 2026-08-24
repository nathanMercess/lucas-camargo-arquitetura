import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { PageSeo } from '../../../../shared/models/page-seo.model';
import { PortfolioProject } from '../../../../shared/models/portfolio-project.model';
import { SitePageV2 } from '../../../../shared/models/site-page-v2.model';
import { SiteSectionV2 } from '../../../../shared/models/site-section-v2.model';
import { PublicSiteContentService } from '../../services/public-site-content.service';

const SUPPORTED_SECTION_TYPES = new Set<SiteSectionV2['type']>([
  'hero',
  'project-grid',
  'whatsapp-cta',
  'contact-form',
]);

@Component({
  selector: 'app-configurable-page',
  templateUrl: './configurable-page.component.html',
  standalone: false,
  styleUrls: ['./configurable-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurablePageComponent {
  public readonly contentService = inject(PublicSiteContentService);

  private readonly route = inject(ActivatedRoute);

  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  public readonly page = input<SitePageV2 | null>(null);

  public readonly resolvedPage = computed(() => {
    const inputPage = this.page();

    if (inputPage)
      return inputPage;

    const pageSlug = this.routeParamMap().get('pageSlug');

    return this.contentService.visiblePages().find((page) => page.slug === pageSlug);
  });

  public readonly sections = computed<readonly SiteSectionV2[]>(() => {
    const page = this.resolvedPage();

    if (!page)
      return [];

    return [...page.sections]
      .filter(
        (section) => section.visible && SUPPORTED_SECTION_TYPES.has(section.type),
      )
      .sort((first, second) => first.order - second.order || first.id.localeCompare(second.id));
  });

  public readonly firstSectionIsHero = computed(() => this.sections()[0]?.type === 'hero');

  public readonly siteContact = computed(() => {
    const config = this.contentService.config();

    return config.schemaVersion === 2 ? config.contact : null;
  });

  public readonly firstContentAnchor = computed(
    () => this.sections().find((section) => section.type !== 'hero')?.anchor ?? 'conteudo',
  );

  private readonly synchronizeSeo = effect(() => {
    this.contentService.isLoading();

    const page = this.resolvedPage();

    if (page) {
      this.contentService.applyPageSeo(
        page.seo,
        this.contentService.config().seo.openGraph.imageAlt,
        'website',
      );
      return;
    }

    if (this.contentService.isLoading())
      return;

    const config = this.contentService.config();
    const pageSlug = this.routeParamMap().get('pageSlug') ?? '';
    const unavailableSeo: PageSeo = {
      title: config.seo.title,
      description: config.seo.description,
      canonicalPath: pageSlug ? `/${pageSlug}` : '/',
      imageMediaId: config.seo.openGraph.imageMediaId,
      noIndex: true,
    };

    this.contentService.applyPageSeo(
      unavailableSeo,
      config.seo.openGraph.imageAlt,
      'website',
    );
  });

  public projectsFor(projectIds: readonly string[]): readonly PortfolioProject[] {
    const projectsById = new Map(
      this.contentService.visibleProjects().map((project) => [project.id, project]),
    );

    return projectIds.flatMap((projectId) => {
      const project = projectsById.get(projectId);

      return project ? [project] : [];
    });
  }
}
