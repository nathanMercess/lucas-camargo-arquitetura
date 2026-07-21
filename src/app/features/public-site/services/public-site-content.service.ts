import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  Renderer2,
  RendererFactory2,
  RendererStyleFlags2,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { finalize, from, map, switchMap, take } from 'rxjs';

import { DEFAULT_SITE_CONFIG } from '../../../shared/config/default-site-config';
import { MediaAsset } from '../../../shared/models/media-asset.model';
import { PageSeo } from '../../../shared/models/page-seo.model';
import { PortfolioProject } from '../../../shared/models/portfolio-project.model';
import { PortfolioSectionConfig } from '../../../shared/models/portfolio-section-config.model';
import { SiteConfigV1 } from '../../../shared/models/site-config-v1.model';
import { PublicSiteContentState } from '../models/public-site-content-state.model';
import { PublicSiteRuntimeWindow } from '../models/public-site-runtime-window.model';
import { SiteConfigValidatorService } from './site-config-validator.service';

const CONTENT_CACHE_KEY = 'lucas-camargo-site-config-v1';
const DEFAULT_CONTENT_BASE_URL = '/content';

@Injectable({
  providedIn: 'root',
})
export class PublicSiteContentService {
  private readonly document = inject(DOCUMENT);

  private readonly http = inject(HttpClient);

  private readonly meta = inject(Meta);

  private readonly renderer: Renderer2 = inject(RendererFactory2).createRenderer(null, null);

  private readonly title = inject(Title);

  private readonly validator = inject(SiteConfigValidatorService);

  private readonly contentBaseUrl = this.readContentBaseUrl();

  private readonly state = signal<PublicSiteContentState>({
    config: DEFAULT_SITE_CONFIG,
    isLoading: false,
  });

  public readonly config = computed(() => this.state().config);

  public readonly isLoading = computed(() => this.state().isLoading);

  public readonly visibleSections = computed(() =>
    [...this.config().sections]
      .filter((section) => section.visible)
      .sort((first, second) => first.order - second.order),
  );

  public readonly navigationItems = computed(() => this.config().navigationItems);

  public readonly portfolioCategories = computed(() => this.config().portfolioCategories);

  public readonly portfolioSection = computed<PortfolioSectionConfig | undefined>(() =>
    this.visibleSections().find(
      (section): section is PortfolioSectionConfig => section.type === 'portfolio',
    ),
  );

  public readonly visibleProjects = computed<readonly PortfolioProject[]>(() =>
    [...this.config().projects]
      .filter((project) => project.visible)
      .sort((first, second) => first.order - second.order || first.id.localeCompare(second.id)),
  );

  public readonly mediaPaths = computed<Readonly<Record<string, string>>>(() => {
    const paths: Record<string, string> = {};

    for (const asset of this.config().media)
      paths[asset.id] = this.resolveMediaSource(asset.path);

    return paths;
  });

  public readonly firstContentAnchor = computed(
    () => this.visibleSections().find((section) => section.type !== 'hero')?.anchor ?? 'conteudo',
  );

  public constructor() {
    this.applyConfig(DEFAULT_SITE_CONFIG, false);
    this.loadContent();
  }

  public loadContent(): void {
    if (this.state().isLoading)
      return;

    this.setLoading(true);

    this.http
      .get<unknown>(this.resolveContentUrl('manifest.json'))
      .pipe(
        take(1),
        switchMap((manifest) => {
          if (!this.validator.isPublishedManifestV1(manifest))
            throw new Error('Manifest de conteúdo inválido.');

          return this.http.get<unknown>(this.resolveConfigUrl(manifest.siteConfigKey)).pipe(
            take(1),
            switchMap((config) => {
              if (!this.validator.isSiteConfigV1(config))
                throw new Error('Configuração pública inválida.');

              return from(this.matchesManifestSha256(config, manifest.sha256)).pipe(
                map((matchesManifest) => {
                  if (!matchesManifest)
                    throw new Error('O conteúdo não corresponde ao manifesto publicado.');

                  return config;
                }),
              );
            }),
          );
        }),
        finalize(() => this.setLoading(false)),
      )
      .subscribe({
        next: (config) => this.applyConfig(config, true),
        error: () => this.restoreFallback(),
      });
  }

  public resolveMediaPath(assetId: string): string {
    return this.mediaPaths()[assetId] ?? '';
  }

  public resolveMediaAsset(assetId: string): MediaAsset | undefined {
    return this.config().media.find((asset) => asset.id === assetId);
  }

  public restoreSiteSeo(): void {
    this.applySeo(this.config());
  }

