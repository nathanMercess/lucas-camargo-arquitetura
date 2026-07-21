# Publicação no Cloud Run

## Recursos escolhidos

| Item | Valor |
| --- | --- |
| Conta humana autorizada | `nathan66merces@gmail.com` |
| Projeto | `lucas-camargo-arq-prod` |
| Serviço público | `lucas-camargo-site` |
| Região | `us-central1` |
| Repositório de imagens | `lucas-camargo` |
| Orçamento específico | R$ 20 por mês, somente alertas |
| Cobrança | Por requisição, com CPU limitada fora das requisições |
| Escala | Mínimo `0` e máximo `3` instâncias |
| Contêiner | `1 vCPU`, `128 MiB`, geração 1 e porta `8080` |

O projeto foi criado fora de organizações para não misturar o site com ambientes corporativos. Toda operação mutável deve informar `--account=nathan66merces@gmail.com` e `--project=lucas-camargo-arq-prod` explicitamente.

O serviço usa Nginx não privilegiado, fallback de rotas da SPA e cache longo somente para JavaScript e CSS com nomes gerados pelo build. Imagens editoriais ainda não são imutáveis e recebem cache curto até a migração para nomes versionados no R2.

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

`-AllowDirty` existe apenas para uma validação consciente e nunca deve ser usado em produção.

## Domínio da Hostinger

O domínio adotado é `lucascamargo.com`, já utilizado no e-mail oficial do projeto e atualmente delegado aos nameservers da Hostinger. O DNS permanece na Hostinger; não é necessário pagar pelo Cloud DNS.

A ordem obrigatória é:

1. publicar e validar o serviço na URL `run.app`;
2. verificar `lucascamargo.com` para `nathan66merces@gmail.com`;
3. executar `.\deploy\domain-mapping.ps1`;
4. copiar para a Hostinger os registros exibidos para o domínio raiz e `www`;
5. aguardar propagação e emissão automática do certificado.

Para iniciar a primeira verificação:

```powershell
.\deploy\domain-mapping.ps1 -StartVerification
```

Essa etapa abre o fluxo oficial do Google. É indispensável confirmar que o navegador está conectado como `nathan66merces@gmail.com`. O TXT já existente no domínio não pertence a essa conta, pois o Google ainda não lista `lucascamargo.com` entre os domínios verificados dela.

O mapeamento direto de domínio do Cloud Run continua em Preview. Ele foi escolhido por não adicionar custo fixo. Se as limitações de produção se tornarem relevantes, a alternativa econômica seguinte é usar Firebase Hosting como proxy; o Load Balancer global adicionaria custo fixo mensal.

## Proteção de custos

- Não manter instâncias ociosas: mínimo zero.
- Limitar o serviço inicialmente a três instâncias.
- Manter Cloud Run, Cloud Build e Artifact Registry na mesma região.
- Remover imagens antigas automaticamente e preservar três versões.
- Não habilitar análise paga de vulnerabilidades sem decisão explícita.
- Não criar Load Balancer, VPC Connector, Cloud SQL ou Cloud DNS nesta fase.
- Orçamento de R$ 20 configurado com alertas em 25%, 50%, 80%, 100% e 100% previsto.
- Alertas avisam, mas não bloqueiam gastos; `max=3` é a proteção técnica inicial.

Referências oficiais: [contrato do contêiner](https://docs.cloud.google.com/run/docs/container-contract), [preços do Cloud Run](https://cloud.google.com/run/pricing), [mapeamento de domínio](https://docs.cloud.google.com/run/docs/mapping-custom-domains) e [políticas de limpeza](https://docs.cloud.google.com/artifact-registry/docs/repositories/cleanup-policy-overview).
