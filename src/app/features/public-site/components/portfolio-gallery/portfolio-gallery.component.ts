import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { GalleriaResponsiveOptions } from 'primeng/galleria';

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

  public readonly responsiveOptions: GalleriaResponsiveOptions[] = [
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '720px', numVisible: 3 },
    { breakpoint: '480px', numVisible: 1 },
  ];

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

  public openLightbox(position: number): void {
    if (!this.galleryItems()[position])
      return;

    this.activeIndex.set(position);
    this.isLightboxVisible.set(true);
  }

  public setActiveIndex(position: number): void {
    this.activeIndex.set(position);
  }

  public setLightboxVisibility(isVisible: boolean): void {
    this.isLightboxVisible.set(isVisible);
  }

  public lightboxLabel(item: PortfolioGalleryItem, position: number): string {
    return item.alt || `${this.title()} — ${position + 1}`;
  }
}
