[CmdletBinding()]
param(
  [string]$ProjectId = 'lucas-camargo-arq-prod',
  [string]$Region = 'us-central1',
  [string]$ServiceName = 'lucas-camargo-site',
  [string]$Domain = 'lucascamargo.com',
  [switch]$OnlyApex,
  [switch]$StartVerification
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$authorizedAccount = 'nathan66merces@gmail.com'
$gcloudCommand = (Get-Command gcloud.cmd -ErrorAction Stop).Source

function Invoke-Gcloud {
  param(
    [Parameter(Mandatory)]
    [string[]]$GcloudArguments
  )

  & $gcloudCommand @GcloudArguments

  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar: gcloud $($GcloudArguments -join ' ')"
  }
}

$activeAccounts = @(
  @(& $gcloudCommand auth list --filter='status:ACTIVE' --format='value(account)') |
    Where-Object { $_ }
)

if ($LASTEXITCODE -ne 0) {
  throw 'Não foi possível consultar a conta ativa do Google Cloud.'
}

if ($activeAccounts.Count -ne 1 -or $activeAccounts[0] -ne $authorizedAccount) {
  throw "A única conta ativa deve ser $authorizedAccount. Conta encontrada: $($activeAccounts -join ', ')."
}

$verifiedDomains = @(
  @(
    & $gcloudCommand domains list-user-verified `
      '--format=value(id)' `
      "--account=$authorizedAccount" `
      "--project=$ProjectId"
  ) | Where-Object { $_ }
)

if ($LASTEXITCODE -ne 0) {
  throw 'Não foi possível consultar os domínios verificados da conta autorizada.'
}

if ($verifiedDomains -notcontains $Domain) {
  if ($StartVerification) {
    Invoke-Gcloud -GcloudArguments @(
      'domains', 'verify', $Domain,
      "--account=$authorizedAccount",
      "--project=$ProjectId"
    )
  }

  throw "O domínio $Domain ainda precisa ser verificado para $authorizedAccount. Execute este script com -StartVerification e adicione o TXT apresentado na Hostinger."
}

$domains = @($Domain)

if (-not $OnlyApex) {
  $domains += "www.$Domain"
}

$accessToken = (& $gcloudCommand auth print-access-token "--account=$authorizedAccount").Trim()

if ($LASTEXITCODE -ne 0 -or -not $accessToken) {
  throw 'Não foi possível obter um token temporário da conta autorizada.'
}

try {
  $requestHeaders = @{
    Authorization = "Bearer $accessToken"
    'Content-Type' = 'application/json'
  }
  $collectionUri = "https://${Region}-run.googleapis.com/apis/domains.cloudrun.com/v1/namespaces/$ProjectId/domainmappings"

  foreach ($mappedDomain in $domains) {
    $encodedDomain = [Uri]::EscapeDataString($mappedDomain)
    $mappingUri = "$collectionUri/$encodedDomain"
    $mapping = $null

    try {
      $mapping = Invoke-RestMethod -Method Get -Uri $mappingUri -Headers $requestHeaders -TimeoutSec 30
    }
    catch {
      $statusCode = [int]$_.Exception.Response.StatusCode

      if ($statusCode -ne 404) {
        throw
      }

      $requestBody = @{
        apiVersion = 'domains.cloudrun.com/v1'
        kind = 'DomainMapping'
        metadata = @{
          name = $mappedDomain
          namespace = $ProjectId
        }
        spec = @{
          routeName = $ServiceName
          certificateMode = 'AUTOMATIC'
        }
      } | ConvertTo-Json -Depth 5

      $mapping = Invoke-RestMethod -Method Post -Uri $collectionUri -Headers $requestHeaders `
        -Body $requestBody -TimeoutSec 60
    }

    if ($mapping.spec.routeName -ne $ServiceName) {
      throw "O domínio $mappedDomain já está associado ao serviço $($mapping.spec.routeName)."
    }

    Write-Host "`nDomínio: $mappedDomain"

    $mapping.status.resourceRecords | ForEach-Object {
      $recordNameProperty = $_.PSObject.Properties['name']

      [PSCustomObject]@{
        Type = $_.type
        Name = if ($recordNameProperty) { $recordNameProperty.Value } else { '@' }
        Value = $_.rrdata
      }
    } | Format-Table -AutoSize

    $mapping.status.conditions | ForEach-Object {
      $reasonProperty = $_.PSObject.Properties['reason']
      $messageProperty = $_.PSObject.Properties['message']

      [PSCustomObject]@{
        Condition = $_.type
        Status = $_.status
        Reason = if ($reasonProperty) { $reasonProperty.Value } else { '' }
        Message = if ($messageProperty) { $messageProperty.Value } else { '' }
      }
    } | Format-Table -AutoSize -Wrap
  }
}
finally {
  Remove-Variable accessToken -ErrorAction SilentlyContinue
}
