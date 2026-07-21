import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HeroSectionConfig } from '../../../../shared/models/hero-section-config.model';
import { NavigationItem } from '../../../../shared/models/navigation-item.model';
import { SiteHeader } from '../../../../shared/models/site-header.model';
import { SiteUiLabels } from '../../../../shared/models/site-ui-labels.model';

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  standalone: false,
  styleUrls: ['./hero-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent {
  public readonly config = input.required<HeroSectionConfig>();

  public readonly headerConfig = input.required<SiteHeader>();

  public readonly navigationItems = input.required<readonly NavigationItem[]>();

  public readonly uiLabels = input.required<SiteUiLabels>();

  public readonly backgroundPath = input.required<string>();

  public readonly logoPath = input.required<string>();

  public readonly skipTarget = input.required<string>();
}
