import { NO_ERRORS_SCHEMA, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { PublicSiteContentService } from '../../services/public-site-content.service';
import { PublicPageShellComponent } from './public-page-shell.component';

describe('PublicPageShellComponent', () => {
  let fixture: ComponentFixture<PublicPageShellComponent>;

  beforeEach(async () => {
    const config = signal(DEFAULT_SITE_CONFIG);
    const contentService = {
      config,
      navigationItems: computed(() => config().navigationItems),
      isLoading: signal(false),
      resolveMediaPath: (assetId: string) =>
        config().media.find((asset) => asset.id === assetId)?.path ?? '',
    };

    await TestBed.configureTestingModule({
      declarations: [PublicPageShellComponent],
      providers: [{ provide: PublicSiteContentService, useValue: contentService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicPageShellComponent);
    fixture.detectChanges();
  });

  it('should adapt configured anchors for navigation outside the home page', () => {
    const component = fixture.componentInstance;
    const navigationById = new Map(component.navigationItems().map((item) => [item.id, item]));

    expect(component.headerConfig().homeLink.href).toBe('/#inicio');
    expect(navigationById.get('portfolio')?.href).toBe('/portfolio');
    expect(navigationById.get('contact')?.href).toBe('/#contato');
    expect(component.footerConfig().backToTopLink.href).toBe('#inicio');
  });
});
