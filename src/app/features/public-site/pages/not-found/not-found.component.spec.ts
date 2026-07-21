import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotFoundComponent } from './not-found.component';

@Component({
  selector: 'app-public-page-shell',
  template: '<ng-content />',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PublicPageShellStubComponent {}

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicPageShellStubComponent],
      declarations: [NotFoundComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
  });

  it('offers recovery links to the home and portfolio pages', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a')]
      .map((link: HTMLAnchorElement) => link.getAttribute('href'));

    expect(links).toEqual(['/', '/portfolio']);
  });
});
