import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { DEFAULT_SITE_CONFIG } from '../../../../shared/config/default-site-config';
import { PortfolioProject } from '../../../../shared/models/portfolio-project.model';
import { PortfolioGridComponent } from './portfolio-grid.component';

const project: PortfolioProject = {
  id: 'residencia-teste',
  slug: 'residencia-teste',
  title: 'Residência Teste',
  summary: 'Resumo publicado para o teste da grade.',
  description: ['Descrição do projeto.'],
  categoryIds: ['projects'],
  cover: {
    assetId: 'architecture-reference',
    alt: 'Fachada da residência',
    decorative: false,
    focalPointX: 45,
    focalPointY: 55,
  },
  gallery: [],
  location: 'São Paulo, SP',
  year: '2026',
  services: ['Arquitetura'],
  order: 10,
  visible: true,
  seo: {
    title: 'Residência Teste | Lucas Camargo',
    description: 'Descrição para mecanismos de busca.',
    canonicalPath: '/portfolio/projeto/residencia-teste',
    imageMediaId: 'architecture-reference',
    noIndex: false,
  },
};

describe('PortfolioGridComponent', () => {
  let fixture: ComponentFixture<PortfolioGridComponent>;
  let component: PortfolioGridComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      declarations: [PortfolioGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioGridComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projects', [project]);
    fixture.componentRef.setInput('categories', DEFAULT_SITE_CONFIG.portfolioCategories);
    fixture.componentRef.setInput('mediaAssets', DEFAULT_SITE_CONFIG.media);
    fixture.componentRef.setInput('mediaPaths', {
      'architecture-reference': '/assets/editorial/architecture-reference.jpg',
    });
    fixture.detectChanges();
  });

  it('should derive a card from project, category and media contracts', () => {
    expect(component.cards()).toEqual([
      expect.objectContaining({
        project,
        coverSrc: '/assets/editorial/architecture-reference.jpg',
        coverWidth: 2200,
        coverHeight: 1467,
      }),
    ]);
    expect(component.cards()[0].categories.map((category) => category.id)).toEqual(['projects']);
  });

  it('should link the card to the published project slug', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/portfolio/projeto/residencia-teste');
    expect(link.textContent).toContain('Residência Teste');
  });

  it('should omit a card whose media cannot be resolved safely', () => {
    fixture.componentRef.setInput('mediaPaths', {});
    fixture.detectChanges();

    expect(component.cards()).toEqual([]);
  });
});
