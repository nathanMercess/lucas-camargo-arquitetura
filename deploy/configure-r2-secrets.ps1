[CmdletBinding()]
param(
  [string]$ProjectId = 'lucas-camargo-arq-prod'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$authorizedAccount = 'nathan66merces@gmail.com'
$r2AccountId = '99a49091ddf94483f850f6047919e65d'
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

function Test-SecretExists {
  param(
    [Parameter(Mandatory)]
    [string]$SecretName
  )

  & $gcloudCommand secrets describe $SecretName `
    "--account=$authorizedAccount" `
    "--project=$ProjectId" *> $null

  return $LASTEXITCODE -eq 0
}

function Add-SecretVersion {
  param(
    [Parameter(Mandatory)]
    [string]$SecretName,
    [Parameter(Mandatory)]
    [string]$SecretValue
  )

  $temporaryFile = [IO.Path]::GetTempFileName()

  try {
    $utf8WithoutBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($temporaryFile, $SecretValue, $utf8WithoutBom)

    Invoke-Gcloud -GcloudArguments @(
      'secrets', 'versions', 'add', $SecretName,
      "--data-file=$temporaryFile",
      "--account=$authorizedAccount",
      "--project=$ProjectId",
      '--quiet'
    )
  }
  finally {
    if (Test-Path -LiteralPath $temporaryFile) {
      Remove-Item -LiteralPath $temporaryFile -Force
    }
  }
}

function Ensure-Secret {
  param(
    [Parameter(Mandatory)]
    [string]$SecretName
  )

  if (Test-SecretExists -SecretName $SecretName) {
    return
  }

  Invoke-Gcloud -GcloudArguments @(
    'secrets', 'create', $SecretName,
    '--replication-policy=automatic',
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

$r2Credential = Get-Credential `
  -Message 'Cloudflare R2: use Access Key ID em User name e Secret Access Key em Password.'

if ($null -eq $r2Credential) {
  throw 'A entrada das credenciais foi cancelada.'
}

$accessKeyId = $r2Credential.UserName.Trim()
$secretAccessKeySecure = $r2Credential.Password

if ($accessKeyId -notmatch '^[A-Za-z0-9_-]{16,128}$') {
  throw 'O Access Key ID não possui o formato esperado.'
}

$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretAccessKeySecure)
$secretAccessKey = $null

try {
  $secretAccessKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)

  if ([string]::IsNullOrWhiteSpace($secretAccessKey)) {
    throw 'O Secret Access Key não pode ficar vazio.'
  }

  Invoke-Gcloud -GcloudArguments @(
    'services', 'enable', 'secretmanager.googleapis.com',
    "--account=$authorizedAccount",
    "--project=$ProjectId"
  )

  foreach ($secretName in @('lucas-r2-endpoint', 'lucas-r2-access-key-id', 'lucas-r2-secret-access-key')) {
    Ensure-Secret -SecretName $secretName
  }

  Add-SecretVersion -SecretName 'lucas-r2-endpoint' `
    -SecretValue "https://$r2AccountId.r2.cloudflarestorage.com"
  Add-SecretVersion -SecretName 'lucas-r2-access-key-id' -SecretValue $accessKeyId
  Add-SecretVersion -SecretName 'lucas-r2-secret-access-key' -SecretValue $secretAccessKey
}
finally {
  if ($secretPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
  }

  $secretAccessKey = $null
  $secretAccessKeySecure = $null
}

Write-Host 'Credenciais do R2 armazenadas no Google Secret Manager sem exposição no repositório.'
