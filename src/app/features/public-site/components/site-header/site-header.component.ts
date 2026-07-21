import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NavigationItem } from '../../../../shared/models/navigation-item.model';

@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.component.html',
  standalone: false,
  styleUrls: ['./site-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  public readonly navigationItems = input.required<readonly NavigationItem[]>();

  public readonly isMenuOpen = signal<boolean>(false);

  private readonly document = inject(DOCUMENT);

  public toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
    this.document.body.classList.toggle('site-menu-open', this.isMenuOpen());
  }

  public closeMenu(): void {
    this.isMenuOpen.set(false);
    this.document.body.classList.remove('site-menu-open');
  }
}
