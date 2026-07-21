import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationItem } from '../../../../shared/models/navigation-item.model';
import { SiteHeader } from '../../../../shared/models/site-header.model';
import { SiteUiLabels } from '../../../../shared/models/site-ui-labels.model';

@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.component.html',
  standalone: false,
  styleUrls: ['./site-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent implements OnDestroy {
  public readonly config = input.required<SiteHeader>();

  public readonly navigationItems = input.required<readonly NavigationItem[]>();

  public readonly uiLabels = input.required<SiteUiLabels>();

  public readonly logoPath = input.required<string>();

  public readonly isMenuOpen = signal<boolean>(false);

  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  private readonly navigation = viewChild.required<ElementRef<HTMLElement>>('navigation');

  private readonly document = inject(DOCUMENT);

  public toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
    this.document.body.classList.toggle('site-menu-open', this.isMenuOpen());
  }

  public closeMenu(): void {
    this.isMenuOpen.set(false);
    this.document.body.classList.remove('site-menu-open');
  }

  @HostListener('document:keydown.escape', ['$event'])
  public closeMenuFromKeyboard(event: Event): void {
    if (!this.isMenuOpen())
      return;

    event.preventDefault();
    this.closeMenu();
    this.menuButton().nativeElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  public containMenuFocus(event: Event): void {
    if (!this.isMenuOpen())
      return;

    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.key !== 'Tab')
      return;

    const menuButton = this.menuButton().nativeElement;
    const navigationLinks = Array.from(
      this.navigation().nativeElement.querySelectorAll<HTMLAnchorElement>('a[href]'),
    );
    const lastLink = navigationLinks.at(-1);

    if (!lastLink)
      return;

    if (keyboardEvent.shiftKey && this.document.activeElement === menuButton) {
      event.preventDefault();
      lastLink.focus();
      return;
    }

    if (!keyboardEvent.shiftKey && this.document.activeElement === lastLink) {
      event.preventDefault();
      menuButton.focus();
    }
  }

  public ngOnDestroy(): void {
    this.document.body.classList.remove('site-menu-open');
  }
}
