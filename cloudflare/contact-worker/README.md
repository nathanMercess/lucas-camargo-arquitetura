# Worker público do formulário de contato

Este Worker recebe exclusivamente `POST /contact`, valida a origem exata, limita requisições, confirma o token do Cloudflare Turnstile no servidor e grava mensagens imutáveis no bucket privado. Ele não possui operação de leitura, listagem, atualização ou exclusão pública.

## Segurança e configuração

- `TURNSTILE_SECRET_KEY` é um segredo do Worker e nunca deve ser versionado ou enviado ao navegador.
- `CORS_ALLOWED_ORIGINS` e `TURNSTILE_ALLOWED_HOSTNAMES` são allowlists exatas.
- O frontend envia `Content-Type: application/json` e `X-Contact-Form: 1`.
- O corpo é limitado a 16 KiB e não aceita campos desconhecidos.
- Tokens Turnstile são verificados pela ação `contact`, hostname e validade antes da gravação.
- O rate limit usa somente um hash parcial e não persiste o e-mail no contador.
- O Worker nunca registra o corpo, token, e-mail, telefone ou endereço IP.

As mensagens ficam em `contacts/messages/YYYY/MM/DD/{timestamp}-{uuid}.json`, com `Cache-Control: no-store`, no bucket `lucas-camargo-private`. Configure no R2 uma regra de lifecycle compatível com a política de retenção aprovada; a API administrativa protegida é a única leitora.

## Desenvolvimento

Use exclusivamente Yarn:

```powershell
yarn install --frozen-lockfile
yarn run check
yarn dev
```

Para desenvolvimento local, use as chaves de teste oficiais do Turnstile em `.dev.vars`, que não deve ser versionado. Para produção, cadastre o segredo com `yarn wrangler secret put TURNSTILE_SECRET_KEY` e confirme a conta Cloudflare antes do deploy.

Referências oficiais: validação server-side do Turnstile, Rate Limiting binding de Workers e API R2 para Workers.
