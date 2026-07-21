import { RichTextSegment } from './rich-text-segment.model';

export interface RichTextLine {
  readonly segments: readonly RichTextSegment[];
}
