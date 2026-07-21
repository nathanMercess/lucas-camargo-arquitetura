import { Injectable } from '@angular/core';

import { PublishedManifestV1 } from '../../../shared/models/published-manifest-v1.model';
import { SiteConfigV1 } from '../../../shared/models/site-config-v1.model';

@Injectable({
  providedIn: 'root',
})
export class SiteConfigValidatorService {
  public isPublishedManifestV1(value: unknown): value is PublishedManifestV1 {
    if (!this.isRecord(value))
      return false;

    return (
      value['schemaVersion'] === 1 &&
      this.isNonEmptyString(value['releaseId']) &&
      this.isSafeContentKey(value['siteConfigKey']) &&
      this.isSha256(value['sha256']) &&
      this.isIsoDate(value['publishedAt']) &&
      (value['previousReleaseId'] === undefined ||
        this.isNonEmptyString(value['previousReleaseId']))
    );
  }

  public isSiteConfigV1(value: unknown): value is SiteConfigV1 {
    if (!this.isRecord(value) || value['schemaVersion'] !== 1)
      return false;

    if (
      !this.isNonEmptyString(value['releaseId']) ||
      !this.isIsoDate(value['publishedAt']) ||
      value['locale'] !== 'pt-BR'
    )
      return false;

    if (
      !this.isIdentity(value['identity']) ||
      !this.isSeo(value['seo']) ||
      !this.isTheme(value['theme']) ||
      !this.isUiLabels(value['uiLabels']) ||
      !this.isHeader(value['header']) ||
      !this.isFooter(value['footer'])
    )
      return false;

    if (
      !this.isArrayOf(value['media'], (item) => this.isMediaAsset(item)) ||
      !this.isArrayOf(value['navigationItems'], (item) => this.isNavigationItem(item)) ||
      !this.isArrayOf(value['sections'], (item) => this.isSection(item)) ||
      !this.isArrayOf(value['portfolioCategories'], (item) => this.isPortfolioCategory(item)) ||
      !this.isArrayOf(value['projects'], (item) => this.isPortfolioProject(item))
    )
      return false;

    return this.hasValidRelationships(value as unknown as SiteConfigV1);
  }

