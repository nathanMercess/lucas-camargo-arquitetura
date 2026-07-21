[CmdletBinding()]
param(
  [string]$ProjectId = 'lucas-camargo-arq-prod',
  [string]$Region = 'us-central1',
  [string]$ServiceName = 'lucas-camargo-admin',
  [string]$RepositoryName = 'lucas-camargo',
  [string]$PrivateBucket = 'lucas-camargo-private',
  [string]$PublishedBucket = 'lucas-camargo-published',
  [Parameter(Mandatory)]
  [string]$PublishedBaseUrl,
  [string]$R2EndpointSecret = 'lucas-r2-endpoint',
  [string]$R2AccessKeySecret = 'lucas-r2-access-key-id',
  [string]$R2SecretKeySecret = 'lucas-r2-secret-access-key',
  [switch]$AllowDirty
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$authorizedAccount = 'nathan66merces@gmail.com'
$runtimeAccountName = 'lucas-admin-runtime'
$runtimeAccountEmail = "$runtimeAccountName@$ProjectId.iam.gserviceaccount.com"
$gcloudCommand = (Get-Command gcloud.cmd -ErrorAction Stop).Source
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = Split-Path -Parent $scriptDirectory
$cloudBuildConfigPath = Join-Path $scriptDirectory 'cloudbuild-admin.yaml'
$cleanupPolicyPath = Join-Path $scriptDirectory 'artifact-cleanup-policy.json'
$requiredSecrets = @($R2EndpointSecret, $R2AccessKeySecret, $R2SecretKeySecret)

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

[Uri]$parsedPublishedBaseUrl = $null
$hasAbsolutePublishedUrl = [Uri]::TryCreate(
  $PublishedBaseUrl,
  [UriKind]::Absolute,
  [ref]$parsedPublishedBaseUrl
)
$hasSafePublishedUrl = (
  $hasAbsolutePublishedUrl -and
  $parsedPublishedBaseUrl.Scheme -eq 'https' -and
  [string]::IsNullOrEmpty($parsedPublishedBaseUrl.UserInfo) -and
  [string]::IsNullOrEmpty($parsedPublishedBaseUrl.Query) -and
  [string]::IsNullOrEmpty($parsedPublishedBaseUrl.Fragment) -and
  $parsedPublishedBaseUrl.AbsolutePath -eq '/content'
)

if (-not $hasSafePublishedUrl) {
  throw 'PublishedBaseUrl deve ser uma URL HTTPS sem credenciais, query, fragmento ou barra final e terminada em /content.'
}

$PublishedBaseUrl = $parsedPublishedBaseUrl.GetLeftPart([UriPartial]::Path)

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

  Invoke-Gcloud -GcloudArguments @(
    'services', 'enable',
    'artifactregistry.googleapis.com',
    'cloudbuild.googleapis.com',
    'cloudresourcemanager.googleapis.com',
    'iap.googleapis.com',
    'run.googleapis.com',
    'secretmanager.googleapis.com',
    "--account=$authorizedAccount",
    "--project=$ProjectId"
  )

  $missingSecrets = @(
    $requiredSecrets | Where-Object {
      -not (Test-GcloudResource -GcloudArguments @(
        'secrets', 'versions', 'access', 'latest',
        "--secret=$_",
        "--account=$authorizedAccount",
        "--project=$ProjectId"
      ))
    }
  )

  if ($missingSecrets.Count -gt 0) {
    throw "Crie as credenciais do R2 no Secret Manager antes do deploy. Segredos ausentes ou sem versão acessível: $($missingSecrets -join ', ')."
  }

  $runtimeAccountExists = Test-GcloudResource -GcloudArguments @(
    'iam', 'service-accounts', 'describe', $runtimeAccountEmail,
    "--account=$authorizedAccount",
    "--project=$ProjectId"
  )

  if (-not $runtimeAccountExists) {
    Invoke-Gcloud -GcloudArguments @(
      'iam', 'service-accounts', 'create', $runtimeAccountName,
      '--display-name=Runtime do painel administrativo',
      '--description=Identidade de mínimo privilégio para o admin e os segredos do R2',
      "--account=$authorizedAccount",
      "--project=$ProjectId",
      '--quiet'
    )
  }

  foreach ($secretName in $requiredSecrets) {
    Invoke-Gcloud -GcloudArguments @(
      'secrets', 'add-iam-policy-binding', $secretName,
      "--member=serviceAccount:$runtimeAccountEmail",
      '--role=roles/secretmanager.secretAccessor',
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

  $gitSha = (& git rev-parse --short=12 HEAD).Trim()

  if ($LASTEXITCODE -ne 0 -or -not $gitSha) {
    throw 'Não foi possível identificar o commit que será publicado.'
  }

  if ($AllowDirty) {
    $gitSha = "$gitSha-dirty-$(Get-Date -Format 'yyyyMMddHHmmss')"
  }

  $projectNumber = (& $gcloudCommand projects describe $ProjectId `
    '--format=value(projectNumber)' `
    "--account=$authorizedAccount").Trim()

  if ($LASTEXITCODE -ne 0 -or -not $projectNumber) {
    throw 'Não foi possível consultar o número do projeto.'
  }

  $iapAudience = "/projects/$projectNumber/locations/$Region/services/$ServiceName"
  $canonicalAdminUrl = "https://$ServiceName-$projectNumber.$Region.run.app"
  $imageBase = "$Region-docker.pkg.dev/$ProjectId/$RepositoryName/$ServiceName"
  $image = "${imageBase}:$gitSha"
  $productionImage = "${imageBase}:production"
  $runtimeEnvironmentVariables = "NODE_ENV=production,AUTH_MODE=iap,STORAGE_DRIVER=r2,SERVE_ADMIN_STATIC=true,ADMIN_STATIC_DIRECTORY=/app/admin,INITIAL_OWNER_EMAIL=$authorizedAccount,IAP_EXPECTED_AUDIENCE=$iapAudience,ADMIN_ALLOWED_ORIGINS=$canonicalAdminUrl,R2_PRIVATE_BUCKET=$PrivateBucket,R2_PUBLISHED_BUCKET=$PublishedBucket"

  $runtimeEnvironmentVariables += ",R2_PUBLISHED_BASE_URL=$PublishedBaseUrl"

  Invoke-Gcloud -GcloudArguments @(
    'builds', 'submit', '.',
    "--config=$cloudBuildConfigPath",
    "--substitutions=_IMAGE=$image",
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
    '--iap',
    '--no-allow-unauthenticated',
    '--ingress=all',
    '--execution-environment=gen1',
    '--cpu=1',
    '--memory=256Mi',
    '--concurrency=4',
    '--timeout=60s',
    '--min=0',
    '--max=1',
    '--cpu-throttling',
    '--no-cpu-boost',
    '--port=8080',
    "--service-account=$runtimeAccountEmail",
    "--set-env-vars=$runtimeEnvironmentVariables",
    "--set-secrets=R2_ENDPOINT=${R2EndpointSecret}:latest,R2_ACCESS_KEY_ID=${R2AccessKeySecret}:latest,R2_SECRET_ACCESS_KEY=${R2SecretKeySecret}:latest",
    '--labels=environment=production,managed-by=gcloud-script,visibility=private',
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )

  $servicePolicy = & $gcloudCommand run services get-iam-policy $ServiceName `
    "--region=$Region" `
    '--format=json' `
    "--account=$authorizedAccount" `
    "--project=$ProjectId" | ConvertFrom-Json

  if ($LASTEXITCODE -ne 0) {
    throw 'Não foi possível auditar a política IAM do serviço administrativo.'
  }

  foreach ($publicMember in @('allUsers', 'allAuthenticatedUsers')) {
    $hasPublicInvoker = $servicePolicy.bindings | Where-Object {
      $_.role -eq 'roles/run.invoker' -and $_.members -contains $publicMember
    }

    if ($hasPublicInvoker) {
      Invoke-Gcloud -GcloudArguments @(
        'run', 'services', 'remove-iam-policy-binding', $ServiceName,
        "--member=$publicMember",
        '--role=roles/run.invoker',
        "--region=$Region",
        "--account=$authorizedAccount",
        "--project=$ProjectId",
        '--quiet'
      )
    }
  }

  Invoke-Gcloud -GcloudArguments @(
    'run', 'services', 'add-iam-policy-binding', $ServiceName,
    "--member=serviceAccount:service-$projectNumber@gcp-sa-iap.iam.gserviceaccount.com",
    '--role=roles/run.invoker',
    "--region=$Region",
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )

  Invoke-Gcloud -GcloudArguments @(
    'iap', 'web', 'add-iam-policy-binding',
    '--resource-type=cloud-run',
    "--service=$ServiceName",
    "--region=$Region",
    "--member=user:$authorizedAccount",
    '--role=roles/iap.httpsResourceAccessor',
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

  Write-Host "Painel protegido por IAP publicado em: $canonicalAdminUrl"
}
finally {
  Pop-Location
}