  public applyPageSeo(
    seo: PageSeo,
    imageAlt: string,
    openGraphType: 'article' | 'website' = 'website',
  ): void {
    const config = this.config();
    const canonicalUrl = new URL(seo.canonicalPath, config.identity.canonicalUrl).toString();
    const imageUrl = this.absoluteMediaUrl(config, seo.imageMediaId);

    this.title.setTitle(seo.title);
    this.updateNamedMeta('description', seo.description);
    this.updateNamedMeta('robots', seo.noIndex ? 'noindex, nofollow' : config.seo.robots);
    this.updatePropertyMeta('og:title', seo.title);
    this.updatePropertyMeta('og:description', seo.description);
    this.updatePropertyMeta('og:type', openGraphType);
    this.updatePropertyMeta('og:url', canonicalUrl);
    this.updatePropertyMeta('og:image', imageUrl);
    this.updatePropertyMeta('og:image:alt', imageAlt);
    this.updateNamedMeta('twitter:card', config.seo.twitter.card);
    this.updateNamedMeta('twitter:title', seo.title);
    this.updateNamedMeta('twitter:description', seo.description);
    this.updateNamedMeta('twitter:image', imageUrl);
    this.updateNamedMeta('twitter:image:alt', imageAlt);
    this.updateCanonicalUrl(canonicalUrl);
  }

  private applyConfig(config: SiteConfigV1, shouldCache: boolean): void {
    this.state.update((state) => ({ ...state, config }));
    this.applyTheme(config);
    this.applySeo(config);

    if (shouldCache)
      this.writeCache(config);
  }

  private restoreFallback(): void {
    this.applyConfig(this.readCache() ?? DEFAULT_SITE_CONFIG, false);
  }

  private setLoading(isLoading: boolean): void {
    this.state.update((state) => ({ ...state, isLoading }));
  }

  private resolveConfigUrl(siteConfigKey: string): string {
    const normalizedKey = siteConfigKey.replace(/^\/?content\//, '');

    return this.resolveContentUrl(normalizedKey);
  }

  private resolveContentUrl(path: string): string {
    const normalizedBaseUrl = this.contentBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');

    return `${normalizedBaseUrl}/${normalizedPath}`;
  }

  private readContentBaseUrl(): string {
    const runtimeWindow = this.document.defaultView as PublicSiteRuntimeWindow | null;
    const configuredBaseUrl = runtimeWindow?.__LUCAS_CAMARGO_RUNTIME__?.contentBaseUrl?.trim();

    if (!configuredBaseUrl || !this.isSafeContentBaseUrl(configuredBaseUrl))
      return DEFAULT_CONTENT_BASE_URL;

    return configuredBaseUrl;
  }

  private isSafeContentBaseUrl(value: string): boolean {
    if (/^\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value))
      return !value.includes('..') && !value.includes('//');

    try {
      const url = new URL(value);

      return (
        url.protocol === 'https:' &&
        url.username === '' &&
        url.password === '' &&
        url.search === '' &&
        url.hash === ''
      );
    } catch {
      return false;
    }
  }

