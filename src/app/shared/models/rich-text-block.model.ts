import { RichTextLine } from './rich-text-line.model';

export interface RichTextBlock {
  readonly lines: readonly RichTextLine[];
}
