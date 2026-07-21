# Procedimento seguro de produção

Este procedimento valida e publica os três serviços sem expor credenciais. A ordem obrigatória é **API → admin → Worker de conteúdo → site público**. O manifest de conteúdo é alterado somente pelo fluxo administrativo de publicação, depois que documento e mídias imutáveis existirem.

## Pré-requisitos bloqueantes

- Alterações revisadas, commitadas e com os três repositórios limpos.
- Workload Identity e variáveis `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`, `GCP_PROJECT_NUMBER` e `R2_PUBLISHED_BASE_URL` no ambiente `production` do GitHub.
- Segredos `lucas-r2-endpoint`, `lucas-r2-access-key-id` e `lucas-r2-secret-access-key` no Secret Manager.
- Token Cloudflare restrito ao Worker e ao binding R2, armazenado somente como `CLOUDFLARE_API_TOKEN` no GitHub.
- Domínios, IAP e contas de serviço já provisionados. Nenhuma dessas credenciais deve ser colocada em arquivos, argumentos de linha de comando ou logs.

## Validação antes de publicar

Na raiz do site público:

```powershell
pwsh ./deploy/validate-production.ps1
pwsh ./deploy/validate-production.ps1 -RunChecks
```

O primeiro comando valida contratos, manifests, outputs, health checks, proteção IAP, allowlist CORS e binding do bucket. O segundo também executa lint, testes e build na API, no admin, no site e no Worker. `-AllowDirty` existe apenas para auditoria local e não autoriza produção.

Revise no GitHub o SHA aprovado e execute os workflows dos repositórios nesta ordem:

1. API: confirmar revisão saudável, `/healthz` 204 e `/api/session` 401 sem asserção IAP.
2. Admin: confirmar revisão saudável, IAP habilitado e acesso anônimo bloqueado.
3. Site: o workflow valida primeiro o Worker e só depois publica o site.
4. Conteúdo: no admin protegido, salvar rascunho com ETag, publicar e confirmar o novo manifest.

Não publique o admin antes de uma API compatível. Não troque o manifest antes que todas as mídias e o documento de release existam.

## Smoke check pós-deploy

```powershell
pwsh ./deploy/smoke-check.ps1
pwsh ./deploy/smoke-check.ps1 -ApiUrl 'https://lucas-camargo-api-PROJECT_NUMBER.us-central1.run.app'
```

O script verifica HTTPS, health, headers, runtime config, manifest, cache curto, ETag/304, release imutável e SHA-256. A API é opcional porque sua URL depende do número do projeto. Depois, valide manualmente uma sessão IAP real no admin, preview, upload pequeno, publicação e leitura da mesma revisão no site.

## Rollback

1. **API/admin/site:** liste revisões do Cloud Run, identifique a última revisão validada e mova 100% do tráfego para ela. Não reconstrua uma imagem antiga.
2. **Worker:** use uma versão anterior registrada pelo Cloudflare e repita o smoke check do conteúdo.
3. **Conteúdo:** use a operação de rollback do admin com o ETag atual. O backend deve trocar apenas `published/manifest.json` para um release imutável já verificado.
4. Repita o smoke check e registre SHA, revisão, release, ator e horário do rollback.

Exemplos de inspeção, sem alteração:

```powershell
gcloud run revisions list --service=lucas-camargo-api --region=us-central1 --project=lucas-camargo-arq-prod
gcloud run revisions list --service=lucas-camargo-admin --region=us-central1 --project=lucas-camargo-arq-prod
gcloud run revisions list --service=lucas-camargo-site --region=us-central1 --project=lucas-camargo-arq-prod
```

## Limites conhecidos

O CSP não deve ser endurecido diretamente no Nginx sem uma rodada em modo report-only: o editor usa iframes, blobs, estilos inline controlados e previews de mídia. Primeiro inventarie as origens realmente consumidas e monitore violações; depois aplique uma política específica para admin e outra para site. Os headers defensivos que não interferem nesses fluxos já são obrigatórios no Nginx.
