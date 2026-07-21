import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { NavigationItem } from '../../../../shared/models/navigation-item.model';
import { SiteFooter } from '../../../../shared/models/site-footer.model';
import { SiteHeader } from '../../../../shared/models/site-header.model';
import { PublicSiteContentService } from '../../services/public-site-content.service';

@Component({
  selector: 'app-public-page-shell',
  templateUrl: './public-page-shell.component.html',
  standalone: false,
  styleUrls: ['./public-page-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPageShellComponent {
  public readonly contentService = inject(PublicSiteContentService);

  public readonly headerConfig = computed<SiteHeader>(() => {
    const header = this.contentService.config().header;

    return {
      ...header,
      homeLink: {
        ...header.homeLink,
        href: this.resolveHomeHref(header.homeLink.href),
      },
    };
  });

  public readonly navigationItems = computed<readonly NavigationItem[]>(() =>
    this.contentService.navigationItems().map((item) => ({
      ...item,
      href: this.resolveHomeHref(item.href),
    })),
  );

  public readonly footerConfig = computed<SiteFooter>(() => {
    const footer = this.contentService.config().footer;

    return {
      ...footer,
      links: footer.links.map((link) => ({
        ...link,
        href: this.resolveHomeHref(link.href),
      })),
      backToTopLink: {
        ...footer.backToTopLink,
        href: '#inicio',
      },
    };
  });

  private resolveHomeHref(href: string): string {
    if (href === '#portfolio')
      return '/portfolio';

    return href.startsWith('#') ? `/${href}` : href;
  }
}
