# Lucas Camargo - Arquitetura e Construção

Fundação técnica do novo site institucional e portfólio de Lucas Camargo. O produto será uma experiência minimalista, centrada em imagens, com conteúdo administrável e identidade visual fiel ao brand kit.

> Status: etapa 1 concluída - projeto Angular, padrões técnicos e escopo inicial documentados.

## Visão do produto

Apresentar projetos e obras com qualidade editorial, transmitir a identidade do escritório e facilitar o contato de potenciais clientes. A experiência deve refletir a missão da marca: entender os objetivos dos clientes, valorizar seus sonhos e atendê-los com excelência e qualidade.

## Escopo funcional

### Site público

- Home em tela cheia.
- Serviços.
- Portfólio com as categorias iniciais `Projetos` e `Obras`.
- Uma página para cada categoria, com capa configurável.
- Feed de álbuns; cada álbum representa um projeto ou uma obra.
- Página própria para cada álbum, com múltiplas fotos.
- Lightbox ao ampliar uma foto, com controles de próxima/anterior e suporte a teclado.
- Efeito de hover nas capas: imagem colorida, escurecida, levemente ampliada e nome centralizado.
- Área de indicadores entre o portfólio e a seção Sobre:
  - `10 anos de atuação`;
  - `150+ sonhos entregues`;
  - `20+ mil m² projetados`.
- Sobre mim com foto, nome, título profissional e texto editáveis.
- Contato com listas editáveis de telefones e e-mails.
- Localização inicialmente por cidade e estado, preparada para endereço completo no futuro.
- Footer com links, texto, assinatura em PNG, identificadores e ícones de redes sociais.

### Conteúdo administrável

O painel administrativo deverá permitir:

- editar textos, títulos e links;
- alterar a ordem das seções;
- criar, ocultar e excluir seções;
- escolher o background de cada página ou seção;
- criar categorias futuras;
- associar um álbum a uma ou mais categorias;
- escolher a foto de capa de categorias e álbuns;
- criar, editar, ordenar e excluir álbuns e fotos;
- editar indicadores, perfil, contatos, redes sociais e footer.

O Angular cobre a interface. Persistência, autenticação, autorização, armazenamento de imagens e publicação de conteúdo dependerão de uma API ou CMS, que será definido antes da implementação do painel.

## Direção visual obrigatória

### Paleta

| Token                   | Cor       | Uso                                                   |
| ----------------------- | --------- | ----------------------------------------------------- |
| `--brand-ink`           | `#333332` | Base para textos e ilustrações                        |
| `--brand-accent`        | `#E36571` | Destaques, anotações, ícones e atenção, com moderação |
| `--brand-surface-muted` | `#F5F4F4` | Backgrounds e sombreamento suave                      |
| `--brand-surface`       | `#FFFFFF` | Background principal e contraste                      |

A distribuição visual de referência é 50% branco, 30% cinza claro, 10% grafite e 10% rosa/vermelho.

### Tipografia

- Century Gothic em títulos, textos, botões e materiais promocionais.
- Courier New somente em documentos administrativos, não como fonte principal do site.
- Enquanto os arquivos web licenciados da fonte não forem adicionados, o projeto usa uma pilha de fontes de sistema com Century Gothic como primeira opção.

### Logo e composição

- Não inclinar, rotacionar, reorganizar, contornar ou recolorir a marca fora das versões aprovadas.
- Não inserir o logo em caixas nem mover a logomarca em relação à marca nominativa.
- Não usar apenas a marca nominativa.
- Preservar o respiro definido no brand kit, equivalente a 20% do módulo de construção em cada lado.
- Respeitar as dimensões mínimas de 100 px para o logo completo e 20 px para a logomarca.
- Usar versões claras em fundos escuros e versões escuras em fundos claros.

### Interface

- Visual minimalista.
- Caixas de texto sem bordas ou sombras decorativas.
- Imagens com cantos de 90 graus, sem arredondamento.
- Seções de capa podem ocupar a altura total da viewport.
- Transições devem ser discretas e respeitar `prefers-reduced-motion`.
- O layout de categorias pode distribuir capas horizontalmente e ampliar a seção em foco no hover, com alternativa acessível para toque e teclado.

## Dados iniciais fornecidos

- Telefone: `11 98668-1572`.
- E-mail: `arquiteto@lucascamargo.com`.
- Localização: São Caetano do Sul - SP.

Esses valores devem ser tratados como conteúdo inicial editável, não como constantes espalhadas em componentes.

## Stack inicial

- Angular 21 LTS com NgModules.
- TypeScript em modo estrito.
- Angular Router.
- SCSS.
- Signals e `computed` para estado reativo e derivações.
- Vitest para testes unitários.
- ESLint para análise estática.
- Prettier e EditorConfig para formatação.
- pnpm 11.

O Angular 21 foi escolhido por estar em suporte e ser compatível com o runtime disponível. A migração para uma versão principal mais nova deve seguir a matriz oficial de compatibilidade entre Angular, Node.js e TypeScript.

## Organização planejada

