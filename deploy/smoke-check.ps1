[CmdletBinding()]
param(
  [string]$SiteUrl = 'https://lucascamargo.com',
  [string]$ContentBaseUrl = 'https://lucas-camargo-content.nathan66merces.workers.dev/content',
  [string]$ApiUrl
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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

function Get-HeaderValue {
  param(
    [Parameter(Mandatory)]
    [object]$Response,
    [Parameter(Mandatory)]
    [string]$Name
  )

  $values = $Response.Headers[$Name]

  if ($null -eq $values) {
    return ''
  }

  return ($values -join ', ')
}

function Invoke-SmokeRequest {
  param(
    [Parameter(Mandatory)]
    [string]$Uri,
    [ValidateSet('GET', 'HEAD')]
    [string]$Method = 'GET',
    [hashtable]$Headers = @{}
  )

  try {
    return Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers `
      -MaximumRedirection 5 -TimeoutSec 30 -UseBasicParsing -SkipHttpErrorCheck
  }
  catch {
    throw
  }
}

function Get-CanonicalJsonSha256 {
  param(
    [Parameter(Mandatory)]
    [string]$Json
  )

  $nodeCommand = (Get-Command node -ErrorAction Stop).Source
  $temporaryFile = [IO.Path]::GetTempFileName()

  try {
    $utf8WithoutBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($temporaryFile, $Json, $utf8WithoutBom)
    $nodeScript = "const fs=require('fs'),crypto=require('crypto');const value=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'));"
    $hash = (& $nodeCommand -e $nodeScript $temporaryFile).Trim()

    if ($LASTEXITCODE -ne 0) {
      throw 'Nao foi possivel calcular o SHA-256 canonico do release.'
    }

    return $hash
  }
  finally {
    if (Test-Path -LiteralPath $temporaryFile) {
      Remove-Item -LiteralPath $temporaryFile -Force
    }
  }
}

$SiteUrl = $SiteUrl.TrimEnd('/')
$ContentBaseUrl = $ContentBaseUrl.TrimEnd('/')

Assert-Condition -Condition ($SiteUrl -match '^https://') -Message 'SiteUrl deve usar HTTPS.'
Assert-Condition -Condition ($ContentBaseUrl -match '^https://') -Message 'ContentBaseUrl deve usar HTTPS.'

$healthResponse = Invoke-SmokeRequest -Uri "$SiteUrl/health"
Assert-Condition -Condition ($healthResponse.StatusCode -eq 200) `
  -Message "O health check do site retornou $($healthResponse.StatusCode)."

$siteResponse = Invoke-SmokeRequest -Uri "$SiteUrl/"
Assert-Condition -Condition ($siteResponse.StatusCode -eq 200) `
  -Message "A pagina inicial retornou $($siteResponse.StatusCode)."
Assert-Condition -Condition ((Get-HeaderValue -Response $siteResponse -Name 'X-Content-Type-Options') -eq 'nosniff') `
  -Message 'O site nao enviou X-Content-Type-Options: nosniff.'
Assert-Condition -Condition ((Get-HeaderValue -Response $siteResponse -Name 'Content-Type') -match '^text/html') `
  -Message 'A pagina inicial nao foi servida como HTML.'

$runtimeResponse = Invoke-SmokeRequest -Uri "$SiteUrl/runtime/runtime-config.js"
Assert-Condition -Condition ($runtimeResponse.StatusCode -eq 200) `
  -Message 'O runtime config do site nao esta disponivel.'
Assert-Condition -Condition ($runtimeResponse.Content -match [Regex]::Escape($ContentBaseUrl)) `
  -Message 'O runtime config nao aponta para a origem de conteudo validada.'

$manifestUrl = "$ContentBaseUrl/manifest.json"
$manifestResponse = Invoke-SmokeRequest -Uri $manifestUrl
Assert-Condition -Condition ($manifestResponse.StatusCode -eq 200) `
  -Message "O manifest retornou $($manifestResponse.StatusCode)."
Assert-Condition -Condition ((Get-HeaderValue -Response $manifestResponse -Name 'Content-Type') -match '^application/json') `
  -Message 'O manifest nao foi servido como JSON.'
Assert-Condition -Condition ((Get-HeaderValue -Response $manifestResponse -Name 'Cache-Control') -match 'max-age=60') `
  -Message 'O manifest nao usa cache curto de 60 segundos.'
Assert-Condition -Condition ((Get-HeaderValue -Response $manifestResponse -Name 'X-Content-Type-Options') -eq 'nosniff') `
  -Message 'O Worker nao enviou X-Content-Type-Options: nosniff.'

$manifestEtag = Get-HeaderValue -Response $manifestResponse -Name 'ETag'
Assert-Condition -Condition (-not [string]::IsNullOrWhiteSpace($manifestEtag)) `
  -Message 'O manifest nao possui ETag.'
$manifest = $manifestResponse.Content | ConvertFrom-Json
Assert-Condition -Condition ($manifest.schemaVersion -eq 1) `
  -Message 'O manifest publicado nao usa schemaVersion 1.'
Assert-Condition -Condition ($manifest.siteConfigKey -match '^versions/[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?/site\.json$') `
  -Message 'A chave do release publicado e invalida.'
Assert-Condition -Condition ($manifest.sha256 -match '^[a-f0-9]{64}$') `
  -Message 'O SHA-256 do release publicado e invalido.'

$conditionalResponse = Invoke-SmokeRequest -Uri $manifestUrl -Headers @{ 'If-None-Match' = $manifestEtag }
Assert-Condition -Condition ($conditionalResponse.StatusCode -eq 304) `
  -Message "A revalidacao por ETag retornou $($conditionalResponse.StatusCode), em vez de 304."

$releaseUrl = "$ContentBaseUrl/$($manifest.siteConfigKey)"
$releaseResponse = Invoke-SmokeRequest -Uri $releaseUrl
Assert-Condition -Condition ($releaseResponse.StatusCode -eq 200) `
  -Message "O documento do release retornou $($releaseResponse.StatusCode)."
Assert-Condition -Condition ((Get-HeaderValue -Response $releaseResponse -Name 'Cache-Control') -match 'immutable') `
  -Message 'O documento versionado nao usa cache imutavel.'

$releaseResponse.Content | ConvertFrom-Json | Out-Null
$calculatedSha256 = Get-CanonicalJsonSha256 -Json $releaseResponse.Content
Assert-Condition -Condition ($calculatedSha256 -eq $manifest.sha256) `
  -Message 'O SHA-256 do documento publicado diverge do manifest.'

if ($ApiUrl) {
  $ApiUrl = $ApiUrl.TrimEnd('/')
  Assert-Condition -Condition ($ApiUrl -match '^https://') -Message 'ApiUrl deve usar HTTPS.'
  $apiHealthResponse = Invoke-SmokeRequest -Uri "$ApiUrl/health"
Assert-Condition -Condition ($apiHealthResponse.StatusCode -eq 204) `
    -Message "O health check da API retornou $($apiHealthResponse.StatusCode)."
  $sessionResponse = Invoke-SmokeRequest -Uri "$ApiUrl/api/session"
  Assert-Condition -Condition ($sessionResponse.StatusCode -eq 401) `
    -Message "A API aceitou uma sessao sem IAP ou retornou estado inesperado: $($sessionResponse.StatusCode)."
}

Write-Host 'Smoke check concluido: site, runtime config, manifest, ETag, release e SHA-256 validos.'
