import { NO_ERRORS_SCHEMA, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { PortfolioProject } from '../../../../shared/models/portfolio-project.model';
import { SiteConfigV1 } from '../../../../shared/models/site-config-v1.model';
import { PublicSiteContentService } from '../../services/public-site-content.service';
import { PortfolioDetailComponent } from './portfolio-detail.component';

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

describe('PortfolioDetailComponent', () => {
  let fixture: ComponentFixture<PortfolioDetailComponent>;
  let contentService: ReturnType<typeof createContentService>;

  async function configure(slug: string, projects: readonly PortfolioProject[]): Promise<void> {
    const routeParamMap = new BehaviorSubject(convertToParamMap({ slug }));

    contentService = createContentService({
      ...DEFAULT_SITE_CONFIG,
      projects,
    });

    await TestBed.configureTestingModule({
      declarations: [PortfolioDetailComponent],
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

    fixture = TestBed.createComponent(PortfolioDetailComponent);
    fixture.detectChanges();
  }

  it('should resolve a visible project by slug and apply its JSON SEO contract', async () => {
    await configure('residencia-teste', [project]);

    expect(fixture.componentInstance.project()).toBe(project);
    expect(fixture.componentInstance.projectCategories().map((category) => category.id)).toEqual([
      'projects',
    ]);
    expect(contentService.applyPageSeo).toHaveBeenCalledWith(
      project.seo,
      project.cover.alt,
      'article',
    );
  });

  it('should not expose a project marked as hidden', async () => {
    await configure('residencia-teste', [{ ...project, visible: false }]);

    expect(fixture.componentInstance.project()).toBeUndefined();
    expect(contentService.applyPageSeo).toHaveBeenCalledWith(
      expect.objectContaining({ noIndex: true }),
      DEFAULT_SITE_CONFIG.seo.openGraph.imageAlt,
      'website',
    );
  });

  it('should render a safe unavailable state for an unknown slug', async () => {
    await configure('nao-existe', [project]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Projeto indisponível.');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(project.summary);
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
    resolveMediaAsset: (assetId: string) =>
      config().media.find((asset) => asset.id === assetId),
    resolveMediaPath: (assetId: string) =>
      config().media.find((asset) => asset.id === assetId)?.path ?? '',
    applyPageSeo: vi.fn(),
  };
}
