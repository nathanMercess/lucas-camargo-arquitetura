import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import { VisualBuilderDocument } from '../../../../shared/models/visual-builder-document.model';

@Component({
  selector: 'app-custom-page-renderer',
  standalone: false,
  templateUrl: './custom-page-renderer.component.html',
  styleUrl: './custom-page-renderer.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomPageRendererComponent {
  public readonly document = input.required<VisualBuilderDocument>();
}
