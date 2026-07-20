import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FooterLink } from '../../../../shared/models/footer-link.model';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  standalone: false,
  styleUrls: ['./site-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  public readonly footerLinks = input.required<readonly FooterLink[]>();

  public readonly currentYear = new Date().getFullYear();
}
