# Conteúdo e mídia no Cloudflare R2

## Decisão

O site não precisa de banco de dados para o conteúdo editorial. A solução proposta usa JSON versionado e imagens no R2, mantendo o Angular apenas como consumidor HTTP.

```text
Visitante -> Angular público -> Worker somente leitura -> lucas-camargo-published
Administrador -> Cloud Run Admin protegido por IAP -> buckets private e published
```

Nenhuma chave S3/R2 pode existir no Angular, no repositório ou em variáveis entregues ao navegador.

O Worker ativo é [lucas-camargo-content.nathan66merces.workers.dev](https://lucas-camargo-content.nathan66merces.workers.dev/content/manifest.json). Ele é a única origem pública do conteúdo; os endereços `r2.dev` dos dois buckets estão desativados.

## Buckets e objetos

```text
lucas-camargo-private
  drafts/
  backups/

lucas-camargo-published
  published/manifest.json
  versions/{release-id}/site.json
  media/{sha256}.webp
```

- Os dois buckets permanecem privados e com `r2.dev` desativado.
- O Worker público aceita apenas `GET` e `HEAD`, não lista objetos e restringe CORS ao domínio do site.
- O backend administrativo recebe um token de leitura e escrita limitado aos dois buckets.
- O Worker recebe acesso somente de leitura ao bucket publicado.
- Segredos do backend ficam no Google Secret Manager, nunca em arquivos JSON locais.

## Versionamento e publicação

O R2 não implementa o versionamento nativo de buckets do S3. O versionamento é explícito na aplicação:

1. gerar um `release-id` único;
2. gravar `versions/{release-id}/site.json` sem sobrescrever objetos existentes;
3. gravar imagens pelo SHA-256 do conteúdo;
4. validar o release inteiro;
5. atualizar `published/manifest.json` usando o ETag anterior;
6. rejeitar publicação concorrente com `409` ou `412`;
7. manter o manifest anterior no histórico para rollback.

O manifest contém o caminho, o identificador e o SHA-256 do release. O site só aplica o JSON depois de calcular o hash localmente e confirmar igualdade; um objeto incompleto, alterado ou incompatível é rejeitado e o último conteúdo válido permanece em cache. A troca do manifest é o ponto de commit da publicação. Se uma etapa auxiliar de auditoria falhar depois desse ponto, o histórico reconcilia o release publicado em vez de apresentar um falso erro de publicação.

Política de cache:

| Objeto | Cache-Control |
| --- | --- |
| JSON de versão e imagens por hash | `public, max-age=31536000, immutable` |
| `published/manifest.json` | `public, max-age=60, must-revalidate` |
| Rascunhos | `private, no-store` |

## Custos

O R2 Standard possui franquia mensal suficiente para o início do portfólio e não cobra egress. O Worker gratuito atende até 100 mil requisições diárias. Não usar R2 Infrequent Access para os objetos pequenos e consultados frequentemente deste site.

Referências oficiais: [preços do R2](https://developers.cloudflare.com/r2/pricing/), [tokens da API](https://developers.cloudflare.com/r2/api/tokens/), [compatibilidade S3](https://developers.cloudflare.com/r2/api/s3/api/) e [consistência](https://developers.cloudflare.com/r2/reference/consistency/).
