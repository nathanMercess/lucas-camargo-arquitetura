import { DEFAULT_SITE_CONFIG } from './default-site-config';
import { SiteConfigV1 } from '../models/site-config-v1.model';

const siteConfig: SiteConfigV1 = DEFAULT_SITE_CONFIG;

describe('DEFAULT_SITE_CONFIG', () => {
  it('should expose the complete version-one fallback', () => {
    expect(siteConfig.schemaVersion).toBe(1);
    expect(siteConfig.locale).toBe('pt-BR');
    expect(siteConfig.sections).toHaveLength(8);
    expect(siteConfig.portfolioCategories).toHaveLength(2);
    expect(siteConfig.projects).toHaveLength(0);
  });

  it('should keep identifiers and section ordering unique', () => {
    expectUnique(siteConfig.media.map((asset) => asset.id));
    expectUnique(siteConfig.navigationItems.map((item) => item.id));
    expectUnique(siteConfig.sections.map((section) => section.id));
    expectUnique(siteConfig.sections.map((section) => section.anchor));
    expectUnique(siteConfig.sections.map((section) => section.order));
    expectUnique(siteConfig.portfolioCategories.map((category) => category.id));
  });

  it('should resolve every configured media reference', () => {
    const mediaIds = new Set(siteConfig.media.map((asset) => asset.id));
    const referencedMediaIds = [
      siteConfig.identity.logoLightMediaId,
      siteConfig.identity.logoDarkMediaId,
      siteConfig.identity.faviconMediaId,
      siteConfig.seo.openGraph.imageMediaId,
      siteConfig.seo.twitter.imageMediaId,
      siteConfig.header.logo.assetId,
      siteConfig.footer.logo.assetId,
      ...siteConfig.portfolioCategories.flatMap((category) =>
        category.coverMediaId ? [category.coverMediaId] : [],
      ),
      ...siteConfig.sections.flatMap((section) => {
        switch (section.type) {
          case 'hero':
            return [section.background.assetId];
          case 'about':
            return [section.portrait.assetId];
          default:
            return [];
        }
      }),
      ...siteConfig.projects.flatMap((project) => [
        project.cover.assetId,
        project.seo.imageMediaId,
        ...project.gallery.map((item) => item.assetId),
      ]),
    ];

    for (const mediaId of referencedMediaIds)
      expect(mediaIds.has(mediaId), `Referência de mídia ausente: ${mediaId}`).toBe(true);
  });

  it('should resolve navigation and portfolio relationships', () => {
    const visibleAnchors = new Set(
      siteConfig.sections
        .filter((section) => section.visible)
        .map((section) => section.anchor),
    );
    const categoryIds = new Set(
      siteConfig.portfolioCategories.map((category) => category.id),
    );
    const portfolioSection = siteConfig.sections.find(
      (section) => section.type === 'portfolio',
    );

    if (!portfolioSection)
      throw new Error('A seção de portfólio padrão é obrigatória.');

    for (const item of siteConfig.navigationItems)
      expect(visibleAnchors.has(item.href.replace(/^#/, ''))).toBe(true);

    for (const categoryId of portfolioSection.categoryIds)
      expect(categoryIds.has(categoryId)).toBe(true);

    for (const project of siteConfig.projects)
      for (const categoryId of project.categoryIds)
        expect(categoryIds.has(categoryId)).toBe(true);
  });

  it('should identify every temporary editorial image as a reference', () => {
    const editorialAssets = siteConfig.media.filter((asset) =>
      asset.path.startsWith('/assets/editorial/'),
    );

    expect(editorialAssets.length).toBeGreaterThan(0);

    for (const asset of editorialAssets)
      expect(asset.provenance).toBe('reference');
  });
});

function expectUnique(values: readonly (number | string)[]): void {
  expect(new Set(values).size).toBe(values.length);
}
