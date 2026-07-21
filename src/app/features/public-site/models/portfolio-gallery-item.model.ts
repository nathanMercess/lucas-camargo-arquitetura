export interface PortfolioGalleryItem {
  readonly id: string;
  readonly assetId: string;
  readonly src: string;
  readonly alt: string;
  readonly decorative: boolean;
  readonly caption?: string;
  readonly width: number;
  readonly height: number;
  readonly objectPosition: string;
}
