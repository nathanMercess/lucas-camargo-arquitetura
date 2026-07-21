import { NO_ERRORS_SCHEMA, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { PortfolioProject } from '../../../../shared/models/portfolio-project.model';
import { SiteConfigV1 } from '../../../../shared/models/site-config-v1.model';
import { PublicSiteContentService } from '../../services/public-site-content.service';
import { PortfolioListingComponent } from './portfolio-listing.component';

const project: PortfolioProject = {
  id: 'residencia-teste',
  slug: 'residencia-teste',
  title: 'Residência Teste',
  summary: 'Resumo do projeto.',
  description: ['Descrição do projeto.'],
  categoryIds: ['projects'],
  cover: {
    assetId: 'architecture-reference',
    alt: 'Fachada da residência',
    decorative: false,
    focalPointX: 50,
    focalPointY: 50,
  },
  gallery: [],
  location: 'São Paulo, SP',
  year: '2026',
  services: ['Arquitetura'],
  order: 10,
  visible: true,
  seo: {
    title: 'Residência Teste | Lucas Camargo',
    description: 'Descrição para mecanismos de busca.',
    canonicalPath: '/portfolio/projeto/residencia-teste',
    imageMediaId: 'architecture-reference',
    noIndex: false,
  },
};

describe('PortfolioListingComponent', () => {
  let fixture: ComponentFixture<PortfolioListingComponent>;
  let routeParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let contentService: ReturnType<typeof createContentService>;

  async function configure(
    categoryId: string | null,
    projects: readonly PortfolioProject[],
    isLoading = false,
  ): Promise<void> {
    const params = categoryId ? { categoryId } : {};

    routeParamMap = new BehaviorSubject(convertToParamMap(params));
    contentService = createContentService({
      ...DEFAULT_SITE_CONFIG,
      projects,
    });
    contentService.isLoading.set(isLoading);

    await TestBed.configureTestingModule({
      declarations: [PortfolioListingComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParamMap.asObservable(),
            snapshot: { paramMap: routeParamMap.value },
          },
        },
        { provide: PublicSiteContentService, useValue: contentService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioListingComponent);
    fixture.detectChanges();
  }

  it('should derive and filter the public route from the configured category id', async () => {
    await configure('projects', [project]);

    expect(fixture.componentInstance.selectedCategory()?.title).toBe('Projetos');
    expect(fixture.componentInstance.projects()).toEqual([project]);
    expect(contentService.applyPageSeo).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalPath: '/portfolio/categoria/projects',
        noIndex: false,
      }),
      'Projetos',
      'website',
    );
  });

  it('should render a safe empty state without inventing projects', async () => {
    await configure(null, []);

    expect(fixture.componentInstance.projects()).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Nenhum projeto foi publicado nesta seleção ainda.',
    );
  });

  it('should keep an unknown category unavailable and noindex', async () => {
    await configure('categoria-inexistente', [project]);

    expect(fixture.componentInstance.hasInvalidCategory()).toBe(true);
    expect(contentService.applyPageSeo).toHaveBeenCalledWith(
      expect.objectContaining({ noIndex: true }),
      DEFAULT_SITE_CONFIG.seo.openGraph.imageAlt,
      'website',
    );
  });

  it('should show loading instead of an empty result while content is updating', async () => {
    await configure(null, [], true);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Carregando projetos publicados.',
    );
  });
});

function createContentService(configValue: SiteConfigV1) {
  const config = signal<SiteConfigV1>(configValue);
  const visibleSections = computed(() =>
    [...config().sections]
      .filter((section) => section.visible)
      .sort((first, second) => first.order - second.order),
  );

  return {
    config,
    visibleSections,
    portfolioSection: computed(() =>
      visibleSections().find((section) => section.type === 'portfolio'),
    ),
    portfolioCategories: computed(() => config().portfolioCategories),
    visibleProjects: computed(() =>
      [...config().projects]
        .filter((item) => item.visible)
        .sort((first, second) => first.order - second.order),
    ),
    mediaPaths: computed(() =>
      Object.fromEntries(config().media.map((asset) => [asset.id, asset.path])),
    ),
    isLoading: signal(false),
    applyPageSeo: vi.fn(),
  };
}
