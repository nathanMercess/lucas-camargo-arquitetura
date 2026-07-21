import { SiteTemplateId } from './site-template-id.type';
import { ThemeColorTokens } from './theme-color-tokens.model';
import { ThemeLayoutTokens } from './theme-layout-tokens.model';
import { ThemeMotionTokens } from './theme-motion-tokens.model';
import { ThemeTypographyTokens } from './theme-typography-tokens.model';

export interface ThemeConfig {
  readonly presetId: SiteTemplateId;
  readonly colors: ThemeColorTokens;
  readonly typography: ThemeTypographyTokens;
  readonly layout: ThemeLayoutTokens;
  readonly motion: ThemeMotionTokens;
}
