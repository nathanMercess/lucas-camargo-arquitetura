# Worker público de conteúdo

Este Worker é a única porta pública do bucket `lucas-camargo-published`. O bucket continua privado, sem domínio próprio e com o endereço de desenvolvimento `r2.dev` desativado. O código aceita somente `GET` e `HEAD`, não lista objetos e não possui nenhuma operação de escrita ou exclusão.

## Contrato público

| URL do Worker | Chave exata no R2 | Cache |
| --- | --- | --- |
| `/content/manifest.json` | `published/manifest.json` | 60 segundos, com revalidação |
| `/content/versions/{release-id}/site.json` | `versions/{release-id}/site.json` | 1 ano, imutável |
| `/content/media/{sha256}.{extensão}` | `media/{sha256}.{extensão}` | 1 ano, imutável |

O `release-id` aceita somente letras minúsculas, números, `_` e `-`, tem entre 1 e 64 caracteres e não pode começar ou terminar com separador. Mídias usam o SHA-256 minúsculo completo e apenas extensões explicitamente reconhecidas. Caminhos com query string, percent-encoding, barras duplicadas, travessia ou nomes alternativos retornam `404` sem consultar o bucket.

O tipo de conteúdo é determinado pela rota validada. Metadados de tipo gravados no R2 nunca são repassados, evitando servir HTML ou scripts por engano. ETag, `If-None-Match`/`304`, `HEAD`, cache na borda e headers de segurança são tratados pelo Worker.

## Desenvolvimento e validação

Use Node.js 22 ou 24 e exclusivamente Yarn dentro desta pasta. O Wrangler atual não executa no Node.js 20:

```powershell
cd C:\meus-projetos\lucas-camargo-arquitetura\cloudflare\content-worker
yarn install --frozen-lockfile
yarn run check
yarn dev
```

O `wrangler dev` usa armazenamento R2 local por padrão. Ele não acessa o bucket de produção sem uma opção remota explícita.

## URL de produção

O Worker está publicado em:

```text
https://lucas-camargo-content.nathan66merces.workers.dev
```

O manifest pode ser consultado em `/content/manifest.json`. O site público usa essa origem em runtime e verifica o SHA-256 do release indicado antes de aplicar o JSON.

## Deploy manual e recuperação

O deploy normal é executado pelo GitHub Actions a cada push para `main`. As ações abaixo servem para recriar recursos ou fazer uma recuperação controlada; exigem a conta Cloudflare do proprietário. Não envie token, cookie ou código de autenticação pelo chat e não salve credenciais neste repositório.

```powershell
cd C:\meus-projetos\lucas-camargo-arquitetura\cloudflare\content-worker
yarn wrangler login
yarn wrangler whoami
yarn wrangler r2 bucket create lucas-camargo-private
yarn wrangler r2 bucket create lucas-camargo-published
yarn wrangler r2 bucket dev-url disable lucas-camargo-private --force
yarn wrangler r2 bucket dev-url disable lucas-camargo-published --force
yarn wrangler r2 bucket cors set lucas-camargo-published --file r2-upload-cors.json --force
yarn wrangler r2 bucket cors list lucas-camargo-published
yarn deploy
```

Antes do deploy, confirme em `yarn wrangler whoami` que a conta correta está ativa. O `wrangler.jsonc` contém apenas o nome público do Worker, a allowlist de origens e o binding `PUBLISHED_CONTENT`; ele não contém `account_id`, token ou segredo.

Ao concluir, valide a URL de produção informada acima em qualquer dispositivo. Um domínio customizado pode ser adicionado no futuro se o DNS for transferido para a Cloudflare, mas não é necessário para operar o site. Não habilite `r2.dev`: o visitante deve alcançar o conteúdo somente pelo Worker. A regra CORS versionada libera upload presigned exclusivamente para a origem estável do painel e apenas com os headers assinados pela API.

## Publicação segura

O backend administrativo deve escrever primeiro os objetos imutáveis e atualizar `published/manifest.json` por último, usando precondição de ETag. Nunca sobrescreva uma chave de versão ou mídia existente. Uma publicação válida segue esta ordem:

1. validar integralmente o documento;
2. gravar `versions/{release-id}/site.json` com condição de inexistência;
3. gravar cada mídia em `media/{sha256}.{extensão}` com condição de inexistência;
4. confirmar que todas as referências existem;
5. atualizar `published/manifest.json` com o ETag anterior.

A aplicação Angular deve consumir apenas as URLs `/content/...` expostas pelo Worker. Chaves S3/R2 pertencem exclusivamente ao backend e jamais podem ser entregues ao navegador.

## CORS e manutenção

`CORS_ALLOWED_ORIGINS` é uma lista exata, separada por vírgulas. A configuração inclui o domínio principal, `www` e as duas URLs estáveis atuais do Cloud Run. Uma nova origem só deve ser adicionada após revisão; curingas não são aceitos pelo código.

Execute `yarn run check` antes de qualquer deploy. Para inspecionar uma publicação sem expor o bucket, faça requisições ao Worker e confirme `Cache-Control`, `ETag`, `Content-Type`, CORS e `304`.

Referências oficiais: [bindings R2 no Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/#r2-buckets), [API R2 em Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/), [criação de buckets](https://developers.cloudflare.com/r2/buckets/create-buckets/) e [acesso público ao R2](https://developers.cloudflare.com/r2/buckets/public-buckets/).