  private readCache(): SiteConfigV1 | null {
    try {
      const serializedConfig = this.document.defaultView?.localStorage.getItem(CONTENT_CACHE_KEY);

      if (!serializedConfig)
        return null;

      const cachedConfig: unknown = JSON.parse(serializedConfig);

      if (this.validator.isSiteConfigV1(cachedConfig))
        return cachedConfig;

      this.document.defaultView?.localStorage.removeItem(CONTENT_CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  }

  private writeCache(config: SiteConfigV1): void {
    try {
      this.document.defaultView?.localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(config));
    } catch {
      return;
    }
  }

  private async matchesManifestSha256(config: SiteConfigV1, expectedSha256: string): Promise<boolean> {
    const subtleCrypto = globalThis.crypto?.subtle;

    if (!subtleCrypto)
      return false;

    const serializedConfig = new TextEncoder().encode(JSON.stringify(config));
    const digest = await subtleCrypto.digest('SHA-256', serializedConfig);
    const actualSha256 = Array.from(
      new Uint8Array(digest),
      (byte) => byte.toString(16).padStart(2, '0'),
    ).join('');

    return actualSha256 === expectedSha256;
  }

  private applyTheme(config: SiteConfigV1): void {
    const root = this.document.documentElement;
    const { colors, layout, motion, typography } = config.theme;
    const tokens: readonly (readonly [string, string])[] = [
      ['--brand-accent', colors.accent],
      ['--brand-accent-soft', colors.accentSoft],
      ['--brand-ink', colors.ink],
      ['--brand-ink-deep', colors.inkDeep],
      ['--brand-surface-muted', colors.surfaceMuted],
      ['--brand-surface', colors.surface],
      ['--brand-text-muted', colors.textMuted],
      ['--brand-border', colors.border],
      ['--brand-focus', colors.focus],
      ['--content-max-width', `${layout.contentMaxWidthPx}px`],
      [
        '--page-gutter',
        `clamp(${layout.pageGutterMinPx}px, ${layout.pageGutterPreferredVw}vw, ${layout.pageGutterMaxPx}px)`,
      ],
      ['--font-brand', typography.brandFontFamily],
      ['--font-data', typography.dataFontFamily],
      ['--reveal-duration', `${motion.revealDurationMs}ms`],
      ['--reveal-transform-duration', `${motion.revealTransformDurationMs}ms`],
    ];

    for (const [name, value] of tokens)
      this.renderer.setStyle(root, name, value, RendererStyleFlags2.DashCase);

    this.renderer.setAttribute(root, 'data-site-template', config.theme.presetId);

    if (motion.revealEnabled)
      this.renderer.removeClass(root, 'site-reveal-disabled');
    else
      this.renderer.addClass(root, 'site-reveal-disabled');
  }

  private applySeo(config: SiteConfigV1): void {
    const { seo } = config;
    const openGraphImage = this.absoluteMediaUrl(config, seo.openGraph.imageMediaId);
    const twitterImage = this.absoluteMediaUrl(config, seo.twitter.imageMediaId);

    this.title.setTitle(seo.title);
    this.updateNamedMeta('description', seo.description);
    this.updateNamedMeta('robots', seo.robots);
    this.updateNamedMeta('theme-color', seo.themeColor);
    this.updatePropertyMeta('og:title', seo.openGraph.title);
    this.updatePropertyMeta('og:description', seo.openGraph.description);
    this.updatePropertyMeta('og:type', seo.openGraph.type);
    this.updatePropertyMeta('og:url', seo.canonicalUrl);
    this.updatePropertyMeta('og:image', openGraphImage);
    this.updatePropertyMeta('og:image:alt', seo.openGraph.imageAlt);
    this.updateNamedMeta('twitter:card', seo.twitter.card);
    this.updateNamedMeta('twitter:title', seo.twitter.title);
    this.updateNamedMeta('twitter:description', seo.twitter.description);
    this.updateNamedMeta('twitter:image', twitterImage);
    this.updateNamedMeta('twitter:image:alt', seo.twitter.imageAlt);
    this.updateCanonicalUrl(seo.canonicalUrl);
    this.updateFavicon(config);
    this.updateOrganizationSchema(config);
  }

  private updateNamedMeta(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private updatePropertyMeta(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private updateCanonicalUrl(url: string): void {
    let canonicalLink = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonicalLink) {
      canonicalLink = this.renderer.createElement('link') as HTMLLinkElement;
      this.renderer.setAttribute(canonicalLink, 'rel', 'canonical');
      this.renderer.appendChild(this.document.head, canonicalLink);
    }

    this.renderer.setAttribute(canonicalLink, 'href', url);
  }

  private updateFavicon(config: SiteConfigV1): void {
    const favicon = config.media.find((asset) => asset.id === config.identity.faviconMediaId);

    if (!favicon)
      return;

    let faviconLink = this.document.head.querySelector<HTMLLinkElement>('link[rel~="icon"]');

    if (!faviconLink) {
      faviconLink = this.renderer.createElement('link') as HTMLLinkElement;
      this.renderer.setAttribute(faviconLink, 'rel', 'icon');
      this.renderer.appendChild(this.document.head, faviconLink);
    }

    this.renderer.setAttribute(faviconLink, 'type', favicon.mimeType);
    this.renderer.setAttribute(faviconLink, 'href', this.resolveMediaSource(favicon.path));
  }

  private updateOrganizationSchema(config: SiteConfigV1): void {
    let script = this.document.head.querySelector<HTMLScriptElement>('#site-organization-schema');

    if (!script) {
      script = this.renderer.createElement('script') as HTMLScriptElement;
      this.renderer.setAttribute(script, 'id', 'site-organization-schema');
      this.renderer.setAttribute(script, 'type', 'application/ld+json');
      this.renderer.appendChild(this.document.head, script);
    }

    const organization = config.seo.organization;
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: organization.name,
      url: organization.url,
      email: organization.email,
      telephone: organization.telephone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: organization.addressLocality,
        addressRegion: organization.addressRegion,
        addressCountry: organization.addressCountry,
      },
    };

    this.renderer.setProperty(script, 'textContent', JSON.stringify(structuredData));
  }

  private absoluteMediaUrl(config: SiteConfigV1, assetId: string): string {
    const path = config.media.find((asset) => asset.id === assetId)?.path ?? '';
    const resolvedPath = this.resolveMediaSource(path);

    return new URL(resolvedPath, config.identity.canonicalUrl).toString();
  }

  private resolveMediaSource(path: string): string {
    if (!/^\/?content\//.test(path))
      return path;

    return this.resolveContentUrl(path.replace(/^\/?content\//, ''));
  }
}
