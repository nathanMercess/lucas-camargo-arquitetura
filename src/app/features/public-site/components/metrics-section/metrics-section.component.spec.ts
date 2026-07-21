import { TestBed } from '@angular/core/testing';

import { MetricsSectionComponent } from './metrics-section.component';

describe('MetricsSectionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetricsSectionComponent],
    }).compileComponents();
  });

  it('should render every metric', () => {
    const fixture = TestBed.createComponent(MetricsSectionComponent);
    fixture.componentRef.setInput('metrics', [
      { id: 'experience', value: '10', label: 'anos de experiência' },
      { id: 'projects', value: '150+', label: 'projetos realizados' },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('150+');
  });
});
