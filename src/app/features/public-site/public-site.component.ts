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
    const document = this.contentService.config().visualBuilder;
    return document?.enabled ? document : null;
  });

  public constructor() {
    this.contentService.restoreSiteSeo();
  }
}
