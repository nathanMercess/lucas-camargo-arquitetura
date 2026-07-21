# Painel administrativo dinâmico

## Objetivo

O painel em produção está disponível em [lucas-camargo-admin-373724198767.us-central1.run.app](https://lucas-camargo-admin-373724198767.us-central1.run.app), protegido pelo Google IAP e autorizado somente para `nathan66merces@gmail.com`. Ele permite alterar o conteúdo editorial sem recompilar nem publicar uma nova imagem do frontend. O fluxo separa rascunho e produção para evitar que uma edição incompleta apareça imediatamente no site.

```text
Painel + API no Cloud Run com IAP
  -> rascunho privado no R2
  -> release imutável no R2
  -> manifest publicado por troca atômica
  -> Worker público somente leitura
  -> site Angular atualiza o conteúdo em runtime
```

O conteúdo configurável inclui identidade, navegação, SEO, tema dentro dos limites da marca, seções, ordem, visibilidade, textos, CTAs, contatos, categorias, projetos, galerias, mídia e rodapé. HTML, CSS e JavaScript arbitrários não são aceitos. Um novo comportamento visual ou um novo tipo de bloco ainda exige implementação e revisão de código; conteúdo e composição dos blocos existentes não exigem deploy.

### Templates visuais

A aba **Conteúdo do site > Templates** oferece quatro direções aprovadas: Editorial, Galeria, Minimal e Contraste. Cada cartão mostra uma prévia, a indicação de uso e a ação **Aplicar template**. A aplicação troca somente o identificador do preset e os tokens tipados de cor, tipografia, proporção e movimento; identidade, textos, seções, projetos, categorias e mídias são preservados.

O template aplicado permanece no rascunho. Para colocá-lo no site:

1. Aplicar o template e revisar os tokens na aba **Tema**.
2. Selecionar **Salvar rascunho**.
3. Abrir **Publicações** e conferir o preview responsivo.
4. Publicar o release somente após a revisão.

O site lê o `presetId` publicado em runtime e aplica a composição correspondente sem recompilar ou fazer deploy. Identificadores desconhecidos são rejeitados no painel público e na API; CSS livre nunca é persistido.

## Fluxo diário de uso

1. Entrar no painel com a conta Google autorizada.
2. Editar o conteúdo global, uma seção, categoria ou projeto.
3. Enviar novas imagens na biblioteca de mídia e aguardar a confirmação do upload.
4. Salvar o rascunho. A API usa ETag para impedir que duas sessões sobrescrevam alterações silenciosamente.
5. Abrir o preview e conferir desktop, tablet e celular. O preview não altera o site público.
6. Publicar o rascunho. A API valida conteúdo e mídias, grava um release imutável, calcula o SHA-256 e troca o manifest publicado.
7. Conferir [lucascamargo.com](https://lucascamargo.com). O frontend carrega o manifest, verifica o SHA-256 e aplica o release em runtime.
8. Em caso de erro editorial, usar **Rollback** em uma versão anterior. A ação troca o ponteiro publicado sem apagar releases.
9. Consultar **Auditoria** para conferir autor, ação, resultado, release e horário.

Alterações salvas, mas não publicadas, permanecem privadas. Publicar conteúdo ou aplicar um dos quatro templates não exige commit, build ou deploy.

## Desenvolvimento local

Instalar e validar sempre com Yarn:

```powershell
yarn install --frozen-lockfile
yarn run check
```

Compilar e iniciar a API em memória:

```powershell
yarn build:admin
yarn build:admin-api
$env:STORAGE_DRIVER = 'memory'
$env:AUTH_MODE = 'development'
yarn start:admin-api
```

Em outro terminal, iniciar o painel:

```powershell
yarn start:admin
```

Abrir `http://localhost:4201`. O servidor de desenvolvimento encaminha somente `/api` para
`http://127.0.0.1:8080` por meio de `projects/admin/proxy.conf.json`; não é necessário liberar CORS
amplo nem colocar uma URL de API no código Angular.

O modo em memória é exclusivo para desenvolvimento e perde os dados quando o processo termina. Em produção, `NODE_ENV=production` obriga autenticação IAP e armazenamento R2.

O driver em memória valida edição, ETag, publicação, rollback e auditoria. Uploads pelo navegador
dependem de uma URL pré-assinada real e, portanto, só completam com o driver R2 configurado.

## Produção

O serviço ativo é `lucas-camargo-admin` em `us-central1`, com mínimo zero, máximo uma instância, concorrência quatro e acesso concedido somente a `nathan66merces@gmail.com`. Painel e API ficam na mesma origem para simplificar CSP, CORS e proteção CSRF.

### IAP

O IAP direto no Cloud Run autentica o proprietário antes de qualquer arquivo do painel ou rota da API ser servido. O backend valida novamente o JWT e a allowlist; remover a interface de login não remove essa proteção. Em uma eventual recriação do serviço, o projeto sem organização pode exigir novamente a ativação pela aba **Segurança** do Cloud Run. Não criar Load Balancer apenas para esse bootstrap.

Antes do primeiro deploy, criar no Secret Manager os seguintes segredos com valores obtidos no painel da Cloudflare:

| Segredo | Valor |
| --- | --- |
| `lucas-r2-endpoint` | Endpoint S3 da conta R2 |
| `lucas-r2-access-key-id` | Access Key ID de um token restrito aos buckets do projeto |
| `lucas-r2-secret-access-key` | Secret Access Key correspondente |

Não colar esses valores em chat, commit, arquivo `.env` versionado ou comando que fique no histórico. A service account `lucas-admin-runtime` recebe `Secret Accessor` somente nesses três segredos.

Com os buckets e segredos existentes:

```powershell
.\deploy\admin-cloud-run.ps1 -PublishedBaseUrl 'https://lucas-camargo-content.nathan66merces.workers.dev/content'
```

O script valida a única conta ativa do Google, compila o painel e a API, ativa IAP direto, autoriza o service agent do IAP a invocar o serviço, remove invocadores públicos, limita escala e concede `roles/iap.httpsResourceAccessor` somente à conta autorizada. A URL do Worker é obrigatória para que previews das mídias publicadas usem a origem correta.

## Segurança e operação

- IAP autentica o usuário e o backend valida novamente o JWT e a allowlist.
- Métodos mutáveis exigem origem válida, proteção CSRF e permissão explícita.
- ETags impedem sobrescrita silenciosa entre sessões.
- Publicações geram releases imutáveis, hash SHA-256 e log estruturado.
- O frontend público compara o SHA-256 do JSON com o manifest antes de aplicar o release.
- Rollback altera somente o ponteiro publicado para um release já validado.
- Uploads usam URLs assinadas curtas; a chave R2 nunca chega ao Angular.
- O site e o Worker não possuem permissão de escrita.
- Logs não devem conter tokens, cookies ou o JSON editorial completo.

Consulte também [`access-control-audit.md`](access-control-audit.md), [`storage-r2.md`](storage-r2.md) e [`github-actions.md`](github-actions.md).
