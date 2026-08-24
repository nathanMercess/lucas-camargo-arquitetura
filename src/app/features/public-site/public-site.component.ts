import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PublicSiteContentService } from './services/public-site-content.service';

@Component({
  selector: 'app-public-site',
  templateUrl: './public-site.component.html',
  standalone: false,
  styleUrls: ['./public-site.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSiteComponent {
  public readonly contentService = inject(PublicSiteContentService);
  public readonly visualBuilderDocument = computed(() => {
    const config = this.contentService.config();

    if (config.schemaVersion !== 1)
      return null;

    return config.visualBuilder?.enabled ? config.visualBuilder : null;
  });

  public constructor() {
    this.contentService.restoreSiteSeo();
  }
}
