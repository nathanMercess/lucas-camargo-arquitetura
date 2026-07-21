import { TestBed } from '@angular/core/testing';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { MetricsSectionConfig } from '../../../../shared/models/metrics-section-config.model';
import { MetricsSectionComponent } from './metrics-section.component';

const defaultMetricsConfig = DEFAULT_SITE_CONFIG.sections.find(
  (section) => section.type === 'metrics',
);

if (!defaultMetricsConfig)
  throw new Error('A configuração padrão de indicadores é obrigatória.');

describe('MetricsSectionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetricsSectionComponent],
    }).compileComponents();
  });

  it('should render every configured metric', () => {
    const config: MetricsSectionConfig = {
      ...defaultMetricsConfig,
      metrics: [
        { id: 'experience', value: '10', label: 'anos de experiência' },
        { id: 'projects', value: '150+', label: 'projetos realizados' },
      ],
    };
    const fixture = TestBed.createComponent(MetricsSectionComponent);

    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('150+');
  });
});
