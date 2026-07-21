import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonModule } from 'primeng/button';
import { GalleriaModule } from 'primeng/galleria';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { MediaReference } from '../../../../shared/models/media-reference.model';
import { PortfolioGalleryComponent } from './portfolio-gallery.component';

const reference: MediaReference = {
  assetId: 'architecture-reference',
  alt: 'Fachada da residência',
  decorative: false,
  focalPointX: 42,
  focalPointY: 58,
  caption: 'Vista principal',
};

describe('PortfolioGalleryComponent', () => {
  let fixture: ComponentFixture<PortfolioGalleryComponent>;
  let component: PortfolioGalleryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule, GalleriaModule],
      declarations: [PortfolioGalleryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioGalleryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Residência Teste');
    fixture.componentRef.setInput('references', [reference]);
    fixture.componentRef.setInput('mediaAssets', DEFAULT_SITE_CONFIG.media);
    fixture.componentRef.setInput('mediaPaths', {
      'architecture-reference': '/assets/editorial/architecture-reference.jpg',
    });
    fixture.detectChanges();
  });

  it('should resolve gallery media without duplicating content URLs in the component', () => {
    expect(component.galleryItems()).toEqual([
      {
        id: 'architecture-reference-0',
        assetId: 'architecture-reference',
        src: '/assets/editorial/architecture-reference.jpg',
        alt: 'Fachada da residência',
        decorative: false,
        caption: 'Vista principal',
        width: 2200,
        height: 1467,
        objectPosition: '42% 58%',
      },
    ]);
  });

  it('should open the PrimeNG lightbox at the selected item', () => {
    component.openLightbox(0);

    expect(component.activeIndex()).toBe(0);
    expect(component.isLightboxVisible()).toBe(true);
  });

  it('should ignore an unavailable lightbox position', () => {
    component.openLightbox(8);

    expect(component.isLightboxVisible()).toBe(false);
  });
});
