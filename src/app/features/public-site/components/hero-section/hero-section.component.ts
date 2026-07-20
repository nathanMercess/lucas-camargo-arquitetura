import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NavigationItem } from '../../../../shared/models/navigation-item.model';

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  standalone: false,
  styleUrls: ['./hero-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent {
  public readonly navigationItems = input.required<readonly NavigationItem[]>();
}
