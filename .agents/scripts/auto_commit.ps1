<#
  .agents/scripts/auto_commit.ps1

  Helper script to stage and commit generated agent artifacts.
  Safe by default: requires `.agents/autocommit.json` enabled=true and prompts for confirmation.

  Usage (interactive):
    pwsh .agents/scripts/auto_commit.ps1

  Non-interactive (explicit consent):
    $env:AUTOCOMMIT_ALLOW = 'true'; pwsh .agents/scripts/auto_commit.ps1
#>

param()

Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$configPath = Join-Path $root '..\autocommit.json' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $configPath) {
  Write-Error "Missing .agents/autocommit.json. Abort."
  exit 1
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
if (-not $config.enabled) {
  Write-Host "Autocommit disabled in .agents/autocommit.json. Enable to proceed."; exit 0
}

if (-not $env:AUTOCOMMIT_ALLOW) {
  Write-Host "Autocommit ready. Files to commit:";
  foreach ($f in $config.files) { Write-Host " - $f" }
  $confirm = Read-Host "Proceed to stage and commit these files? (y/N)"
  if ($confirm -ne 'y') { Write-Host 'Aborting.'; exit 0 }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error 'git not found in PATH'; exit 1 }

# Stage files
foreach ($f in $config.files) {
  git add $f 2>$null
}

$msg = $config.commit_message_template
if (-not $msg) { $msg = 'chore(agents): update generated artifacts' }

git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Host 'Nothing to commit or commit failed.'; exit 0 }
Write-Host 'Autocommit complete.'
