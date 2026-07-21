import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RichTextBlock } from '../../../../shared/models/rich-text-block.model';

@Component({
  selector: 'app-rich-text',
  templateUrl: './rich-text.component.html',
  standalone: false,
  styleUrls: ['./rich-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextComponent {
  public readonly content = input.required<RichTextBlock>();
}
