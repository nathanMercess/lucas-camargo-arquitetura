[CmdletBinding()]
param(
  [string]$AdminRepository,
  [string]$ApiRepository,
  [switch]$AllowDirty,
  [switch]$RunChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$siteRepository = Split-Path -Parent $scriptDirectory
$projectsDirectory = Split-Path -Parent $siteRepository

if (-not $AdminRepository) {
  $AdminRepository = Join-Path $projectsDirectory 'admin-lucas-camargo-arquitetura'
}

if (-not $ApiRepository) {
  $ApiRepository = Join-Path $projectsDirectory 'api-lucas-camargo-arquitetura'
}

function Assert-Condition {
  param(
    [Parameter(Mandatory)]
    [bool]$Condition,
    [Parameter(Mandatory)]
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Assert-FileContains {
  param(
    [Parameter(Mandatory)]
    [string]$Path,
    [Parameter(Mandatory)]
    [string]$Pattern,
    [Parameter(Mandatory)]
    [string]$Message
  )

  Assert-Condition -Condition (Test-Path -LiteralPath $Path -PathType Leaf) `
    -Message "Arquivo obrigatorio ausente: $Path"
  $content = Get-Content -LiteralPath $Path -Raw
  Assert-Condition -Condition ($content -match $Pattern) -Message $Message
}

function Assert-CleanRepository {
  param(
    [Parameter(Mandatory)]
    [string]$Repository
  )

  if ($AllowDirty) {
    return
  }

  $changes = @(& git -C $Repository status --porcelain)
  Assert-Condition -Condition ($LASTEXITCODE -eq 0) `
    -Message "Nao foi possivel consultar o estado Git de $Repository."
  Assert-Condition -Condition ($changes.Count -eq 0) `
    -Message "O repositorio $Repository possui alteracoes sem commit. Use -AllowDirty apenas em uma auditoria local."
}

function Invoke-YarnCheck {
  param(
    [Parameter(Mandatory)]
    [string]$Repository
  )

  Push-Location $Repository

  try {
    & yarn run check

    if ($LASTEXITCODE -ne 0) {
      throw "A validacao falhou em $Repository."
    }
  }
  finally {
    Pop-Location
  }
}

$repositories = @($ApiRepository, $AdminRepository, $siteRepository)

foreach ($repository in $repositories) {
  Assert-Condition -Condition (Test-Path -LiteralPath $repository -PathType Container) `
    -Message "Repositorio obrigatorio ausente: $repository"
  Assert-CleanRepository -Repository $repository
}

Assert-FileContains -Path (Join-Path $ApiRepository 'Dockerfile') -Pattern 'dist/server\.js' `
  -Message 'O container da API nao inicia o artefato dist/server.js.'
Assert-FileContains -Path (Join-Path $ApiRepository 'src/app.ts') -Pattern "app\.get\('/healthz'" `
  -Message 'A API nao expoe o health check /healthz.'
Assert-FileContains -Path (Join-Path $ApiRepository '.github/workflows/ci.yml') -Pattern 'AUTH_MODE=iap' `
  -Message 'O deploy da API nao fixa AUTH_MODE=iap.'
Assert-FileContains -Path (Join-Path $ApiRepository '.github/workflows/ci.yml') -Pattern 'ADMIN_ALLOWED_ORIGINS=' `
  -Message 'O deploy da API nao configura a origem exata do admin.'
Assert-FileContains -Path (Join-Path $ApiRepository '.github/workflows/ci.yml') -Pattern 'R2_PRIVATE_BUCKET=' `
  -Message 'O deploy da API nao configura o bucket privado.'
Assert-FileContains -Path (Join-Path $ApiRepository '.github/workflows/ci.yml') -Pattern 'R2_PUBLISHED_BUCKET=' `
  -Message 'O deploy da API nao configura o bucket publicado.'

Assert-FileContains -Path (Join-Path $AdminRepository 'Dockerfile') -Pattern '/app/dist/admin/browser/' `
  -Message 'O container do admin nao copia o output Angular esperado.'
Assert-FileContains -Path (Join-Path $AdminRepository 'deploy/nginx-admin.conf') -Pattern 'location = /healthz' `
  -Message 'O admin nao expoe o health check /healthz.'
Assert-FileContains -Path (Join-Path $AdminRepository 'deploy/nginx-admin.conf') `
  -Pattern 'X-Admin-IAP-JWT-Assertion' -Message 'O proxy do admin nao encaminha a assercao do IAP para a API.'
Assert-FileContains -Path (Join-Path $AdminRepository '.github/workflows/ci.yml') -Pattern '--iap' `
  -Message 'O deploy do admin nao habilita IAP.'
Assert-FileContains -Path (Join-Path $AdminRepository '.github/workflows/ci.yml') -Pattern '--no-allow-unauthenticated' `
  -Message 'O deploy do admin permite acesso anonimo.'

Assert-FileContains -Path (Join-Path $siteRepository 'Dockerfile') `
  -Pattern '/app/dist/lucas-camargo-arquitetura/browser/' `
  -Message 'O container do site nao copia o output Angular esperado.'
Assert-FileContains -Path (Join-Path $siteRepository 'deploy/nginx.conf') -Pattern 'location = /healthz' `
  -Message 'O site nao expoe o health check /healthz.'
Assert-FileContains -Path (Join-Path $siteRepository 'deploy/runtime-config.js.template') `
  -Pattern "contentBaseUrl: '\$\{CONTENT_BASE_URL\}'" `
  -Message 'O runtime config do site nao recebe CONTENT_BASE_URL.'

$manifestPaths = @(
  (Join-Path $ApiRepository 'deploy/initial-published-manifest.json'),
  (Join-Path $siteRepository 'deploy/initial-published-manifest.json')
)
$manifests = @($manifestPaths | ForEach-Object {
  Assert-Condition -Condition (Test-Path -LiteralPath $_ -PathType Leaf) `
    -Message "Manifest inicial ausente: $_"
  Get-Content -LiteralPath $_ -Raw | ConvertFrom-Json
})
$manifestFingerprint = $manifests[0] | ConvertTo-Json -Compress

foreach ($manifest in $manifests) {
  Assert-Condition -Condition (($manifest | ConvertTo-Json -Compress) -eq $manifestFingerprint) `
    -Message 'Os manifests iniciais da API e do site divergem.'
  Assert-Condition -Condition ($manifest.schemaVersion -eq 1) `
    -Message 'O manifest publicado nao usa schemaVersion 1.'
  Assert-Condition -Condition ($manifest.siteConfigKey -match '^versions/[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?/site\.json$') `
    -Message 'A chave do documento publicado nao segue o contrato imutavel.'
  Assert-Condition -Condition ($manifest.sha256 -match '^[a-f0-9]{64}$') `
    -Message 'O SHA-256 do manifest publicado e invalido.'
}

$localManifestPath = Join-Path $siteRepository 'public/content/manifest.json'
Assert-Condition -Condition (Test-Path -LiteralPath $localManifestPath -PathType Leaf) `
  -Message "Manifest local ausente: $localManifestPath"
$localManifest = Get-Content -LiteralPath $localManifestPath -Raw | ConvertFrom-Json
Assert-Condition -Condition ($localManifest.schemaVersion -eq $manifests[0].schemaVersion) `
  -Message 'O manifest local usa uma versao de schema diferente do bootstrap publicado.'
Assert-Condition -Condition ($localManifest.releaseId -eq $manifests[0].releaseId) `
  -Message 'O manifest local aponta para outro release de bootstrap.'
Assert-Condition -Condition ($localManifest.sha256 -eq $manifests[0].sha256) `
  -Message 'O manifest local usa um SHA-256 diferente do bootstrap publicado.'
Assert-Condition -Condition ($localManifest.siteConfigKey -eq 'site-config.v1.json') `
  -Message 'O manifest local deve apontar para site-config.v1.json dentro do bundle.'

$wranglerConfig = Get-Content -LiteralPath `
  (Join-Path $siteRepository 'cloudflare/content-worker/wrangler.jsonc') -Raw | ConvertFrom-Json
$allowedOrigins = @($wranglerConfig.vars.CORS_ALLOWED_ORIGINS -split ',')
Assert-Condition -Condition ($allowedOrigins.Count -gt 0) `
  -Message 'A allowlist CORS do Worker esta vazia.'
Assert-Condition -Condition (-not ($allowedOrigins | Where-Object { $_ -eq '*' })) `
  -Message 'A allowlist CORS do Worker nao pode usar curinga.'
Assert-Condition -Condition (-not ($allowedOrigins | Where-Object { $_ -notmatch '^https://[^/]+$' })) `
  -Message 'A allowlist CORS do Worker deve conter apenas origens HTTPS exatas.'
Assert-Condition -Condition ($wranglerConfig.r2_buckets[0].bucket_name -eq 'lucas-camargo-published') `
  -Message 'O Worker nao esta ligado ao bucket publicado esperado.'

Push-Location $siteRepository

try {
  & yarn run verify:content

  if ($LASTEXITCODE -ne 0) {
    throw 'O manifest inicial nao corresponde ao conteudo local versionado.'
  }
}
finally {
  Pop-Location
}

if ($RunChecks) {
  foreach ($repository in $repositories) {
    Invoke-YarnCheck -Repository $repository
  }

  Invoke-YarnCheck -Repository (Join-Path $siteRepository 'cloudflare/content-worker')
}

Write-Host 'Pre-deploy validado na ordem segura: API -> admin -> Worker/site.'
