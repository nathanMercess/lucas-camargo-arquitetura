import { DEFAULT_SITE_CONFIG } from '../../../shared/config/default-site-config';
import { createSiteConfigV2Fixture } from '../../../shared/testing/create-site-config-v2.fixture';
import { SiteConfigValidatorService } from './site-config-validator.service';

describe('SiteConfigValidatorService', () => {
  const service = new SiteConfigValidatorService();

  it('should preserve the complete V1 contract through the supported document union', () => {
    expect(service.isSiteConfigV1(DEFAULT_SITE_CONFIG)).toBe(true);
    expect(service.isSiteConfigV2(DEFAULT_SITE_CONFIG)).toBe(false);
    expect(service.isSiteDocument(DEFAULT_SITE_CONFIG)).toBe(true);
  });

  it('should accept a valid V2 document with typed pages and supported sections', () => {
    const config = createSiteConfigV2Fixture();

    expect(service.isSiteConfigV1(config)).toBe(false);
    expect(service.isSiteConfigV2(config)).toBe(true);
    expect(service.isSiteDocument(config)).toBe(true);
  });

  it('should reject V2 documents that retain removed V1 rendering fields', () => {
    const config = createSiteConfigV2Fixture();

    expect(service.isSiteConfigV2({ ...config, sections: [] })).toBe(false);
    expect(service.isSiteConfigV2({ ...config, visualBuilder: undefined })).toBe(false);
  });

  it('should validate V2 contact values and project-grid column limits', () => {
    const config = createSiteConfigV2Fixture();
    const homePage = config.pages[0]!;

    expect(
      service.isSiteConfigV2({
        ...config,
        contact: { ...config.contact, phoneE164: '5511986681572' },
      }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({
        ...config,
        contact: { ...config.contact, email: 'outro@lucascamargo.com' },
      }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({
        ...config,
        contact: { ...config.contact, instagramUrl: 'https://instagram.com.evil.example/perfil' },
      }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({
        ...config,
        contact: { ...config.contact, instagramUrl: 'https://user@instagram.com/perfil' },
      }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({
        ...config,
        seo: {
          ...config.seo,
          organization: {
            ...config.seo.organization,
            telephone: '+55 (11) 98668-1572',
          },
        },
      }),
    ).toBe(true);
    expect(
      service.isSiteConfigV2({
        ...config,
        pages: [
          {
            ...homePage,
            sections: homePage.sections.map((section) =>
              section.type === 'project-grid' ? { ...section, maxColumns: 5 } : section,
            ),
          },
        ],
      }),
    ).toBe(false);
  });

  it('should reject unresolved V2 media and project relationships', () => {
    const config = createSiteConfigV2Fixture();
    const homePage = config.pages[0]!;
    const withMissingMedia = {
      ...config,
      pages: [
        {
          ...homePage,
          sections: homePage.sections.map((section) =>
            section.type === 'hero'
              ? {
                  ...section,
                  background: { ...section.background, assetId: 'missing-media' },
                }
              : section,
          ),
        },
      ],
    };
    const withMissingProject = {
      ...config,
      pages: [
        {
          ...homePage,
          sections: homePage.sections.map((section) =>
            section.type === 'project-grid'
              ? { ...section, projectIds: ['missing-project'] }
              : section,
          ),
        },
      ],
    };

    expect(service.isSiteConfigV2(withMissingMedia)).toBe(false);
    expect(service.isSiteConfigV2(withMissingProject)).toBe(false);
  });

  it('should require one visible home and unique page paths and orders', () => {
    const config = createSiteConfigV2Fixture();
    const homePage = config.pages[0]!;
    const aboutPage = {
      ...homePage,
      id: 'about-page',
      slug: 'about',
      path: '/about',
      order: 20,
      seo: { ...homePage.seo, canonicalPath: '/about' },
    };

    expect(
      service.isSiteConfigV2({
        ...config,
        pages: [
          {
            ...homePage,
            slug: 'landing',
            path: '/landing',
            seo: { ...homePage.seo, canonicalPath: '/landing' },
          },
        ],
      }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({ ...config, pages: [{ ...homePage, visible: false }] }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({
        ...config,
        pages: [
          homePage,
          { ...aboutPage, path: '/studio', seo: { ...aboutPage.seo, canonicalPath: '/studio' } },
        ],
      }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({ ...config, pages: [homePage, { ...aboutPage, order: 10 }] }),
    ).toBe(false);
  });

  it('should enforce page SEO paths and unique section ordering', () => {
    const config = createSiteConfigV2Fixture();
    const homePage = config.pages[0]!;

    expect(
      service.isSiteConfigV2({
        ...config,
        pages: [{ ...homePage, seo: { ...homePage.seo, canonicalPath: '/home' } }],
      }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({
        ...config,
        pages: [
          {
            ...homePage,
            sections: homePage.sections.map((section) =>
              section.type === 'whatsapp-cta' ? { ...section, order: 20 } : section,
            ),
          },
        ],
      }),
    ).toBe(false);
  });

  it('should validate the complete contact-form catalog shape and reject unknown section types', () => {
    const config = createSiteConfigV2Fixture();
    const homePage = config.pages[0]!;

    expect(
      service.isSiteConfigV2({
        ...config,
        pages: [
          {
            ...homePage,
            sections: homePage.sections.map((section) =>
              section.type === 'contact-form' ? { ...section, privacyNotice: '' } : section,
            ),
          },
        ],
      }),
    ).toBe(false);
    expect(
      service.isSiteConfigV2({
        ...config,
        pages: [
          {
            ...homePage,
            sections: [
              ...homePage.sections,
              {
                id: 'unknown-section',
                type: 'unknown',
                order: 50,
                visible: true,
                anchor: 'unknown',
              },
            ],
          },
        ],
      }),
    ).toBe(false);
  });

  it('should reject a configurable page that collides with the static portfolio route', () => {
    const config = createSiteConfigV2Fixture();
    const homePage = config.pages[0]!;

    expect(
      service.isSiteConfigV2({
        ...config,
        pages: [
          homePage,
          {
            ...homePage,
            id: 'portfolio-page',
            slug: 'portfolio',
            path: '/portfolio',
            order: 20,
            seo: { ...homePage.seo, canonicalPath: '/portfolio' },
          },
        ],
      }),
    ).toBe(false);
  });
});
