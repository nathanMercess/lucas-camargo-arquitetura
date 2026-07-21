# CI e deploy automático

O workflow `.github/workflows/ci-deploy.yml` trata o site público e o painel administrativo como aplicações independentes. Em pull requests, nenhuma credencial de produção é carregada. Em cada push para `main`, os deploys abaixo iniciam somente depois da validação correspondente:

| Job | Runtime de validação | Destino |
| --- | --- | --- |
| Site, admin e API | Node.js 20 + Yarn 1.22.22 | Validação compartilhada |
| Worker de conteúdo | Node.js 24 + Yarn 1.22.22 | Validação isolada |
| Site público | Imagem `Dockerfile` | Cloud Run `lucas-camargo-site` |
| Painel e API | Imagem `Dockerfile.admin` | Cloud Run `lucas-camargo-admin` |
| Conteúdo público | Wrangler versionado no lockfile | Cloudflare Worker |

Os três jobs de deploy são independentes. Uma falha no Worker não substitui uma revisão do Cloud Run e uma falha em um dos contêineres não altera o outro serviço. O workflow aceita deploy somente quando o evento é um push para `main` no repositório `nathanMercess/lucas-camargo-arquitetura`.

O ambiente `production`, o provider federado e as identidades técnicas já foram provisionados. As seções seguintes formam o procedimento de auditoria e recriação, não uma lista de dependências pendentes.

## 1. Identidade do Google Cloud

O GitHub não usa chave JSON. A autenticação é temporária, por OIDC, com Workload Identity Federation. Execute uma única vez, usando apenas a conta humana autorizada:

```powershell
gcloud auth login nathan66merces@gmail.com
gcloud config set account nathan66merces@gmail.com
.\deploy\github-wif-bootstrap.ps1
```

A service account federada é uma identidade técnica de curta duração, não uma segunda conta humana. `nathan66merces@gmail.com` continua sendo a única pessoa autorizada no projeto.

O script é idempotente e:

1. exige que `nathan66merces@gmail.com` seja a única conta ativa;
2. cria ou atualiza o pool e o provider OIDC;
3. aceita tokens apenas do repositório exato, da branch `main`, do workflow versionado e do environment `production`;
4. cria a service account `github-deployer` sem chave estática;
5. concede `Cloud Run Admin`, escrita somente no repositório regional de imagens e `Service Account User` somente nas duas identidades de runtime;
6. mantém as credenciais R2 acessíveis somente pela identidade de runtime do admin;
7. aplica a política de limpeza do Artifact Registry.

Ao final, o script mostra os três valores GCP que devem ser cadastrados no GitHub. Nenhum deles é segredo.

## 2. Environment de produção

No GitHub, abra **Settings > Environments > New environment** e crie `production`. Em **Deployment branches and tags**, permita somente `main`. Não habilite aprovação manual se o objetivo continuar sendo deploy totalmente automático.

Cadastre em **Environment variables** estes nomes exatos:

| Variável | Valor |
| --- | --- |
| `GCP_PROJECT_NUMBER` | Número exibido pelo script, atualmente `373724198767` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Resource name completo exibido pelo script |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | E-mail `github-deployer@lucas-camargo-arq-prod.iam.gserviceaccount.com` |
| `R2_PUBLISHED_BASE_URL` | `https://lucas-camargo-content.nathan66merces.workers.dev/content` |
| `CLOUDFLARE_ACCOUNT_ID` | `99a49091ddf94483f850f6047919e65d` |

Cadastre em **Environment secrets** somente:

| Segredo | Uso |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deploy do Worker por Wrangler |

Não crie `GCP_CREDENTIALS`, `GOOGLE_APPLICATION_CREDENTIALS` ou qualquer secret contendo uma chave JSON. Os três segredos S3 usados pelo backend continuam no Google Secret Manager e não devem ser duplicados no GitHub:

| Secret Manager | Conteúdo |
| --- | --- |
| `lucas-r2-endpoint` | Endpoint S3 do R2 |
| `lucas-r2-access-key-id` | Access Key ID limitado aos buckets do projeto |
| `lucas-r2-secret-access-key` | Secret Access Key correspondente |

## 3. Token de deploy da Cloudflare

Na Cloudflare, crie um API Token dedicado ao GitHub Actions. Restrinja o recurso à conta usada pelo projeto e conceda apenas:

