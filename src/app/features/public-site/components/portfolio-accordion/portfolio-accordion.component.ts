import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';

import { PortfolioCategory } from '../../../../shared/models/portfolio-category.model';
import { PortfolioSectionConfig } from '../../../../shared/models/portfolio-section-config.model';
import { SiteUiLabels } from '../../../../shared/models/site-ui-labels.model';

@Component({
  selector: 'app-portfolio-accordion',
  templateUrl: './portfolio-accordion.component.html',
  standalone: false,
  styleUrls: ['./portfolio-accordion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioAccordionComponent {
  public readonly config = input.required<PortfolioSectionConfig>();

  public readonly categories = input.required<readonly PortfolioCategory[]>();

  public readonly uiLabels = input.required<SiteUiLabels>();

  public readonly mediaPaths = input.required<Readonly<Record<string, string>>>();

  public readonly activeCategoryId = signal<string>('');

  public readonly isAutoRotationPaused = signal<boolean>(false);

  public readonly visibleCategories = computed(() => {
    const categoriesById = new Map(this.categories().map((category) => [category.id, category]));

    return this.config().categoryIds.flatMap((categoryId) => {
      const category = categoriesById.get(categoryId);

      return category ? [category] : [];
    });
  });

  public readonly motionControlLabel = computed(() =>
    this.isAutoRotationPaused()
      ? this.uiLabels().resumePortfolio
      : this.uiLabels().pausePortfolio,
  );

  public readonly motionControlText = computed(() => this.motionControlLabel().trim().split(/\s+/)[0]);

  private readonly document = inject(DOCUMENT);

  private readonly isPointerInteractionPaused = signal<boolean>(false);

  private readonly synchronizeActiveCategory = effect(() => {
    const categories = this.visibleCategories();

    if (categories.some((category) => category.id === this.activeCategoryId()))
      return;

    this.activeCategoryId.set(categories[0]?.id ?? '');
  });

  private readonly rotateCategories = effect((onCleanup) => {
    const config = this.config();
    const browserWindow = this.document.defaultView;

    if (!browserWindow || !config.autoRotationEnabled)
      return;

    if (this.prefersReducedMotion()) {
      this.isAutoRotationPaused.set(true);
      return;
    }

    const intervalId = browserWindow.setInterval(
      () => this.selectNextCategory(),
      config.autoRotationIntervalMs,
    );

    onCleanup(() => browserWindow.clearInterval(intervalId));
  });

  public selectCategory(categoryId: string): void {
    const categoryExists = this.visibleCategories().some(
      (category) => category.id === categoryId,
    );

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

  public backgroundImage(category: PortfolioCategory): string | null {
    if (!category.coverMediaId)
      return null;

    const path = this.mediaPaths()[category.coverMediaId];

    return path ? `url("${path}")` : null;
  }

  private selectNextCategory(): void {
    if (this.isAutoRotationPaused() || this.isPointerInteractionPaused())
      return;

    const categories = this.visibleCategories();

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
