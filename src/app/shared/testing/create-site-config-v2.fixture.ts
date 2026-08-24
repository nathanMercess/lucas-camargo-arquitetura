import { DEFAULT_SITE_CONFIG } from '../config/default-site-config';
import { SiteConfigV2 } from '../models/site-config-v2.model';

export function createSiteConfigV2Fixture(): SiteConfigV2 {
  const hero = DEFAULT_SITE_CONFIG.sections.find((section) => section.type === 'hero');

  if (!hero)
    throw new Error('The bundled fixture must provide a hero section.');

  return {
    schemaVersion: 2,
    releaseId: 'remote-v2',
    publishedAt: '2026-08-24T12:00:00.000Z',
    locale: DEFAULT_SITE_CONFIG.locale,
    identity: DEFAULT_SITE_CONFIG.identity,
    seo: DEFAULT_SITE_CONFIG.seo,
    theme: DEFAULT_SITE_CONFIG.theme,
    uiLabels: DEFAULT_SITE_CONFIG.uiLabels,
    media: DEFAULT_SITE_CONFIG.media,
    header: DEFAULT_SITE_CONFIG.header,
    navigationItems: DEFAULT_SITE_CONFIG.navigationItems,
    portfolioCategories: DEFAULT_SITE_CONFIG.portfolioCategories,
    projects: DEFAULT_SITE_CONFIG.projects,
    footer: DEFAULT_SITE_CONFIG.footer,
    contact: {
      email: 'arquiteto@lucascamargo.com',
      phoneLabel: '11 98668-1572',
      phoneE164: '+5511986681572',
      instagramUrl: 'https://www.instagram.com/lucascamargo.arquiteto/',
      whatsappNumber: '5511986681572',
      whatsappDefaultMessage: 'Olá, gostaria de conversar sobre um projeto.',
    },
    pages: [
      {
        id: 'home',
        slug: 'home',
        path: '/',
        order: 10,
        visible: true,
        seo: {
          title: DEFAULT_SITE_CONFIG.seo.title,
          description: DEFAULT_SITE_CONFIG.seo.description,
          canonicalPath: '/',
          imageMediaId: DEFAULT_SITE_CONFIG.seo.openGraph.imageMediaId,
          noIndex: false,
        },
        sections: [
          hero,
          {
            id: 'project-grid',
            type: 'project-grid',
            order: 20,
            visible: true,
            anchor: 'projetos',
            variant: 'grid-v1',
            overline: 'Portfólio',
            title: {
              lines: [
                {
                  segments: [{ text: 'Projetos selecionados', emphasis: false }],
                },
              ],
            },
            description: ['Uma seleção de projetos publicados.'],
            projectIds: [],
            maxColumns: 3,
          },
          {
            id: 'whatsapp-contact',
            type: 'whatsapp-cta',
            order: 30,
            visible: true,
            anchor: 'whatsapp',
            variant: 'editorial-v1',
            overline: 'Contato',
            title: {
              lines: [
                {
                  segments: [{ text: 'Vamos conversar?', emphasis: false }],
                },
              ],
            },
            body: ['Conte brevemente o que você deseja construir.'],
            label: 'Conversar pelo WhatsApp',
            message: 'Olá, gostaria de iniciar uma conversa.',
          },
          {
            id: 'contact-form',
            type: 'contact-form',
            order: 40,
            visible: true,
            anchor: 'formulario',
            variant: 'default-v1',
            overline: 'Solicite um contato',
            title: {
              lines: [
                {
                  segments: [{ text: 'Conte sobre seu projeto', emphasis: false }],
                },
              ],
            },
            description: ['Preencha os campos e retornaremos o contato.'],
            nameLabel: 'Nome',
            emailLabel: 'E-mail',
            phoneLabel: 'Telefone',
            subjectLabel: 'Assunto',
            messageLabel: 'Mensagem',
            submitLabel: 'Enviar mensagem',
            successMessage: 'Mensagem enviada com sucesso.',
            errorMessage: 'Não foi possível enviar a mensagem. Tente novamente mais tarde.',
            privacyNotice: 'Seus dados serão usados somente para responder a esta solicitação.',
          },
        ],
      },
    ],
  };
}
