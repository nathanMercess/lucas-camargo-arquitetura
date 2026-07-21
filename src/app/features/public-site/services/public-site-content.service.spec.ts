import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { DEFAULT_SITE_CONFIG } from '../../../shared/config/default-site-config';
import { PortfolioProject } from '../../../shared/models/portfolio-project.model';
import { SiteConfigV1 } from '../../../shared/models/site-config-v1.model';
import { SiteSection } from '../../../shared/models/site-section.model';
import { PublicSiteRuntimeWindow } from '../models/public-site-runtime-window.model';
import { PublicSiteContentService } from './public-site-content.service';

const manifest = {
  schemaVersion: 1,
  releaseId: 'remote-v1',
  siteConfigKey: 'versions/remote-v1/site.json',
  sha256: 'a'.repeat(64),
  publishedAt: '2026-07-20T21:00:00.000Z',
} as const;

describe('PublicSiteContentService', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    window.localStorage.clear();
    Reflect.deleteProperty(window, '__LUCAS_CAMARGO_RUNTIME__');

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    window.localStorage.clear();
    Reflect.deleteProperty(window, '__LUCAS_CAMARGO_RUNTIME__');
  });

  it('should load, validate and order a remote release while updating theme and SEO', async () => {
    const service = TestBed.inject(PublicSiteContentService);
    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);
    const remoteConfig = createRemoteConfig();

    expect(service.isLoading()).toBe(true);

    await flushValidRelease(remoteConfig);
    await waitForContentLoad(service);

    expect(service.isLoading()).toBe(false);
    expect(service.config().releaseId).toBe('remote-v1');
    expect(service.visibleSections()[0].type).toBe('contact');
    expect(title.getTitle()).toBe('Lucas Camargo | Conteúdo remoto');
    expect(meta.getTag('name="description"')?.content).toBe('Descrição remota validada.');
    expect(document.documentElement.style.getPropertyValue('--brand-accent')).toBe('#e36570');
    expect(document.documentElement.style.getPropertyValue('--reveal-duration')).toBe('750ms');
    expect(service.resolveMediaPath('architecture-reference')).toBe(
      '/content/media/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp',
    );
  });

  it('should keep the bundled default when a remote config is invalid', () => {
    const service = TestBed.inject(PublicSiteContentService);

    httpTestingController.expectOne('/content/manifest.json').flush(manifest);
    httpTestingController.expectOne('/content/versions/remote-v1/site.json').flush({
      schemaVersion: 1,
    });

    expect(service.isLoading()).toBe(false);
    expect(service.config().releaseId).toBe(DEFAULT_SITE_CONFIG.releaseId);
    expect(service.visibleSections().map((section) => section.order)).toEqual([
      10, 20, 30, 40, 50, 60, 70, 80,
    ]);
  });

  it('should restore the last valid cached release when the manifest fails', () => {
    const cachedConfig = createRemoteConfig();

    window.localStorage.setItem('lucas-camargo-site-config-v1', JSON.stringify(cachedConfig));

    const service = TestBed.inject(PublicSiteContentService);

    httpTestingController.expectOne('/content/manifest.json').flush('Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(service.isLoading()).toBe(false);
    expect(service.config().releaseId).toBe('remote-v1');
    expect(service.visibleSections()[0].type).toBe('contact');
  });

  it('should load the manifest from the safe runtime content origin', async () => {
    Object.defineProperty(window as PublicSiteRuntimeWindow, '__LUCAS_CAMARGO_RUNTIME__', {
      configurable: true,
      value: {
        contentBaseUrl: 'https://lucas-camargo-content.example.workers.dev/content',
      },
    });

    const service = TestBed.inject(PublicSiteContentService);

    const remoteConfig = createRemoteConfig();

    await flushValidRelease(
      remoteConfig,
      'https://lucas-camargo-content.example.workers.dev/content',
    );
    await waitForContentLoad(service);

    expect(service.isLoading()).toBe(false);
    expect(service.config().releaseId).toBe('remote-v1');
    expect(service.resolveMediaPath('architecture-reference')).toBe(
      'https://lucas-camargo-content.example.workers.dev/content/media/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp',
    );
  });

  it('should disable reveal transitions when the published theme requests it', async () => {
    const service = TestBed.inject(PublicSiteContentService);
    const remoteConfig = createRemoteConfig();
    const motionDisabledConfig: SiteConfigV1 = {
      ...remoteConfig,
      theme: {
        ...remoteConfig.theme,
        motion: {
          ...remoteConfig.theme.motion,
          revealEnabled: false,
        },
      },
    };

    await flushValidRelease(motionDisabledConfig);
    await waitForContentLoad(service);

    expect(service.config().theme.motion.revealEnabled).toBe(false);
    expect(document.documentElement.classList.contains('site-reveal-disabled')).toBe(true);
  });

  it('should apply an approved template identifier to the public renderer', async () => {
    const service = TestBed.inject(PublicSiteContentService);
    const remoteConfig: SiteConfigV1 = {
      ...createRemoteConfig(),
      theme: {
        ...createRemoteConfig().theme,
        presetId: 'gallery-v1',
      },
    };

    await flushValidRelease(remoteConfig);
    await waitForContentLoad(service);

    expect(service.config().theme.presetId).toBe('gallery-v1');
    expect(document.documentElement.getAttribute('data-site-template')).toBe('gallery-v1');
  });

  it('should reject an unknown public template identifier', () => {
    const service = TestBed.inject(PublicSiteContentService);
    const remoteConfig = {
      ...createRemoteConfig(),
      theme: {
        ...createRemoteConfig().theme,
        presetId: 'unsafe-template',
      },
    };

    httpTestingController.expectOne('/content/manifest.json').flush(manifest);
    httpTestingController.expectOne('/content/versions/remote-v1/site.json').flush(remoteConfig);

    expect(service.config().releaseId).toBe(DEFAULT_SITE_CONFIG.releaseId);
    expect(document.documentElement.getAttribute('data-site-template')).toBe('lucas-camargo-v1');
  });

  it('should expose only visible projects in deterministic order and apply their page SEO', async () => {
    const service = TestBed.inject(PublicSiteContentService);
    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);
    const firstProject = createProject('primeiro-projeto', 10, true);
    const secondProject = createProject('segundo-projeto', 20, true);
    const hiddenProject = createProject('projeto-oculto', 5, false);
    const remoteConfig: SiteConfigV1 = {
      ...createRemoteConfig(),
      projects: [secondProject, hiddenProject, firstProject],
    };

    await flushValidRelease(remoteConfig);
    await waitForContentLoad(service);

    expect(service.visibleProjects().map((project) => project.id)).toEqual([
      'primeiro-projeto',
      'segundo-projeto',
    ]);

    service.applyPageSeo(firstProject.seo, firstProject.cover.alt, 'article');

    expect(title.getTitle()).toBe(firstProject.seo.title);
    expect(meta.getTag('name="description"')?.content).toBe(firstProject.seo.description);
    expect(meta.getTag('property="og:type"')?.content).toBe('article');
    expect(meta.getTag('property="og:image:alt"')?.content).toBe(firstProject.cover.alt);
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      `https://lucascamargo.com${firstProject.seo.canonicalPath}`,
    );
  });

  it('should reject duplicate project slugs that would make a public route ambiguous', () => {
    const service = TestBed.inject(PublicSiteContentService);
    const firstProject = createProject('primeiro-projeto', 10, true);
    const duplicateSlugProject: PortfolioProject = {
      ...createProject('segundo-projeto', 20, true),
      slug: firstProject.slug,
    };
    const remoteConfig: SiteConfigV1 = {
      ...createRemoteConfig(),
      projects: [firstProject, duplicateSlugProject],
    };

    httpTestingController.expectOne('/content/manifest.json').flush(manifest);
    httpTestingController.expectOne('/content/versions/remote-v1/site.json').flush(remoteConfig);

    expect(service.config().releaseId).toBe(DEFAULT_SITE_CONFIG.releaseId);
    expect(service.visibleProjects()).toEqual([]);
  });

  it('should reject a project canonical path that does not match its public slug route', () => {
    const service = TestBed.inject(PublicSiteContentService);
    const project = createProject('primeiro-projeto', 10, true);
    const remoteConfig: SiteConfigV1 = {
      ...createRemoteConfig(),
      projects: [
        {
          ...project,
          seo: {
            ...project.seo,
            canonicalPath: `/projetos/${project.slug}`,
          },
        },
      ],
    };

    httpTestingController.expectOne('/content/manifest.json').flush(manifest);
    httpTestingController.expectOne('/content/versions/remote-v1/site.json').flush(remoteConfig);

    expect(service.config().releaseId).toBe(DEFAULT_SITE_CONFIG.releaseId);
    expect(service.visibleProjects()).toEqual([]);
  });

  it('should reject valid content when its SHA-256 does not match the manifest', async () => {
    const service = TestBed.inject(PublicSiteContentService);

    httpTestingController.expectOne('/content/manifest.json').flush({
      ...manifest,
      sha256: '0'.repeat(64),
    });
    httpTestingController
      .expectOne('/content/versions/remote-v1/site.json')
      .flush(createRemoteConfig());
    await waitForContentLoad(service);

    expect(service.config().releaseId).toBe(DEFAULT_SITE_CONFIG.releaseId);
  });
});