- `Workers Scripts Edit`, para publicar o Worker;
- `Workers R2 Storage Edit`, exigido pelo Wrangler para publicar a configuração do binding R2.
- `Account Settings Read`, para o Wrangler resolver a conta e o subdomínio do Worker.

Não use Global API Key. O Worker não precisa de permissão para alterar DNS nem de credenciais S3. Se a conta não aceitar a combinação mínima, use o template oficial **Edit Cloudflare Workers**, restrinja-o à conta do projeto e remova permissões que não sejam exigidas pelo `wrangler deploy` após o primeiro teste.

Copie o valor mostrado uma única vez diretamente para `CLOUDFLARE_API_TOKEN`. Nunca envie o token por chat, arquivo `.env`, issue, log ou commit.

## 4. Recursos provisionados

O ambiente de produção possui:

1. buckets privados `lucas-camargo-private` e `lucas-camargo-published`;
2. endereço `r2.dev` desativado nos dois buckets;
3. três versões válidas no Google Secret Manager;
4. Worker com o binding `PUBLISHED_CONTENT` para `lucas-camargo-published`;
5. IAP inicializado no serviço `lucas-camargo-admin` e acesso concedido a `nathan66merces@gmail.com`;
6. Worker publicado em `https://lucas-camargo-content.nathan66merces.workers.dev`.

Se o serviço administrativo ou seus vínculos forem recriados, execute novamente:

```powershell
.\deploy\github-wif-bootstrap.ps1
```

O script recompõe de forma idempotente os vínculos do service agent do IAP e da conta proprietária. O job automático não recebe `IAP Admin` e, portanto, não pode ampliar quem acessa o painel.

## 5. Publicar e acompanhar

Qualquer merge ou push direto em `main` executa:

```text
Validar site + admin + API -> deploy site e deploy admin
Validar Worker             -> deploy Worker
```

Abra **Actions > CI e deploy** para acompanhar. O site é verificado em `https://lucascamargo.com` depois da nova revisão. O admin permanece protegido pelo IAP e não recebe uma chamada pública de health check.

Em pull requests de forks, somente os jobs de validação são executados. Secrets e tokens federados não são disponibilizados. As actions externas estão fixadas por SHA e o checkout não persiste credenciais Git no diretório de trabalho.

## 6. Proteção de custo e operação

- As imagens são compiladas no runner do GitHub e enviadas diretamente ao Artifact Registry, evitando consumo do Cloud Build.
- Site e admin usam `min=0`; o painel tem `max=1` e o site `max=3`.
- Cada imagem recebe a tag imutável do commit e a tag móvel `production`.
- A política do Artifact Registry remove imagens antigas automaticamente.
- O grupo de concorrência cancela execuções antigas de pull requests, mas deixa deploys de `main` em fila para não interromper uma publicação pela metade.
- O Worker usa o plano gratuito enquanto permanecer dentro das franquias da Cloudflare.

Para impedir que um commit não validado chegue a `main`, ative a regra de proteção da branch e exija os checks **Validar site, admin e API** e **Validar Worker** antes do merge.

## Diagnóstico rápido

| Erro | Verificação |
| --- | --- |
| `unauthorized_client` ou `principalSet` | Confirme provider completo, grafia do owner/repositório e branch `main`; execute novamente o bootstrap |
| Falha ao enviar a imagem | Confirme o papel `Artifact Registry Writer` no repositório `lucas-camargo` |
| Falha em `actAs` | Execute novamente o bootstrap para reaplicar `Service Account User` nas identidades de runtime |
| Secret não encontrado no admin | Crie uma versão nos três nomes exatos do Secret Manager e confirme o acesso de `lucas-admin-runtime` |
| Worker sem bucket | Confirme o bucket `lucas-camargo-published`, o Account ID e o binding em `wrangler.jsonc` |
| URL de conteúdo rejeitada | Use uma URL HTTPS terminada em `/content`, sem query string nem barra final |

Referências oficiais: [Workload Identity Federation para pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [autenticação do Google para GitHub Actions](https://github.com/google-github-actions/auth), [permissões de deploy do Cloud Run](https://docs.cloud.google.com/run/docs/reference/iam/roles), [configuração de secrets no Cloud Run](https://docs.cloud.google.com/run/docs/configuring/services/secrets), [permissões de API Tokens da Cloudflare](https://developers.cloudflare.com/fundamentals/api/reference/permissions/) e [GitHub Actions para Workers](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).
