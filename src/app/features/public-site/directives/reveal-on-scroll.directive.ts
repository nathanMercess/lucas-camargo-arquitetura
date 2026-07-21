import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, DestroyRef, Directive, ElementRef, inject, PLATFORM_ID } from '@angular/core';

@Directive({
  selector: '[appRevealOnScroll]',
  standalone: false,
  host: {
    class: 'reveal-on-scroll',
  },
})
export class RevealOnScrollDirective implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    const element = this.elementRef.nativeElement;

    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      element.classList.add('reveal-on-scroll--visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting)
          return;

        element.classList.add('reveal-on-scroll--visible');
        observer.unobserve(element);
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
