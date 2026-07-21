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

function Test-GcloudResource {
  param(
    [Parameter(Mandatory)]
    [string[]]$GcloudArguments
  )

  $previousErrorActionPreference = $ErrorActionPreference

  try {
    $ErrorActionPreference = 'SilentlyContinue'
    & $gcloudCommand @GcloudArguments *> $null

    return $LASTEXITCODE -eq 0
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
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

foreach ($mappedDomain in $domains) {
  $mappingExists = Test-GcloudResource -GcloudArguments @(
    'beta', 'run', 'domain-mappings', 'describe',
    "--domain=$mappedDomain",
    "--region=$Region",
    "--account=$authorizedAccount",
    "--project=$ProjectId"
  )

  if (-not $mappingExists) {
    Invoke-Gcloud -GcloudArguments @(
      'beta', 'run', 'domain-mappings', 'create',
      "--service=$ServiceName",
      "--domain=$mappedDomain",
      "--region=$Region",
      "--account=$authorizedAccount",
      "--project=$ProjectId",
      '--quiet'
    )
  }

  Invoke-Gcloud -GcloudArguments @(
    'beta', 'run', 'domain-mappings', 'describe',
    "--domain=$mappedDomain",
    "--region=$Region",
    '--format=yaml(status.resourceRecords,status.conditions)',
    "--account=$authorizedAccount",
    "--project=$ProjectId"
  )
}
