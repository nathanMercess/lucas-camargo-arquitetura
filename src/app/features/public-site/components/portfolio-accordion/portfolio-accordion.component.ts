import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { PortfolioCategory } from '../../../../shared/models/portfolio-category.model';

@Component({
  selector: 'app-portfolio-accordion',
  templateUrl: './portfolio-accordion.component.html',
  standalone: false,
  styleUrls: ['./portfolio-accordion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioAccordionComponent implements OnInit {
  public readonly categories = input.required<readonly PortfolioCategory[]>();

  public readonly activeCategoryId = signal<string>('');

  public readonly isAutoRotationPaused = signal<boolean>(false);

  private readonly destroyRef = inject(DestroyRef);

  private readonly document = inject(DOCUMENT);

  private readonly isPointerInteractionPaused = signal<boolean>(false);

  public ngOnInit(): void {
    const firstCategory = this.categories()[0];

    if (!firstCategory)
      return;

    this.activeCategoryId.set(firstCategory.id);

    if (this.prefersReducedMotion()) {
      this.isAutoRotationPaused.set(true);
      return;
    }

    interval(6000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.selectNextCategory());
  }

  public selectCategory(categoryId: string): void {
    const categoryExists = this.categories().some((category) => category.id === categoryId);

    if (!categoryExists)
      return;

    this.activeCategoryId.set(categoryId);
  }

  public setPointerInteractionPaused(isPaused: boolean): void {
    this.isPointerInteractionPaused.set(isPaused);
  }

  public toggleAutoRotation(): void {
    this.isAutoRotationPaused.update((isPaused) => !isPaused);
  }

  private selectNextCategory(): void {
    if (this.isAutoRotationPaused() || this.isPointerInteractionPaused())
      return;

    const categories = this.categories();

    if (categories.length < 2)
      return;

    const currentIndex = categories.findIndex(
      (category) => category.id === this.activeCategoryId(),
    );
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % categories.length : 0;

    this.activeCategoryId.set(categories[nextIndex].id);
  }

  private prefersReducedMotion(): boolean {
    const browserWindow = this.document.defaultView;

    if (!browserWindow || typeof browserWindow.matchMedia !== 'function')
      return true;

    return browserWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
