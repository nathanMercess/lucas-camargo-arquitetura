import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonModule } from 'primeng/button';

import { PortfolioCategory } from '../../../../shared/models/portfolio-category.model';
import { PortfolioAccordionComponent } from './portfolio-accordion.component';

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
      imports: [ButtonModule],
      declarations: [PortfolioAccordionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioAccordionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();
  });

  it('should select the first category initially', () => {
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
