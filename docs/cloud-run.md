# Publicação no Cloud Run

## Recursos em produção

| Item | Valor |
| --- | --- |
| Conta humana autorizada | `nathan66merces@gmail.com` |
| Projeto | `lucas-camargo-arq-prod` |
| Serviço público | `lucas-camargo-site`, público |
| Serviço administrativo | `lucas-camargo-admin`, privado por IAP |
| Região | `us-central1` |
| Repositório de imagens | `lucas-camargo` |
| Orçamento específico | R$ 20 por mês, somente alertas |
| Cobrança | Por requisição, com CPU limitada fora das requisições |
| Escala pública | Mínimo `0`, máximo `3`, concorrência `80`, `128 MiB` |
| Escala administrativa | Mínimo `0`, máximo `1`, concorrência `4`, `256 MiB` |

O projeto foi criado fora de organizações para não misturar o site com ambientes corporativos. Toda operação mutável deve informar `--account=nathan66merces@gmail.com` e `--project=lucas-camargo-arq-prod` explicitamente.

O site público usa Nginx não privilegiado, fallback de rotas da SPA e cache longo para arquivos com nomes gerados pelo build. Conteúdo editorial e imagens são servidos pelo Worker a partir de objetos versionados no R2. O painel Angular e a API Fastify compartilham o segundo contêiner para manter sessão, CSP, CORS e CSRF na mesma origem.

## Deploy

O script exige um repositório limpo por padrão para relacionar cada publicação a um commit:

```powershell
.\deploy\cloud-run.ps1
```

O script:

1. bloqueia qualquer conta ativa diferente da autorizada;
2. habilita somente Cloud Run, Cloud Build e Artifact Registry;
3. cria o repositório regional e uma service account sem papéis adicionais;
4. aplica retenção das três imagens mais recentes e da imagem de produção;
5. compila o projeto com Yarn dentro do Docker;
6. publica uma revisão com mínimo zero e máximo três;
7. mostra a URL `run.app` resultante.

O endereço público atualmente disponível em qualquer dispositivo é:

```text
https://lucas-camargo-site-373724198767.us-central1.run.app
```

Os endereços personalizados também foram validados com HTTPS e resposta `200`:

```text
https://lucascamargo.com
https://www.lucascamargo.com
```

A origem de conteúdo ativa é o Worker do R2. Para uma publicação manual do site:

```powershell
.\deploy\cloud-run.ps1 -ContentBaseUrl 'https://lucas-camargo-content.nathan66merces.workers.dev/content'
```

O contêiner gera `runtime/runtime-config.js` ao iniciar. O site busca `published/manifest.json`, carrega o release indicado e confere seu SHA-256 antes de aplicá-lo. Alterações editoriais posteriores acontecem pelo manifest e não exigem nova versão do site.

O admin/API pode ser publicado manualmente com:

```powershell
.\deploy\admin-cloud-run.ps1 -PublishedBaseUrl 'https://lucas-camargo-content.nathan66merces.workers.dev/content'
```

Sua URL estável é:

```text
https://lucas-camargo-admin-373724198767.us-central1.run.app
```

O fluxo normal não usa esses comandos: um push para `main` executa o workflow descrito em [`github-actions.md`](github-actions.md), autentica por Workload Identity Federation e publica site, admin/API e Worker como unidades independentes.

`-AllowDirty` existe apenas para uma validação consciente e nunca deve ser usado em produção.

## Domínio da Hostinger

O domínio adotado é `lucascamargo.com`, já utilizado no e-mail oficial do projeto e atualmente delegado aos nameservers da Hostinger. O DNS permanece na Hostinger; não é necessário pagar pelo Cloud DNS.

A ordem obrigatória é:

1. publicar e validar o serviço na URL `run.app`;
2. verificar `lucascamargo.com` para `nathan66merces@gmail.com`;
3. executar `.\deploy\domain-mapping.ps1`;
4. copiar para a Hostinger os registros exibidos para o domínio raiz e `www`;
5. aguardar propagação e emissão automática do certificado.

O script usa diretamente a API oficial do Cloud Run para o mapping gerenciado. Isso evita depender do componente `gcloud beta`, que não está instalado e exigiria permissão de administrador para alterar o SDK desta máquina.

Mappings criados em 20 de julho de 2026:

| Tipo | Nome na Hostinger | Valor |
| --- | --- | --- |
| A | `@` | `216.239.32.21` |
| A | `@` | `216.239.34.21` |
| A | `@` | `216.239.36.21` |
| A | `@` | `216.239.38.21` |
| AAAA | `@` | `2001:4860:4802:32::15` |
| AAAA | `@` | `2001:4860:4802:34::15` |
| AAAA | `@` | `2001:4860:4802:36::15` |
| AAAA | `@` | `2001:4860:4802:38::15` |
| CNAME | `www` | `ghs.googlehosted.com` |

Na auditoria de 20 de julho de 2026, o primeiro A e o CNAME já estavam corretos, e os dois hostnames responderam por HTTPS. Os demais A e AAAA continuam recomendados pelo Google para redundância e ainda devem ser incluídos na Hostinger. Não remover MX, SPF, registros da Apple ou o TXT de verificação, pois eles atendem e-mail e propriedade do domínio.

Para auditar ou recriar os mappings de forma idempotente:

```powershell
.\deploy\domain-mapping.ps1
```

O mapeamento direto de domínio do Cloud Run continua em Preview. Ele foi escolhido por não adicionar custo fixo. Se as limitações de produção se tornarem relevantes, a alternativa econômica seguinte é usar Firebase Hosting como proxy; o Load Balancer global adicionaria custo fixo mensal.

## Proteção de custos

- Não manter instâncias ociosas: mínimo zero.
- Limitar o site a três instâncias e o admin a uma.
- Manter Cloud Run e Artifact Registry na mesma região; o deploy automático compila no runner do GitHub para evitar consumo do Cloud Build.
- Remover imagens antigas automaticamente e preservar três versões.
- Não habilitar análise paga de vulnerabilidades sem decisão explícita.
- Não criar Load Balancer, VPC Connector, Cloud SQL ou Cloud DNS nesta fase.
- Orçamento de R$ 20 configurado com alertas em 25%, 50%, 80%, 100% e 100% previsto.
- Alertas avisam, mas não bloqueiam gastos; `max=3` é a proteção técnica inicial.

Referências oficiais: [contrato do contêiner](https://docs.cloud.google.com/run/docs/container-contract), [preços do Cloud Run](https://cloud.google.com/run/pricing), [mapeamento de domínio](https://docs.cloud.google.com/run/docs/mapping-custom-domains) e [políticas de limpeza](https://docs.cloud.google.com/artifact-registry/docs/repositories/cleanup-policy-overview).
