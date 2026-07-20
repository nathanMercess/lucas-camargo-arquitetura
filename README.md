# Lucas Camargo - Arquitetura e Construção

Fundação técnica do novo site institucional e portfólio de Lucas Camargo. O produto será uma experiência minimalista, centrada em imagens, com conteúdo administrável e identidade visual fiel ao brand kit.

> Status: etapa 2 em andamento - fundação técnica concluída e primeira versão responsiva da Home implementada.

## Implementação atual

- Home full-screen com navegação responsiva, atuação, portfólio, indicadores, perfil, contato e footer.
- Conteúdo inicial centralizado em `PublicSiteContentService` com signals, preparado para substituição por API ou CMS.
- Portfólio com acordeão horizontal acessível, inspirado na referência da página 3 do `SITE.pdf`:
  - uma categoria expandida por vez;
  - seleção por hover, foco ou clique;
  - alternância automática a cada seis segundos;
  - controle explícito para pausar e retomar;
  - animação desativada quando `prefers-reduced-motion` estiver ativo;
  - adaptação vertical para telas menores.
- Logo primário e monocromático claro extraídos do brand kit fornecido, preservando proporção e composição aprovadas.
- Áreas de imagem usam composições abstratas temporárias. Fotos reais de projetos, obras e perfil ainda precisam ser fornecidas e não devem ser substituídas por trabalhos fictícios.

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
- PrimeNG 21, carregando somente os módulos utilizados e em modo `unstyled` para preservar o brand kit.
- SCSS.
- Signals e `computed` para estado reativo e derivações.
- Vitest para testes unitários.
- ESLint para análise estática.
- EditorConfig e ESLint para padronização e análise estática.
- Yarn Classic 1.22.22.

O Angular 21 foi escolhido por estar em suporte e ser compatível com o runtime disponível. A migração para uma versão principal mais nova deve seguir a matriz oficial de compatibilidade entre Angular, Node.js e TypeScript.

## Organização planejada

```text
src/app/
|-- app/
|   `-- app.component.*   # shell raiz da aplicação e do roteamento
|-- app.module.ts
|-- app-routing.module.ts
|-- core/                 # infraestrutura global e integrações
|-- shared/
|   `-- models/           # contratos compartilhados pelo site público e pelo painel
`-- features/
    |-- public-site/      # experiência pública e composição das seções
    |-- portfolio/        # categorias, álbuns, galeria e lightbox
    `-- administration/  # edição de conteúdo e mídia, com acesso protegido
```

Cada feature deve manter o componente raiz, módulo e serviço de orquestração no primeiro nível. Domínios especializados ficam em `components/<domain>`, com seus próprios `models`, `services` e `base` quando houver reutilização real.

## Regras obrigatórias de desenvolvimento

O guia [BOAS-PRATICAS.md](./BOAS-PRATICAS.md) está versionado na raiz e é a fonte de verdade obrigatória para qualquer implementação ou revisão. O `AGENTS.md` exige sua leitura antes de alterações futuras.

Resumo dos critérios de aceite:

- Arquivos e pastas em `kebab-case`.
- Cada interface, type, enum ou classe de modelo deve ficar em seu próprio arquivo; é proibido agrupar múltiplas declarações de domínio no mesmo arquivo.
- Models compartilhados entre o site público e o painel administrativo devem ficar em `src/app/shared/models`.
- Não criar arquivos agregadores (`barrel files`) sem uma necessidade comprovada de API pública.
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
- Models exclusivos de uma única feature permanecem dentro do domínio proprietário.
- Templates e TypeScript seguem a indentação padrão Visual Studio documentada no guia; o fechamento da abertura de uma tag nunca fica isolado em outra linha.
- O corpo de um `if` com uma única instrução fica obrigatoriamente na linha seguinte, sem chaves e com mais 2 espaços de indentação.
- Antes de criar um controle de interface, consultar a documentação oficial do PrimeNG e verificar se existe um componente compatível.
- Quando o PrimeNG atender aos requisitos funcionais, visuais e de acessibilidade, seu uso é obrigatório; uma implementação própria exige uma limitação objetiva e documentada.
- Importar somente o módulo específico do PrimeNG consumido pela feature; não criar um módulo global com toda a biblioteca.
- Preservar a identidade visual com PrimeNG em modo `unstyled` ou por tokens do tema, sem aceitar estilos padrão que contrariem o brand kit.
- Não manter código morto, exports sem consumidor, dependências sem uso, pastas vazias preventivas ou configurações de ferramentas incompatíveis com a stack atual.
- Criar abstrações, pastas e dependências somente quando houver uso real no escopo implementado.
- Testes para services, regras derivadas, componentes interativos e fluxos de modal.

## Como executar

### Pré-requisitos

- Node.js compatível com Angular 21: `^20.19.0`, `^22.12.0` ou `^24.0.0`.
- Yarn Classic 1.22.22.

### Comandos

```bash
yarn install
yarn start
```

O servidor local fica disponível por padrão em `http://localhost:4200`.

```bash
yarn lint
yarn test
yarn build
yarn run check
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

- [Em andamento] Implementar grid, tipografia, espaçamento, breakpoints e componentes básicos.
- [Concluído na primeira versão] Construir header, navegação, seções full-screen e footer.
- [Em andamento] Validar responsividade, teclado, contraste e movimento reduzido.

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
