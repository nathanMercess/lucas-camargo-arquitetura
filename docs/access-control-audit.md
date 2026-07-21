# Auditoria de acesso e solução proposta

Data da auditoria: 21 de julho de 2026.

## Escopo atual

- O frontend é público e carrega um manifest e um `SiteConfigV1` em runtime, com fallback local validado.
- O painel Angular, a API de escrita, o Worker somente leitura e os scripts de deploy estão implementados e ativos em produção.
- O painel está protegido por IAP; os dois buckets R2 estão privados, com `r2.dev` desativado, e o Worker expõe somente leitura do conteúdo publicado.
- O projeto Google Cloud dedicado é `lucas-camargo-arq-prod`.
- A única identidade humana autorizada para administração é `nathan66merces@gmail.com`.
- A conta técnica padrão de build teve o papel amplo `Editor` removido e recebeu somente `Cloud Build Service Account`.
- A service account `lucas-site-runtime` não possui papéis adicionais no projeto.
- A service account `lucas-admin-runtime` acessa somente os três segredos R2 necessários ao backend.
- O GitHub Actions usa credenciais temporárias por Workload Identity Federation e não armazena chave JSON do Google.
- Contas de serviço técnicas continuarão existindo porque Cloud Build e Cloud Run dependem delas; elas não representam outro usuário humano.

## Modelo de acesso

| Recurso | Quem acessa | Permissão |
| --- | --- | --- |
| `lucas-camargo-site` | Visitantes | Invocar anonimamente; sem escrita |
| `lucas-camargo-admin` | `nathan66merces@gmail.com` | Acessar via IAP |
| R2 publicado | Worker público | Leitura de objetos, sem listagem |
| R2 privado | Backend administrativo | Leitura e escrita limitada aos buckets definidos |
| Secret Manager | Service account do admin | Acesso somente às versões dos segredos R2 |
| Projeto Google Cloud | `nathan66merces@gmail.com` | Administração e deploy |
| GitHub Actions no GCP | `github-deployer` federado e restrito ao repositório/`main` | Publicar somente as duas imagens Cloud Run |
| GitHub Actions na Cloudflare | Token dedicado e restrito à conta do projeto | Publicar o Worker e seu binding R2 |

O painel e a API formam um segundo serviço Cloud Run privado, protegido pelo IAP direto. O serviço público não recebe credenciais R2. A interface administrativa sozinha não é uma barreira de segurança; toda operação de escrita é novamente autorizada no backend.

## Controles obrigatórios

1. Remover `allUsers` e `allAuthenticatedUsers` do serviço administrativo.
2. Conceder `roles/iap.httpsResourceAccessor` somente a `user:nathan66merces@gmail.com`.
3. Validar no backend o JWT assinado `x-goog-iap-jwt-assertion`, inclusive audiência, emissor, expiração e identidade estável.
4. Validar `Origin` e aplicar proteção CSRF nas operações mutáveis.
5. Usar service accounts dedicadas, sem chaves JSON e sem papel `Editor`.
6. Restringir tokens R2 por bucket e ação; nunca entregar tokens ao navegador.
7. Ativar MFA na conta Google e na conta Cloudflare.
8. Executar revisão trimestral de membros, papéis, tokens e sessões.
9. Revogar imediatamente tokens substituídos e registrar a rotação.
10. Manter restauração testada de pelo menos três releases publicados.

## Log de auditoria da aplicação

Cada gravação administrativa deve emitir JSON estruturado no Cloud Logging:

```json
{
  "event": "content.publish",
  "actorId": "identidade-estavel-do-iap",
  "actorEmail": "nathan66merces@gmail.com",
  "resource": "site-content",
  "previousEtag": "etag-anterior",
  "newEtag": "novo-etag",
  "contentHash": "sha256",
  "releaseId": "release-id",
  "result": "success",
  "requestId": "request-id",
  "timestamp": "2026-07-20T00:00:00Z"
}
```

Não registrar tokens, cookies, conteúdo integral ou dados pessoais desnecessários. Os logs nativos do R2 auditam configuração, mas não registram cada `GetObject`, `PutObject` ou `DeleteObject`; por isso, as escritas precisam ser auditadas no backend.

Camadas de evidência:

- Cloud Audit Logs para IAM, IAP, Cloud Run e infraestrutura;
- request logs automáticos do Cloud Run;
- logs estruturados do backend para cada alteração editorial;
- Cloudflare Audit Logs para mudanças na configuração do R2;
- histórico de releases imutáveis para reconstruir o estado publicado.

Começar com a retenção padrão de 30 dias para não criar custo fixo. Aumentar para 365 dias somente quando houver exigência real; bloquear um bucket de logs é irreversível e exige aprovação separada.

## Riscos e situação

| Risco | Situação | Tratamento |
| --- | --- | --- |
| Segredo S3 exposto no Angular | Evitado | Escrita somente pelo backend |
| Usuário não autorizado no painel | Protegido | IAP e allowlist de uma conta |
| Sobrescrita concorrente do JSON | Implementado | ETag e escrita condicional |
| Perda de versão | Implementado | Objetos imutáveis por release e rollback |
| Custo inesperado no Cloud Run | Configurado | Mínimo zero e máximo três |
| Acúmulo de imagens Docker | Configurado | Política de limpeza e retenção das três mais recentes |
| Conta técnica padrão com papel `Editor` | Corrigido | Papel substituído pelo papel específico de build |
| Auditoria incompleta no R2 | Implementado | R2 para consulta e Cloud Logging redundante para toda mutação |

Referências oficiais: [IAP direto no Cloud Run](https://docs.cloud.google.com/run/docs/securing/identity-aware-proxy-cloud-run), [boas práticas de service accounts](https://docs.cloud.google.com/iam/docs/best-practices-service-accounts), [logging no Cloud Run](https://docs.cloud.google.com/run/docs/logging) e [audit logs do R2](https://developers.cloudflare.com/r2/platform/audit-logs/).