async function flushValidRelease(
  config: SiteConfigV1,
  contentBaseUrl = '/content',
): Promise<void> {
  const sha256 = await calculateConfigSha256(config);
  const controller = TestBed.inject(HttpTestingController);

  controller.expectOne(`${contentBaseUrl}/manifest.json`).flush({
    ...manifest,
    sha256,
  });
  controller
    .expectOne(`${contentBaseUrl}/versions/remote-v1/site.json`)
    .flush(config);
}

async function calculateConfigSha256(config: SiteConfigV1): Promise<string> {
  const subtleCrypto = globalThis.crypto?.subtle;

  if (!subtleCrypto)
    throw new Error('Web Crypto is required by this test.');

  const serializedConfig = new TextEncoder().encode(JSON.stringify(config));
  const digest = await subtleCrypto.digest('SHA-256', serializedConfig);

  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
}

async function waitForContentLoad(service: PublicSiteContentService): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!service.isLoading())
      return;

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error('The public content load did not settle.');
}

function createRemoteConfig(): SiteConfigV1 {
  const defaultConfig = JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG)) as SiteConfigV1;
  const sections: readonly SiteSection[] = defaultConfig.sections.map((section) => ({
    ...section,
    order: section.type === 'contact' ? 5 : section.order + 10,
  }));

  return {
    ...defaultConfig,
    releaseId: 'remote-v1',
    publishedAt: manifest.publishedAt,
    seo: {
      ...defaultConfig.seo,
      title: 'Lucas Camargo | Conteúdo remoto',
      description: 'Descrição remota validada.',
    },
    theme: {
      ...defaultConfig.theme,
      colors: {
        ...defaultConfig.theme.colors,
        accent: '#e36570',
      },
    },
    media: defaultConfig.media.map((asset) =>
      asset.id === 'architecture-reference'
        ? {
            ...asset,
            path: '/content/media/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp',
          }
        : asset,
    ),
    sections,
  };
}

function createProject(id: string, order: number, visible: boolean): PortfolioProject {
  return {
    id,
    slug: id,
    title: `Projeto ${id}`,
    summary: 'Resumo editorial do projeto.',
    description: ['Descrição editorial do projeto.'],
    categoryIds: ['projects'],
    cover: {
      assetId: 'architecture-reference',
      alt: `Imagem do ${id}`,
      decorative: false,
      focalPointX: 50,
      focalPointY: 50,
    },
    gallery: [],
    location: 'São Paulo, SP',
    year: '2026',
    services: ['Arquitetura'],
    order,
    visible,
    seo: {
      title: `Projeto ${id} | Lucas Camargo`,
      description: 'Descrição do projeto para mecanismos de busca.',
      canonicalPath: `/portfolio/projeto/${id}`,
      imageMediaId: 'architecture-reference',
      noIndex: false,
    },
  };
}
