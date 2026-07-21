import { Injectable, signal } from '@angular/core';
import { ContactChannel } from '../../../shared/models/contact-channel.model';
import { FooterLink } from '../../../shared/models/footer-link.model';
import { Metric } from '../../../shared/models/metric.model';
import { NavigationItem } from '../../../shared/models/navigation-item.model';
import { PortfolioCategory } from '../../../shared/models/portfolio-category.model';
import { PracticeArea } from '../../../shared/models/practice-area.model';
import { Profile } from '../../../shared/models/profile.model';

@Injectable({
  providedIn: 'root',
})
export class PublicSiteContentService {
  public readonly navigationItems = signal<readonly NavigationItem[]>([
    { id: 'practice', label: 'Serviços', href: '#atuacao' },
    { id: 'portfolio', label: 'Portfólio', href: '#portfolio' },
    { id: 'about', label: 'Sobre', href: '#sobre' },
    { id: 'contact', label: 'Contato', href: '#contato' },
  ]);

  public readonly practiceAreas = signal<readonly PracticeArea[]>([
    {
      id: 'architecture',
      index: '01',
      title: 'Arquitetura',
      description:
        'Projetos orientados pelos objetivos de cada cliente, com atenção à identidade, ao uso e à qualidade dos espaços.',
    },
    {
      id: 'construction',
      index: '02',
      title: 'Construção',
      description:
        'Obras conduzidas com excelência e cuidado para transformar o projeto em um espaço fiel ao que foi imaginado.',
    },
  ]);

  public readonly portfolioCategories = signal<readonly PortfolioCategory[]>([
    {
      id: 'projects',
      index: 'A / 01',
      title: 'Projetos',
      description:
        'Concepção, estudo e detalhamento de espaços que traduzem objetivos em soluções arquitetônicas.',
      visualClass: 'portfolio-accordion-panel--projects',
    },
    {
      id: 'construction-work',
      index: 'A / 02',
      title: 'Obras',
      description:
        'A materialização dos projetos, acompanhada com atenção aos detalhes, à execução e à qualidade.',
      visualClass: 'portfolio-accordion-panel--construction',
    },
  ]);

  public readonly metrics = signal<readonly Metric[]>([
    { id: 'experience', value: '10', label: 'anos de atuação' },
    { id: 'dreams', value: '150+', label: 'sonhos entregues' },
    { id: 'area', value: '20+ mil m²', label: 'projetados' },
  ]);

  public readonly profile = signal<Profile>({
    name: 'Lucas Camargo',
    professionalTitle: 'Arquiteto',
    biography:
      'Entender os objetivos de cada cliente e valorizar seus sonhos é o ponto de partida. O trabalho é conduzido com excelência e qualidade, do primeiro traço à construção.',
  });

  public readonly contactChannels = signal<readonly ContactChannel[]>([
    {
      id: 'phone',
      label: 'Telefone',
      value: '+55 11 98668—1572',
      href: 'tel:+5511986681572',
    },
    {
      id: 'email',
      label: 'E-mail',
      value: 'arquiteto@lucascamargo.com',
      href: 'mailto:arquiteto@lucascamargo.com',
    },
    {
      id: 'location',
      label: 'Localização',
      value: 'São Caetano do Sul — SP',
    },
  ]);

  public readonly footerLinks = signal<readonly FooterLink[]>([
    {
      id: 'budget',
      label: 'Solicitar um orçamento',
      href: 'mailto:arquiteto@lucascamargo.com?subject=Solicitação%20de%20orçamento',
    },
    { id: 'projects', label: 'Projetos', href: '#portfolio' },
    {
      id: 'partners',
      label: 'Parcerias',
      href: 'mailto:arquiteto@lucascamargo.com?subject=Parcerias',
    },
    {
      id: 'suppliers',
      label: 'Fornecedores',
      href: 'mailto:arquiteto@lucascamargo.com?subject=Fornecedores',
    },
    {
      id: 'careers',
      label: 'Trabalhe conosco',
      href: 'mailto:arquiteto@lucascamargo.com?subject=Trabalhe%20conosco',
    },
  ]);
}
