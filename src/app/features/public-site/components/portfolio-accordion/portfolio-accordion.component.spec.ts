import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { PortfolioCategory } from '../../../../shared/models/portfolio-category.model';
import { PortfolioAccordionComponent } from './portfolio-accordion.component';

const portfolioConfig = DEFAULT_SITE_CONFIG.sections.find(
  (section) => section.type === 'portfolio',
);

if (!portfolioConfig)
  throw new Error('A configuração padrão do portfólio é obrigatória.');

describe('PortfolioAccordionComponent', () => {
  let fixture: ComponentFixture<PortfolioAccordionComponent>;
  let component: PortfolioAccordionComponent;

  const categories: readonly PortfolioCategory[] = [
    {
      id: 'projects',
      index: '01',
      title: 'Projetos',
      description: 'Projetos arquitetônicos.',
      visualClass: 'portfolio-accordion-panel--projects',
    },
    {
      id: 'construction-work',
      index: '02',
      title: 'Obras',
      description: 'Obras realizadas.',
      visualClass: 'portfolio-accordion-panel--construction',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule, RouterModule.forRoot([])],
      declarations: [PortfolioAccordionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioAccordionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', portfolioConfig);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('uiLabels', DEFAULT_SITE_CONFIG.uiLabels);
    fixture.componentRef.setInput('mediaPaths', {});
    fixture.detectChanges();
  });

  it('should select the first configured category initially', () => {
    expect(component.activeCategoryId()).toBe('projects');
  });

  it('should change the active category through interaction', () => {
    component.selectCategory('construction-work');

    expect(component.activeCategoryId()).toBe('construction-work');
  });

  it('should ignore an unknown category', () => {
    component.selectCategory('unknown');

    expect(component.activeCategoryId()).toBe('projects');
  });
});