  private isIdentity(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isNonEmptyString(value['brandName']) &&
      this.isNonEmptyString(value['descriptor']) &&
      this.isHttpsUrl(value['canonicalUrl']) &&
      this.isId(value['logoLightMediaId']) &&
      this.isId(value['logoDarkMediaId']) &&
      this.isId(value['faviconMediaId'])
    );
  }

  private isSeo(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isNonEmptyString(value['title']) &&
      this.isNonEmptyString(value['description']) &&
      this.isHttpsUrl(value['canonicalUrl']) &&
      this.isNonEmptyString(value['robots']) &&
      this.isSafeColor(value['themeColor']) &&
      this.isOpenGraph(value['openGraph']) &&
      this.isTwitterCard(value['twitter']) &&
      this.isOrganization(value['organization'])
    );
  }

  private isOpenGraph(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isNonEmptyString(value['title']) &&
      this.isNonEmptyString(value['description']) &&
      value['type'] === 'website' &&
      this.isId(value['imageMediaId']) &&
      this.isNonEmptyString(value['imageAlt'])
    );
  }

  private isTwitterCard(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      value['card'] === 'summary_large_image' &&
      this.isNonEmptyString(value['title']) &&
      this.isNonEmptyString(value['description']) &&
      this.isId(value['imageMediaId']) &&
      this.isNonEmptyString(value['imageAlt'])
    );
  }

  private isOrganization(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return [
      'name',
      'url',
      'email',
      'telephone',
      'addressLocality',
      'addressRegion',
      'addressCountry',
    ].every((key) => this.isNonEmptyString(value[key]));
  }

  private isTheme(value: unknown): boolean {
    if (!this.isRecord(value) || !this.isTemplateId(value['presetId']))
      return false;

    const colors = value['colors'];
    const typography = value['typography'];
    const layout = value['layout'];
    const motion = value['motion'];

    if (
      !this.isRecord(colors) ||
      !this.isRecord(typography) ||
      !this.isRecord(layout) ||
      !this.isRecord(motion)
    )
      return false;

    const colorsAreSafe = [
      'accent',
      'accentSoft',
      'ink',
      'inkDeep',
      'surfaceMuted',
      'surface',
      'textMuted',
      'border',
      'focus',
    ].every((key) => this.isSafeColor(colors[key]));

    return (
      colorsAreSafe &&
      this.isSafeFontFamily(typography['brandFontFamily']) &&
      this.isSafeFontFamily(typography['dataFontFamily']) &&
      this.isNumberInRange(layout['contentMaxWidthPx'], 960, 1920) &&
      this.isNumberInRange(layout['pageGutterMinPx'], 12, 64) &&
      this.isNumberInRange(layout['pageGutterPreferredVw'], 1, 10) &&
      this.isNumberInRange(layout['pageGutterMaxPx'], 32, 160) &&
      typeof motion['revealEnabled'] === 'boolean' &&
      this.isNumberInRange(motion['revealDurationMs'], 0, 3000) &&
      this.isNumberInRange(motion['revealTransformDurationMs'], 0, 3000)
    );
  }

  private isTemplateId(value: unknown): boolean {
    return (
      value === 'lucas-camargo-v1' ||
      value === 'gallery-v1' ||
      value === 'minimal-v1' ||
      value === 'contrast-v1'
    );
  }

  private isUiLabels(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return [
      'skipToContent',
      'mainNavigation',
      'footerNavigation',
      'openMenu',
      'closeMenu',
      'pausePortfolio',
      'resumePortfolio',
      'referenceImage',
      'exploreCategory',
    ].every((key) => this.isNonEmptyString(value[key]));
  }

  private isHeader(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isMediaReference(value['logo']) &&
      this.isLink(value['homeLink']) &&
      this.isLink(value['primaryCta'])
    );
  }

  private isFooter(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isMediaReference(value['logo']) &&
      this.isArrayOf(value['links'], (item) => this.isNavigationItem(item)) &&
      this.isArrayOf(value['socialLinks'], (item) => this.isSocialLink(item)) &&
      this.isNonEmptyString(value['statement']) &&
      this.isNonEmptyString(value['location']) &&
      this.isNonEmptyString(value['copyrightOwner']) &&
      this.isLink(value['backToTopLink'])
    );
  }

  private isMediaAsset(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isId(value['id']) &&
      this.isSafeMediaPath(value['path']) &&
      this.isNonEmptyString(value['mimeType']) &&
      this.isNumberInRange(value['width'], 1, 20000) &&
      this.isNumberInRange(value['height'], 1, 20000) &&
      this.isSha256(value['sha256']) &&
      ['brand', 'project', 'reference'].includes(String(value['provenance']))
    );
  }

  private isMediaReference(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isId(value['assetId']) &&
      typeof value['alt'] === 'string' &&
      typeof value['decorative'] === 'boolean' &&
      this.isNumberInRange(value['focalPointX'], 0, 100) &&
      this.isNumberInRange(value['focalPointY'], 0, 100) &&
      (value['caption'] === undefined || typeof value['caption'] === 'string')
    );
  }

  private isNavigationItem(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isId(value['id']) &&
      this.isNonEmptyString(value['label']) &&
      this.isSafeHref(value['href'])
    );
  }

  private isLink(value: unknown): boolean {
    if (!this.isNavigationItem(value) || !this.isRecord(value))
      return false;

    return (
      (value['ariaLabel'] === undefined || this.isNonEmptyString(value['ariaLabel'])) &&
      (value['target'] === undefined || ['_self', '_blank'].includes(String(value['target'])))
    );
  }

  private isSocialLink(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isId(value['id']) &&
      this.isNonEmptyString(value['network']) &&
      this.isNonEmptyString(value['label']) &&
      this.isHttpsUrl(value['href']) &&
      this.isNonEmptyString(value['icon'])
    );
  }

  private isPortfolioCategory(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isId(value['id']) &&
      this.isNonEmptyString(value['index']) &&
      this.isNonEmptyString(value['title']) &&
      this.isNonEmptyString(value['description']) &&
      this.isSafeCssClass(value['visualClass']) &&
      (value['coverMediaId'] === undefined || this.isId(value['coverMediaId']))
    );
  }

  private isPortfolioProject(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isId(value['id']) &&
      this.isId(value['slug']) &&
      this.isNonEmptyString(value['title']) &&
      this.isNonEmptyString(value['summary']) &&
      this.isStringArray(value['description']) &&
      this.isStringArray(value['categoryIds']) &&
      this.isMediaReference(value['cover']) &&
      this.isArrayOf(value['gallery'], (item) => this.isMediaReference(item)) &&
      typeof value['location'] === 'string' &&
      typeof value['year'] === 'string' &&
      this.isStringArray(value['services']) &&
      Number.isFinite(value['order']) &&
      typeof value['visible'] === 'boolean' &&
      this.isPageSeo(value['seo'])
    );
  }

  private isPageSeo(value: unknown): boolean {
    if (!this.isRecord(value))
      return false;

    return (
      this.isNonEmptyString(value['title']) &&
      this.isNonEmptyString(value['description']) &&
      this.isSafeRoute(value['canonicalPath']) &&
      this.isId(value['imageMediaId']) &&
      typeof value['noIndex'] === 'boolean'
    );
  }

  private isSection(value: unknown): boolean {
    if (!this.isSectionBase(value))
      return false;

    switch (value['type']) {
      case 'hero':
        return this.isHeroSection(value);
      case 'manifesto':
        return this.isManifestoSection(value);
      case 'practice':
        return this.isPracticeSection(value);
      case 'portfolio':
        return this.isPortfolioSection(value);
      case 'metrics':
        return this.isMetricsSection(value);
      case 'about':
        return this.isAboutSection(value);
      case 'process':
        return this.isProcessSection(value);
      case 'contact':
        return this.isContactSection(value);
      default:
        return false;
    }
  }

  private isSectionBase(value: unknown): value is Record<string, unknown> {
    if (!this.isRecord(value))
      return false;

    return (
      this.isId(value['id']) &&
      this.isNonEmptyString(value['type']) &&
      Number.isFinite(value['order']) &&
      typeof value['visible'] === 'boolean' &&
      this.isId(value['anchor'])
    );
  }

  private isHeroSection(value: Record<string, unknown>): boolean {
    return (
      value['variant'] === 'editorial-v1' &&
      this.isNonEmptyString(value['overline']) &&
      this.isRichText(value['title']) &&
      this.isRichText(value['supportingText']) &&
      this.isLink(value['portfolioLink']) &&
      this.isMediaReference(value['background']) &&
      this.isNonEmptyString(value['indexLabel']) &&
      this.isNonEmptyString(value['caption'])
    );
  }

  private isManifestoSection(value: Record<string, unknown>): boolean {
    return (
      value['variant'] === 'editorial-v1' &&
      this.isNonEmptyString(value['indexLabel']) &&
      this.isRichText(value['title']) &&
      this.isStringArray(value['body']) &&
      this.isLink(value['link'])
    );
  }

  private isPracticeSection(value: Record<string, unknown>): boolean {
    return (
      value['variant'] === 'editorial-list-v1' &&
      this.isNonEmptyString(value['indexLabel']) &&
      this.isNonEmptyString(value['overline']) &&
      this.isRichText(value['title']) &&
      this.isArrayOf(value['practiceAreas'], (item) => this.isPracticeArea(item))
    );
  }

  private isPortfolioSection(value: Record<string, unknown>): boolean {
    return (
      value['variant'] === 'horizontal-accordion-v1' &&
      this.isNonEmptyString(value['overline']) &&
      this.isRichText(value['title']) &&
      this.isStringArray(value['description']) &&
      this.isStringArray(value['categoryIds']) &&
      typeof value['autoRotationEnabled'] === 'boolean' &&
      this.isNumberInRange(value['autoRotationIntervalMs'], 3000, 60000)
    );
  }

  private isMetricsSection(value: Record<string, unknown>): boolean {
    return (
      value['variant'] === 'grid-v1' &&
      this.isNonEmptyString(value['indexLabel']) &&
      this.isNonEmptyString(value['ariaLabel']) &&
      this.isArrayOf(value['metrics'], (item) => this.isMetric(item))
    );
  }

  private isAboutSection(value: Record<string, unknown>): boolean {
    return (
      value['variant'] === 'portrait-v1' &&
      this.isProfile(value['profile']) &&
      this.isMediaReference(value['portrait']) &&
      this.isNonEmptyString(value['portraitAriaLabel']) &&
      this.isRichText(value['title']) &&
      this.isLink(value['link'])
    );
  }

  private isProcessSection(value: Record<string, unknown>): boolean {
    return (
      value['variant'] === 'steps-v1' &&
      this.isNonEmptyString(value['overline']) &&
      this.isNonEmptyString(value['title']) &&
      this.isArrayOf(value['steps'], (item) => this.isProcessStep(item))
    );
  }

  private isContactSection(value: Record<string, unknown>): boolean {
    return (
      value['variant'] === 'editorial-v1' &&
      this.isNonEmptyString(value['overline']) &&
      this.isRichText(value['title']) &&
      this.isLink(value['cta']) &&
      this.isArrayOf(value['contactChannels'], (item) => this.isContactChannel(item))
    );
  }

  private isRichText(value: unknown): boolean {
    if (!this.isRecord(value) || !Array.isArray(value['lines']) || value['lines'].length === 0)
      return false;

    return value['lines'].every((line) => {
      if (!this.isRecord(line) || !Array.isArray(line['segments']) || line['segments'].length === 0)
        return false;

      return line['segments'].every(
        (segment) =>
          this.isRecord(segment) &&
          this.isNonEmptyString(segment['text']) &&
          typeof segment['emphasis'] === 'boolean',
      );
    });
  }

  private isPracticeArea(value: unknown): boolean {
    return this.hasTextFields(value, ['id', 'index', 'title', 'description']);
  }

  private isMetric(value: unknown): boolean {
    return this.hasTextFields(value, ['id', 'value', 'label']);
  }

  private isProfile(value: unknown): boolean {
    return this.hasTextFields(value, ['name', 'professionalTitle', 'biography']);
  }

  private isProcessStep(value: unknown): boolean {
    return this.hasTextFields(value, ['id', 'index', 'title', 'description']);
  }

  private isContactChannel(value: unknown): boolean {
    if (!this.hasTextFields(value, ['id', 'label', 'value']) || !this.isRecord(value))
      return false;

    return value['href'] === undefined || this.isSafeHref(value['href']);
  }

  private hasValidRelationships(config: SiteConfigV1): boolean {
    if (
      !this.hasUniqueValues(config.media.map((asset) => asset.id)) ||
      !this.hasUniqueValues(config.sections.map((section) => section.id)) ||
      !this.hasUniqueValues(config.sections.map((section) => section.anchor)) ||
      !this.hasUniqueValues(config.sections.map((section) => section.order)) ||
      !this.hasUniqueValues(config.portfolioCategories.map((category) => category.id)) ||
      !this.hasUniqueValues(config.projects.map((project) => project.id)) ||
      !this.hasUniqueValues(config.projects.map((project) => project.slug))
    )
      return false;

    const mediaIds = new Set(config.media.map((asset) => asset.id));
    const categoryIds = new Set(config.portfolioCategories.map((category) => category.id));
    const mediaReferences = [
      config.identity.logoLightMediaId,
      config.identity.logoDarkMediaId,
      config.identity.faviconMediaId,
      config.seo.openGraph.imageMediaId,
      config.seo.twitter.imageMediaId,
      config.header.logo.assetId,
      config.footer.logo.assetId,
      ...config.portfolioCategories.flatMap((category) =>
        category.coverMediaId ? [category.coverMediaId] : [],
      ),
      ...config.sections.flatMap((section) => {
        switch (section.type) {
          case 'hero':
            return [section.background.assetId];
          case 'about':
            return [section.portrait.assetId];
          default:
            return [];
        }
      }),
      ...config.projects.flatMap((project) => [
        project.cover.assetId,
        project.seo.imageMediaId,
        ...project.gallery.map((item) => item.assetId),
      ]),
    ];

    return (
      mediaReferences.every((mediaId) => mediaIds.has(mediaId)) &&
      config.projects.every((project) =>
        project.categoryIds.every((categoryId) => categoryIds.has(categoryId)),
      ) &&
      config.projects.every(
        (project) => project.seo.canonicalPath === `/portfolio/projeto/${project.slug}`,
      ) &&
      config.sections.every(
        (section) =>
          section.type !== 'portfolio' ||
          section.categoryIds.every((categoryId) => categoryIds.has(categoryId)),
      )
    );
  }

  private hasTextFields(value: unknown, keys: readonly string[]): boolean {
    if (!this.isRecord(value))
      return false;

    return keys.every((key) => this.isNonEmptyString(value[key]));
  }

  private hasUniqueValues(values: readonly (number | string)[]): boolean {
    return new Set(values).size === values.length;
  }

  private isArrayOf(value: unknown, predicate: (item: unknown) => boolean): boolean {
    return Array.isArray(value) && value.every(predicate);
  }

  private isStringArray(value: unknown): boolean {
    return Array.isArray(value) && value.every((item) => this.isNonEmptyString(item));
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= 5000;
  }

  private isId(value: unknown): value is string {
    return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(value);
  }

  private isSha256(value: unknown): value is string {
    return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  }

  private isIsoDate(value: unknown): value is string {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
  }

  private isNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum;
  }

  private isSafeContentKey(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      /^\/?[a-zA-Z0-9][a-zA-Z0-9._/-]*\.json$/.test(value) &&
      !value.includes('..') &&
      !value.includes('//')
    );
  }

  private isSafeMediaPath(value: unknown): value is string {
    if (typeof value !== 'string')
      return false;

    return (
      (/^\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value) &&
        !value.includes('..') &&
        !value.includes('//')) ||
      this.isHttpsUrl(value)
    );
  }

  private isSafeRoute(value: unknown): value is string {
    return typeof value === 'string' && /^\/[a-z0-9/-]*$/.test(value) && !value.includes('..');
  }

  private isSafeHref(value: unknown): value is string {
    if (typeof value !== 'string' || /[<>"'`\s]/.test(value))
      return false;

    return /^(#[a-z0-9-]+|\/[^/].*|https:\/\/|mailto:|tel:)/i.test(value);
  }

  private isHttpsUrl(value: unknown): value is string {
    if (typeof value !== 'string')
      return false;

    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }

  private isSafeColor(value: unknown): value is string {
    if (typeof value !== 'string')
      return false;

    return /^#[a-f0-9]{6}$/i.test(value) || /^rgb\([0-9 /%.]+\)$/i.test(value);
  }

  private isSafeFontFamily(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      value.length <= 300 &&
      !/[{};]/.test(value) &&
      !/url\s*\(/i.test(value)
    );
  }

  private isSafeCssClass(value: unknown): value is string {
    return (
      typeof value === 'string' && /^portfolio-accordion-panel--[a-z0-9-]+$/.test(value)
    );
  }
}
