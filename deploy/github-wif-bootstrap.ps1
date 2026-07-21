[CmdletBinding()]
param(
  [string]$ProjectId = 'lucas-camargo-arq-prod',
  [string]$Region = 'us-central1',
  [string]$RepositoryName = 'lucas-camargo',
  [string]$GitHubOwner = 'nathanMercess',
  [string]$GitHubRepository = 'lucas-camargo-arquitetura',
  [string]$PoolId = 'github-actions',
  [string]$ProviderId = 'github',
  [string]$DeployAccountName = 'github-deployer'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$authorizedAccount = 'nathan66merces@gmail.com'
$adminServiceName = 'lucas-camargo-admin'
$publicRuntimeAccountName = 'lucas-site-runtime'
$adminRuntimeAccountName = 'lucas-admin-runtime'
$deployAccountEmail = "$DeployAccountName@$ProjectId.iam.gserviceaccount.com"
$publicRuntimeAccountEmail = "$publicRuntimeAccountName@$ProjectId.iam.gserviceaccount.com"
$adminRuntimeAccountEmail = "$adminRuntimeAccountName@$ProjectId.iam.gserviceaccount.com"
$cleanupPolicyPath = Join-Path $PSScriptRoot 'artifact-cleanup-policy.json'
$gcloudCommand = (Get-Command gcloud.cmd -ErrorAction Stop).Source
$requiredSecrets = @(
  'lucas-r2-endpoint',
  'lucas-r2-access-key-id',
  'lucas-r2-secret-access-key'
)

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

function Ensure-ServiceAccount {
  param(
    [Parameter(Mandatory)]
    [string]$AccountName,
    [Parameter(Mandatory)]
    [string]$AccountEmail,
    [Parameter(Mandatory)]
    [string]$DisplayName,
    [Parameter(Mandatory)]
    [string]$Description
  )

  $exists = Test-GcloudResource -GcloudArguments @(
    'iam', 'service-accounts', 'describe', $AccountEmail,
    "--account=$authorizedAccount",
    "--project=$ProjectId"
  )

  if ($exists) {
    return
  }

  Invoke-Gcloud -GcloudArguments @(
    'iam', 'service-accounts', 'create', $AccountName,
    "--display-name=$DisplayName",
    "--description=$Description",
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )
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

$repositorySlug = "$GitHubOwner/$GitHubRepository"

Invoke-Gcloud -GcloudArguments @(
  'services', 'enable',
    'artifactregistry.googleapis.com',
    'cloudresourcemanager.googleapis.com',
    'iam.googleapis.com',
  'iamcredentials.googleapis.com',
  'iap.googleapis.com',
  'run.googleapis.com',
  'secretmanager.googleapis.com',
  'sts.googleapis.com',
  "--account=$authorizedAccount",
  "--project=$ProjectId",
  '--quiet'
)

$projectNumber = (& $gcloudCommand projects describe $ProjectId `
  '--format=value(projectNumber)' `
  "--account=$authorizedAccount").Trim()

if ($LASTEXITCODE -ne 0 -or -not $projectNumber) {
  throw 'Não foi possível consultar o número do projeto.'
}

Ensure-ServiceAccount `
  -AccountName $DeployAccountName `
  -AccountEmail $deployAccountEmail `
  -DisplayName 'GitHub Actions deployer' `
  -Description 'Identidade federada de mínimo privilégio para deploy da main'

Ensure-ServiceAccount `
  -AccountName $publicRuntimeAccountName `
  -AccountEmail $publicRuntimeAccountEmail `
  -DisplayName 'Runtime do site público' `
  -Description 'Identidade sem permissões adicionais usada pelo frontend público'

Ensure-ServiceAccount `
  -AccountName $adminRuntimeAccountName `
  -AccountEmail $adminRuntimeAccountEmail `
  -DisplayName 'Runtime do painel administrativo' `
  -Description 'Identidade de mínimo privilégio para o admin e os segredos do R2'

$repositoryExists = Test-GcloudResource -GcloudArguments @(
  'artifacts', 'repositories', 'describe', $RepositoryName,
  "--location=$Region",
  "--account=$authorizedAccount",
  "--project=$ProjectId"
)

if (-not $repositoryExists) {
  Invoke-Gcloud -GcloudArguments @(
    'artifacts', 'repositories', 'create', $RepositoryName,
    '--repository-format=docker',
    "--location=$Region",
    '--description=Imagens do site e do painel Lucas Camargo Arquitetura',
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

$poolExists = Test-GcloudResource -GcloudArguments @(
  'iam', 'workload-identity-pools', 'describe', $PoolId,
  '--location=global',
  "--account=$authorizedAccount",
  "--project=$ProjectId"
)

if (-not $poolExists) {
  Invoke-Gcloud -GcloudArguments @(
    'iam', 'workload-identity-pools', 'create', $PoolId,
    '--location=global',
    '--display-name=GitHub Actions',
    '--description=Identidades OIDC para deploy sem chave estática',
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )
}

$workflowReference = "$repositorySlug/.github/workflows/ci-deploy.yml@refs/heads/main"
$attributeMapping = 'google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner,attribute.ref=assertion.ref,attribute.workflow_ref=assertion.workflow_ref,attribute.environment=assertion.environment'
$attributeCondition = "assertion.repository_owner=='$GitHubOwner' && assertion.repository=='$repositorySlug' && assertion.ref=='refs/heads/main' && assertion.workflow_ref=='$workflowReference' && assertion.environment=='production'"
$providerExists = Test-GcloudResource -GcloudArguments @(
  'iam', 'workload-identity-pools', 'providers', 'describe', $ProviderId,
  "--workload-identity-pool=$PoolId",
  '--location=global',
  "--account=$authorizedAccount",
  "--project=$ProjectId"
)

if ($providerExists) {
  Invoke-Gcloud -GcloudArguments @(
    'iam', 'workload-identity-pools', 'providers', 'update-oidc', $ProviderId,
    "--workload-identity-pool=$PoolId",
    '--location=global',
    '--issuer-uri=https://token.actions.githubusercontent.com',
    "--attribute-mapping=$attributeMapping",
    "--attribute-condition=$attributeCondition",
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )
}
else {
  Invoke-Gcloud -GcloudArguments @(
    'iam', 'workload-identity-pools', 'providers', 'create-oidc', $ProviderId,
    "--workload-identity-pool=$PoolId",
    '--location=global',
    '--issuer-uri=https://token.actions.githubusercontent.com',
    "--attribute-mapping=$attributeMapping",
    "--attribute-condition=$attributeCondition",
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )
}

$federatedRepositoryMember = "principalSet://iam.googleapis.com/projects/$projectNumber/locations/global/workloadIdentityPools/$PoolId/attribute.repository/$repositorySlug"

Invoke-Gcloud -GcloudArguments @(
  'iam', 'service-accounts', 'add-iam-policy-binding', $deployAccountEmail,
  "--member=$federatedRepositoryMember",
  '--role=roles/iam.workloadIdentityUser',
  "--account=$authorizedAccount",
  "--project=$ProjectId",
  '--quiet'
)

Invoke-Gcloud -GcloudArguments @(
  'projects', 'add-iam-policy-binding', $ProjectId,
  "--member=serviceAccount:$deployAccountEmail",
  '--role=roles/run.admin',
  '--condition=None',
  "--account=$authorizedAccount",
  '--quiet'
)

Invoke-Gcloud -GcloudArguments @(
  'artifacts', 'repositories', 'add-iam-policy-binding', $RepositoryName,
  "--location=$Region",
  "--member=serviceAccount:$deployAccountEmail",
  '--role=roles/artifactregistry.writer',
  "--account=$authorizedAccount",
  "--project=$ProjectId",
  '--quiet'
)

foreach ($runtimeAccountEmail in @($publicRuntimeAccountEmail, $adminRuntimeAccountEmail)) {
  Invoke-Gcloud -GcloudArguments @(
    'iam', 'service-accounts', 'add-iam-policy-binding', $runtimeAccountEmail,
    "--member=serviceAccount:$deployAccountEmail",
    '--role=roles/iam.serviceAccountUser',
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )
}

foreach ($secretName in $requiredSecrets) {
  $secretExists = Test-GcloudResource -GcloudArguments @(
    'secrets', 'describe', $secretName,
    "--account=$authorizedAccount",
    "--project=$ProjectId"
  )

  if (-not $secretExists) {
    Write-Warning "O segredo $secretName ainda não existe. Crie sua versão antes do primeiro deploy do admin."
    continue
  }

  Invoke-Gcloud -GcloudArguments @(
    'secrets', 'add-iam-policy-binding', $secretName,
    "--member=serviceAccount:$adminRuntimeAccountEmail",
    '--role=roles/secretmanager.secretAccessor',
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )
}

$adminServiceExists = Test-GcloudResource -GcloudArguments @(
  'run', 'services', 'describe', $adminServiceName,
  "--region=$Region",
  "--account=$authorizedAccount",
  "--project=$ProjectId"
)

if ($adminServiceExists) {
  Invoke-Gcloud -GcloudArguments @(
    'run', 'services', 'add-iam-policy-binding', $adminServiceName,
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
    "--service=$adminServiceName",
    "--region=$Region",
    "--member=user:$authorizedAccount",
    '--role=roles/iap.httpsResourceAccessor',
    "--account=$authorizedAccount",
    "--project=$ProjectId",
    '--quiet'
  )
}
else {
  Write-Warning 'O serviço admin ainda não existe. Execute o bootstrap novamente após o primeiro deploy para concluir os vínculos do IAP.'
}

$providerResource = "projects/$projectNumber/locations/global/workloadIdentityPools/$PoolId/providers/$ProviderId"

Write-Host ''
Write-Host 'Bootstrap concluído. Cadastre estas variáveis no environment production do GitHub:'
Write-Host "GCP_PROJECT_NUMBER=$projectNumber"
Write-Host "GCP_WORKLOAD_IDENTITY_PROVIDER=$providerResource"
Write-Host "GCP_DEPLOY_SERVICE_ACCOUNT=$deployAccountEmail"
