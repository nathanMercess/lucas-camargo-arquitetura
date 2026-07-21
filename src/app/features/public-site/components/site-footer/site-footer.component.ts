import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SiteFooter } from '../../../../shared/models/site-footer.model';
import { SiteUiLabels } from '../../../../shared/models/site-ui-labels.model';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  standalone: false,
  styleUrls: ['./site-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  public readonly config = input.required<SiteFooter>();

  public readonly uiLabels = input.required<SiteUiLabels>();

  public readonly logoPath = input.required<string>();

  public readonly currentYear = new Date().getFullYear();
}
