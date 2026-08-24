import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { MediaAsset } from '../../../../shared/models/media-asset.model';
import { MediaReference } from '../../../../shared/models/media-reference.model';
import { PortfolioGalleryItem } from '../../models/portfolio-gallery-item.model';

@Component({
  selector: 'app-portfolio-gallery',
  templateUrl: './portfolio-gallery.component.html',
  standalone: false,
  styleUrls: ['./portfolio-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioGalleryComponent {
  public readonly title = input.required<string>();

  public readonly references = input.required<readonly MediaReference[]>();

  public readonly mediaAssets = input.required<readonly MediaAsset[]>();

  public readonly mediaPaths = input.required<Readonly<Record<string, string>>>();

  public readonly isLightboxVisible = signal<boolean>(false);

  public readonly activeIndex = signal<number>(0);

  private readonly lightbox = viewChild<ElementRef<HTMLDialogElement>>('lightbox');

  public readonly galleryItems = computed<PortfolioGalleryItem[]>(() => {
    const assetsById = new Map(this.mediaAssets().map((asset) => [asset.id, asset]));

    return this.references().flatMap((reference, position) => {
      const asset = assetsById.get(reference.assetId);
      const src = this.mediaPaths()[reference.assetId];

      if (!asset || !src)
        return [];

      return [
        {
          id: `${reference.assetId}-${position}`,
          assetId: reference.assetId,
          src,
          alt: reference.decorative ? '' : reference.alt,
          decorative: reference.decorative,
          caption: reference.caption,
          width: asset.width,
          height: asset.height,
          objectPosition: `${reference.focalPointX}% ${reference.focalPointY}%`,
        },
      ];
    });
  });

  public readonly activeItem = computed(() => this.galleryItems()[this.activeIndex()]);

  public openLightbox(position: number): void {
    if (!this.galleryItems()[position])
      return;

    this.activeIndex.set(position);
    this.isLightboxVisible.set(true);

    const dialog = this.lightbox()?.nativeElement;

    if (!dialog || dialog.open || typeof dialog.showModal !== 'function')
      return;

    dialog.showModal();
  }

  public setActiveIndex(position: number): void {
    if (!this.galleryItems()[position])
      return;

    this.activeIndex.set(position);
  }

  public showPrevious(): void {
    const itemCount = this.galleryItems().length;

    if (itemCount < 2)
      return;

    this.activeIndex.update((position) => (position - 1 + itemCount) % itemCount);
  }

  public showNext(): void {
    const itemCount = this.galleryItems().length;

    if (itemCount < 2)
      return;

    this.activeIndex.update((position) => (position + 1) % itemCount);
  }

  public closeLightbox(): void {
    const dialog = this.lightbox()?.nativeElement;

    if (dialog?.open && typeof dialog.close === 'function')
      dialog.close();

    this.isLightboxVisible.set(false);
  }

  public handleDialogClose(): void {
    this.isLightboxVisible.set(false);
  }

  public lightboxLabel(item: PortfolioGalleryItem, position: number): string {
    return item.alt || `${this.title()} — ${position + 1}`;
  }
}
