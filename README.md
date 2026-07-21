# Lucas Camargo — Arquitetura e Construção

Site institucional, portfólio e plataforma de administração de conteúdo para Lucas Camargo. O projeto segue o brand kit e o `SITE.pdf`, usa Angular com NgModules e permite editar e publicar o conteúdo suportado sem recompilar o frontend.

## URLs

| Ambiente | URL | Situação |
| --- | --- | --- |
| Produção | [lucascamargo.com](https://lucascamargo.com) | HTTPS validado |
| Produção com `www` | [www.lucascamargo.com](https://www.lucascamargo.com) | HTTPS validado |
| Cloud Run | [lucas-camargo-site-373724198767.us-central1.run.app](https://lucas-camargo-site-373724198767.us-central1.run.app) | URL técnica estável |
| Administração | [lucas-camargo-admin-373724198767.us-central1.run.app](https://lucas-camargo-admin-373724198767.us-central1.run.app) | Protegida por Google IAP |
| Conteúdo | [lucas-camargo-content.nathan66merces.workers.dev](https://lucas-camargo-content.nathan66merces.workers.dev/content/manifest.json) | Worker público somente leitura |

O domínio já responde em qualquer dispositivo. O DNS continua na Hostinger, sem custo de Cloud DNS; os registros e cuidados de manutenção estão em [`docs/cloud-run.md`](docs/cloud-run.md).

## O que está implementado

### Site público

- Home editorial responsiva, baseada integralmente em `SiteConfigV1`.
- Header, navegação, hero, manifesto, atuação, portfólio, indicadores, perfil, processo, contato e footer configuráveis.
- Ordem e visibilidade das seções controladas pelo conteúdo.
- Tema restrito aos limites seguros da identidade visual.
- SEO, Open Graph, Twitter Card, canonical, favicon e JSON-LD atualizados em runtime.
- Cache local com fallback validado quando a origem do conteúdo estiver indisponível.
- Verificação SHA-256 do JSON publicado antes de aplicar qualquer alteração em runtime.
- Rotas `/portfolio`, `/portfolio/categoria/:categoryId` e `/portfolio/projeto/:slug`.
- Grid responsivo, filtro por categoria, página de projeto e lightbox fullscreen com PrimeNG Galleria.
- Estados seguros para carregamento, acervo vazio, conteúdo inválido, projeto oculto e mídia ausente.
- Nenhum projeto ou fotografia fictícia foi incluído.
- Animações discretas e compatíveis com `prefers-reduced-motion`.

### Painel administrativo

- Aplicação Angular separada e protegida por IAP.
- Sessão e permissões obtidas da API, sem login próprio ou senha no projeto.
- Edição da estrutura global e das oito seções atuais.
- Rich text tipado, links seguros, listas, ordem, visibilidade e referências de mídia.
- CRUD de categorias e projetos, associação muitos-para-muitos, galeria, capa e SEO.
- Biblioteca de mídia com upload direto por URL assinada, SHA-256, dimensões e validação de assinatura do arquivo.
- Preview responsivo, histórico de releases, publicação e rollback.
- Quatro templates aplicáveis sem perder conteúdo: Editorial, Galeria, Minimal e Contraste.
- Auditoria consultável no painel.
- PrimeNG usado nos controles compatíveis; a apresentação continua alinhada à marca.

### API e publicação

- Fastify/TypeScript no mesmo contêiner do painel.
- Autenticação IAP, allowlist do proprietário e RBAC no backend.
- Proteção CSRF, validação exata de origem, CSP e headers defensivos.
- JSON Schema fechado e validação semântica de IDs, ordens e referências.
- Rascunho privado com `If-None-Match`/`If-Match` e ETags.
- Releases imutáveis em `versions/{release-id}/site.json`.
- Troca condicional de `published/manifest.json` e rollback sem regravar versões.
- Auditoria redundante no R2 e no Cloud Logging.
- Worker público somente leitura, sem listagem e sem credenciais no navegador.

## Arquitetura

```text
Visitante
  -> Angular público no Cloud Run
  -> Worker público GET/HEAD
  -> bucket R2 publicado

nathan66merces@gmail.com
  -> IAP
  -> painel Angular + API no Cloud Run
  -> rascunhos, auditoria e releases no R2
  -> upload de mídia por URL assinada de curta duração
```

Não há banco de dados. O estado editorial é um JSON tipado e versionado; imagens usam chaves por SHA-256. O frontend lê o manifest em runtime, confirma o SHA-256 do release e só então aplica o conteúdo. Assim, 100% do conteúdo previsto no catálogo atual — inclusive projetos, mídia, SEO, ordem das seções, tema e templates — é dinâmico: uma edição comum passa por rascunho e publicação no painel sem novo build ou deploy.

O workspace contém dois aplicativos independentes em build, contêiner, serviço e escala:

| Aplicativo | Projeto Angular/API | Serviço |
| --- | --- | --- |
| Site público | `lucas-camargo-arquitetura` | `lucas-camargo-site` |
| Administração | `admin` + `@lucas-camargo/admin-api` | `lucas-camargo-admin` |

Eles compartilham somente os contratos tipados necessários. Uma falha ou publicação de um serviço não substitui a revisão do outro.

“Totalmente dinâmico” significa que todo conteúdo e composição suportados pelo catálogo atual são administráveis: textos, mídia, SEO, navegação, seções, tema permitido, categorias, projetos e galerias. HTML, CSS e JavaScript arbitrários não são aceitos. Um comportamento visual ou tipo de bloco realmente novo continua exigindo código, testes e revisão.

## Segurança e custo

| Controle | Implementação |
| --- | --- |
| Conta humana no GCP | somente `nathan66merces@gmail.com` |
| Site público | service account sem papéis adicionais |
| Painel | Cloud Run privado, IAP e proprietário único |
| Segredos R2 | Google Secret Manager, nunca no Angular ou Git |
| Worker | binding de leitura do bucket publicado |
| Concorrência | ETags e escritas condicionais |
| Auditoria | R2 + logs estruturados do Cloud Run |
| Escala pública | mínimo 0, máximo 3, 128 MiB |
| Escala admin | mínimo 0, máximo 1, concorrência 4, 256 MiB |
| Banco | nenhum |
| DNS pago no Google | nenhum; DNS permanece na Hostinger |

O projeto GCP é `lucas-camargo-arq-prod`, na região `us-central1`, com orçamento de R$ 20 e alertas. Alertas não bloqueiam cobrança; os limites de escala são a proteção técnica inicial.

Detalhes:

- [`docs/access-control-audit.md`](docs/access-control-audit.md)
- [`docs/storage-r2.md`](docs/storage-r2.md)
- [`docs/cloud-run.md`](docs/cloud-run.md)
- [`docs/admin.md`](docs/admin.md)
- [`docs/github-actions.md`](docs/github-actions.md)

## Stack

- Angular 21 com NgModules, TypeScript estrito, SCSS e signals.
- PrimeNG 21, importado por feature.
- Vitest e ESLint.
- Fastify 5 e AWS SDK v3 para a API administrativa.
- Cloud Run, Artifact Registry, IAP e Secret Manager.
- Cloudflare Worker e R2/S3.
- GitHub Actions com Workload Identity Federation, sem chave JSON do Google.
- Yarn Classic 1.22.22; não usar npm ou pnpm.

## Organização

```text
src/app/                         # aplicação Angular pública
|-- features/public-site/        # home, portfólio e páginas públicas
`-- shared/                      # config e models compartilhados

projects/admin/src/app/          # segunda aplicação Angular: painel
server/admin-api/src/            # API empacotada com o painel
cloudflare/content-worker/       # acesso público somente leitura
public/content/                  # fallback inicial validado
deploy/                          # Cloud Run, domínio e runtime config
docs/                            # decisões operacionais e de segurança
```

## Desenvolvimento local

Pré-requisitos:

- Node.js `^20.19`, `^22.12` ou `^24` para Angular e API.
- Node.js 22 ou 24 para o Wrangler e `yarn run check:all`.
- Yarn Classic 1.22.22.

Instalação e site público:

```powershell
yarn install --frozen-lockfile
yarn start
```

O site fica em `http://localhost:4200`.

Painel com API em memória:

```powershell
yarn build:admin-api
$env:NODE_ENV = 'development'
$env:AUTH_MODE = 'development'
$env:STORAGE_DRIVER = 'memory'
$env:SERVE_ADMIN_STATIC = 'false'
yarn start:admin-api
```

Em outro terminal:

```powershell
yarn start:admin
```

O painel fica em `http://localhost:4201`; o Angular encaminha `/api` para `127.0.0.1:8080`. O armazenamento em memória é somente para desenvolvimento e é perdido quando a API reinicia.

Validação completa da aplicação:

```powershell
yarn run check
```

Com Node.js 22 ou 24, o gate de todo o monorepo também instala e valida o pacote isolado do Worker:

```powershell
yarn run check:all
```

Validação isolada do Worker, usando Node.js 22 ou 24:

```powershell
cd cloudflare/content-worker
yarn install --frozen-lockfile
yarn run check
yarn audit
```

## Tutorial resumido do painel

1. Acesse o [painel administrativo](https://lucas-camargo-admin-373724198767.us-central1.run.app) com `nathan66merces@gmail.com` e conclua a autenticação do Google.
2. Em **Conteúdo do site**, altere identidade, navegação, seções, contatos, SEO ou tema; em **Projetos**, mantenha categorias e projetos.
3. Em **Mídia**, envie as imagens e aguarde a confirmação de integridade antes de referenciá-las.
4. Opcionalmente, abra **Templates** e aplique Editorial, Galeria, Minimal ou Contraste. O template altera a composição visual, não os textos nem o acervo.
5. Use **Salvar rascunho** e confira o preview responsivo. Nada muda no site público nessa etapa.
6. Em **Publicações**, publique o rascunho. O site passa a ler o novo release em runtime, sem rebuild ou redeploy.
7. Se necessário, selecione uma versão anterior no histórico e execute o rollback. Consulte **Auditoria** para identificar autor, operação e horário.

O fluxo completo e as regras de segurança estão em [`docs/admin.md`](docs/admin.md).

## Deploy

O caminho normal é automático: cada push ou merge em `main` valida e publica, de forma independente, o site público, o admin/API e o Worker. A autenticação no Google usa Workload Identity Federation, sem chave JSON. Veja [`docs/github-actions.md`](docs/github-actions.md).

Os scripts abaixo permanecem disponíveis para recuperação ou publicação manual controlada.

Site público:

```powershell
.\deploy\cloud-run.ps1
```

Domínio:

```powershell
.\deploy\domain-mapping.ps1
```

Worker e buckets: siga [`cloudflare/content-worker/README.md`](cloudflare/content-worker/README.md). As credenciais S3 têm acesso somente aos buckets `lucas-camargo-private` e `lucas-camargo-published` e ficam no Secret Manager, sem passar pelo chat ou pelo repositório.

Painel:

```powershell
.\deploy\admin-cloud-run.ps1 -PublishedBaseUrl 'https://lucas-camargo-content.nathan66merces.workers.dev/content'
```

O script mantém o serviço privado e o acesso IAP somente para `nathan66merces@gmail.com`.

## Regras obrigatórias

[`BOAS-PRATICAS.md`](BOAS-PRATICAS.md) é a fonte de verdade do projeto e [`AGENTS.md`](AGENTS.md) exige sua leitura antes de qualquer alteração. Entre outras regras:

- models compartilhados em `src/app/shared/models`;
- uma declaração de model por arquivo;
- indentação Visual Studio com 2 espaços e templates compactos;
- corpo de `if` simples na linha seguinte, sem chaves;
- NgModules e `ChangeDetectionStrategy.OnPush`;
- PrimeNG consultado e preferido antes de controles próprios;
- sem Prettier;
- somente Yarn;
- `yarn run check` antes de concluir.

## Materiais e pendências editoriais

O produto foi definido a partir de `BOAS-PRATICAS.md`, `BRAND KIT - LUCAS CAMARGO.pdf` e `SITE.pdf`. Os PDFs não são versionados no repositório.

Ainda dependem do proprietário do conteúdo:

- fotografias reais de projetos, obras e perfil;
- logos finais em SVG, caso existam versões melhores que os assets extraídos;
- arquivos web licenciados da Century Gothic ou aprovação definitiva do fallback;
- textos e metadados finais dos projetos;
- decisão sobre formulário, mapa, analytics e conteúdo bilíngue.

Até esses materiais chegarem, o projeto preserva os assets oficiais fornecidos e não inventa trabalhos do arquiteto.
