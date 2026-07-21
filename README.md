# Lucas Camargo Arquitetura

Site público de Lucas Camargo Arquitetura. Este repositório contém somente a aplicação Angular pública e o Worker de leitura do conteúdo publicado.

## Projetos relacionados

- `../admin-lucas-camargo-arquitetura`: painel administrativo Angular.
- `../api-lucas-camargo-arquitetura`: API administrativa Fastify.

Os três projetos possuem `package.json`, `yarn.lock`, CI, dependências e builds próprios. O contrato `SiteConfigV1` é versionado em cada consumidor e alterações incompatíveis exigem uma nova versão do schema.

## Desenvolvimento

```powershell
yarn install --frozen-lockfile
yarn start
```

O site abre em `http://localhost:4200`.

## Validação

```powershell
yarn run check
yarn run check:worker
```

## Estrutura

```text
src/                         aplicação Angular pública
public/                      assets e fallback de conteúdo
cloudflare/content-worker/   leitura e cache do conteúdo publicado
deploy/                      configuração do serviço público
docs/                        documentação operacional do site
```

As regras obrigatórias de implementação estão em `BOAS-PRATICAS.md`.
