import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
}
