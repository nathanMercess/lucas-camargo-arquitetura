[CmdletBinding()]
param(
  [string]$ProjectId = 'lucas-camargo-arq-prod',
  [string]$Region = 'us-central1',
  [string]$ServiceName = 'lucas-camargo-site',
  [string]$RepositoryName = 'lucas-camargo',
  [switch]$AllowDirty
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$authorizedAccount = 'nathan66merces@gmail.com'
$runtimeAccountName = 'lucas-site-runtime'
$runtimeAccountEmail = "$runtimeAccountName@$ProjectId.iam.gserviceaccount.com"
$gcloudCommand = (Get-Command gcloud.cmd -ErrorAction Stop).Source
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = Split-Path -Parent $scriptDirectory
$cleanupPolicyPath = Join-Path $scriptDirectory 'artifact-cleanup-policy.json'

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

Push-Location $repositoryRoot

try {
  if (-not $AllowDirty) {
    $pendingChanges = @(& git status --porcelain)

    if ($LASTEXITCODE -ne 0) {
      throw 'Não foi possível verificar o estado do repositório Git.'
    }

    if ($pendingChanges.Count -gt 0) {
      throw 'O deploy foi interrompido porque existem alterações sem commit. Faça o commit ou use -AllowDirty conscientemente.'
    }
  }

  $gitSha = (& git rev-parse --short=12 HEAD).Trim()

  if ($LASTEXITCODE -ne 0 -or -not $gitSha) {
    throw 'Não foi possível identificar o commit que será publicado.'
  }

  if ($AllowDirty) {
    $gitSha = "$gitSha-dirty-$(Get-Date -Format 'yyyyMMddHHmmss')"
  }

  Invoke-Gcloud -GcloudArguments @(
    'services', 'enable',
    'artifactregistry.googleapis.com',
    'cloudbuild.googleapis.com',
    'run.googleapis.com',
    "--account=$authorizedAccount",
    "--project=$ProjectId"
  )

  & $gcloudCommand artifacts repositories describe $RepositoryName `
    "--account=$authorizedAccount" `
    "--location=$Region" `
    "--project=$ProjectId" *> $null

  if ($LASTEXITCODE -ne 0) {
    Invoke-Gcloud -GcloudArguments @(
      'artifacts', 'repositories', 'create', $RepositoryName,
      '--repository-format=docker',
      "--location=$Region",
      '--description=Imagens do site Lucas Camargo Arquitetura',
      "--account=$authorizedAccount",
      "--project=$ProjectId",
      '--quiet'
    )
  }

  Invoke-Gcloud -GcloudArguments @(
    'artifacts', 'repositories', 'set-cleanup-policies', $RepositoryName,
    "--location=$Region",
    "--policy=$cleanupPolicyPath",
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )

  & $gcloudCommand iam service-accounts describe $runtimeAccountEmail `
    "--account=$authorizedAccount" `
    "--project=$ProjectId" *> $null

  if ($LASTEXITCODE -ne 0) {
    Invoke-Gcloud -GcloudArguments @(
      'iam', 'service-accounts', 'create', $runtimeAccountName,
      '--display-name=Runtime do site público',
      '--description=Identidade sem permissões adicionais usada pelo frontend público',
      "--account=$authorizedAccount",
      "--project=$ProjectId",
      '--quiet'
    )
  }

  $imageBase = "$Region-docker.pkg.dev/$ProjectId/$RepositoryName/$ServiceName"
  $image = "${imageBase}:$gitSha"
  $productionImage = "${imageBase}:production"

  Invoke-Gcloud -GcloudArguments @(
    'builds', 'submit', '.',
    "--tag=$image",
    "--region=$Region",
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )

  Invoke-Gcloud -GcloudArguments @(
    'run', 'deploy', $ServiceName,
    "--image=$image",
    "--region=$Region",
    '--platform=managed',
    '--allow-unauthenticated',
    '--ingress=all',
    '--execution-environment=gen1',
    '--cpu=1',
    '--memory=128Mi',
    '--concurrency=80',
    '--timeout=15s',
    '--min=0',
    '--max=3',
    '--cpu-throttling',
    '--no-cpu-boost',
    '--port=8080',
    "--service-account=$runtimeAccountEmail",
    '--labels=environment=production,managed-by=gcloud-script',
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )

  Invoke-Gcloud -GcloudArguments @(
    'artifacts', 'docker', 'tags', 'add',
    $image,
    $productionImage,
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )

  $serviceUrl = & $gcloudCommand run services describe $ServiceName `
    "--region=$Region" `
    "--format=value(status.url)" `
    "--account=$authorizedAccount" `
    "--project=$ProjectId"

  if ($LASTEXITCODE -ne 0) {
    throw 'O deploy terminou, mas não foi possível consultar a URL do serviço.'
  }

  Write-Host "Deploy concluído: $serviceUrl"
}
finally {
  Pop-Location
}
