import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';

import { VisualBuilderDocument } from '../../../../shared/models/visual-builder-document.model';
import { VisualBuilderRendererService } from '../../../../shared/services/visual-builder-renderer.service';
import { PublicSiteContentService } from '../../services/public-site-content.service';

@Component({
  selector: 'app-custom-page-renderer',
  standalone: false,
  templateUrl: './custom-page-renderer.component.html',
  styleUrl: './custom-page-renderer.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomPageRendererComponent {
  private readonly contentService = inject(PublicSiteContentService);
  private readonly renderer = inject(VisualBuilderRendererService);

  public readonly document = input.required<VisualBuilderDocument>();
  protected readonly html = computed(() =>
    this.renderer.createSafeHtml(this.resolveMediaPaths(this.document().html)),
  );
  protected readonly css = computed(() =>
    this.renderer.sanitizeCss(this.resolveMediaPaths(this.document().css)),
  );

  private resolveMediaPaths(value: string): string {
    let resolvedValue = value;

    for (const asset of this.contentService.config().media)
      resolvedValue = resolvedValue.replaceAll(asset.path, this.contentService.resolveMediaPath(asset.id));

    return resolvedValue;
  }
}