```text
src/app/
|-- app.component.*
|-- app.module.ts
|-- app-routing.module.ts
|-- core/                 # infraestrutura global e integrações
|-- shared/               # componentes e utilitários realmente reutilizáveis
`-- features/
    |-- public-site/      # experiência pública e composição das seções
    |-- portfolio/        # categorias, álbuns, galeria e lightbox
    `-- administration/  # edição de conteúdo e mídia, com acesso protegido
```

Cada feature deve manter o componente raiz, módulo e serviço de orquestração no primeiro nível. Domínios especializados ficam em `components/<domain>`, com seus próprios `models`, `services` e `base` quando houver reutilização real.

## Regras de desenvolvimento

- Arquivos e pastas em `kebab-case`.
- Componentes com sufixo `.component`, template e SCSS externos e `ChangeDetectionStrategy.OnPush`.
- Novos inputs e outputs com `input`, `model` e `output` quando aplicável.
- Estado compartilhado e comunicação HTTP em services; componentes cuidam de apresentação e interação.
- Estado com `signal`, valores derivados com `computed` e atualizações imutáveis.
- Guard clauses para pré-condições.
- Requests, responses e conteúdo serializado sempre tipados.
- Operações HTTP de resposta única com `take(1)` e loading encerrado por `finalize`.
- Templates com `@if`, `@for` com `track` estável e `@switch`.
- Todo texto visível e estático marcado com `i18n`.
- Classes-base somente quando houver comportamento realmente repetido.
- Modelos locais permanecem dentro do domínio proprietário até existir reutilização real.
- Testes para services, regras derivadas, componentes interativos e fluxos de modal.

## Como executar

### Pré-requisitos

- Node.js compatível com Angular 21: `^20.19.0`, `^22.12.0` ou `^24.0.0`.
- pnpm 11.

### Comandos

```bash
pnpm install
pnpm start
```

O servidor local fica disponível por padrão em `http://localhost:4200`.

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm check
```

## Modelo de conteúdo preliminar

- `Section`: tipo, ordem, visibilidade, título, texto, links e background.
- `Category`: título, slug, descrição, capa e estado de publicação.
- `Album`: título, slug, descrição, capa, categorias, localização, data e fotos.
- `MediaAsset`: arquivo, texto alternativo, legenda, dimensões e ordem.
- `Metric`: valor, sufixo, rótulo e ordem.
- `Profile`: nome, título profissional, biografia e foto.
- `ContactChannel`: tipo, valor, rótulo, link e ordem.
- `SocialLink`: rede, identificador, URL, ícone e ordem.
- `FooterLink`: texto, URL, destino e ordem.

A relação entre álbuns e categorias é muitos-para-muitos, pois um mesmo álbum pode receber mais de uma categoria.

## Roadmap

### 0. Fundação técnica - concluída

- Scaffold Angular estrito com rotas, SCSS, módulos e testes.
- Convenções do guia configuradas nos schematics.
- Tokens iniciais da marca.
- README de produto, arquitetura e execução.
- Repositório Git privado.

### 1. Descoberta e conteúdo

- Receber os arquivos finais do logo em SVG e suas variações aprovadas.
- Receber a fonte web com licença de uso ou definir fallback aprovado.
- Inventariar textos, serviços, categorias, álbuns, fotos e redes sociais.
- Confirmar métricas, contatos e links do footer.
- Definir API/CMS, autenticação, armazenamento e fluxo de publicação.

### 2. Sistema visual e estrutura pública

- Implementar grid, tipografia, espaçamento, breakpoints e componentes básicos.
- Construir header, navegação, seções full-screen e footer.
- Validar responsividade, teclado, contraste e movimento reduzido.

### 3. Portfólio

- Implementar categorias, feed, hover, páginas de álbum e lightbox.
- Otimizar imagens responsivas, carregamento, cache e textos alternativos.
- Preparar metadados, URLs e compartilhamento social.

### 4. Administração

- Implementar login e autorização.
- CRUD e ordenação de seções, categorias, álbuns e mídias.
- Preview, rascunho/publicação e validações de upload.
- Edição de perfil, métricas, contatos, redes e footer.

### 5. Qualidade e lançamento

- Testes unitários, integração e end-to-end dos fluxos críticos.
- Auditorias de acessibilidade, desempenho e SEO.
- Analytics e monitoramento, se aprovados.
- Deploy de homologação, revisão com o arquiteto e publicação.

## Decisões pendentes

- API própria ou CMS headless.
- Provedor de hospedagem, imagens e CDN.
- Provedor de mapa e política de consentimento.
- Formulário de orçamento: somente link, e-mail, WhatsApp ou envio pela API.
- Regras de autenticação e número de usuários do painel.
- Conteúdo bilíngue ou apenas português.
- Escopo de SEO local e analytics.
- Licença e arquivos web da Century Gothic.

## Materiais de origem

O escopo foi consolidado a partir de `SITE.pdf`, `BRAND KIT - LUCAS CAMARGO.pdf` e `BOAS-PRATICAS.md`, fornecidos no kickoff. Os PDFs não são versionados neste repositório para evitar publicar arquivos de marca e referências de terceiros sem uma decisão explícita.
