param(
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$Source = Join-Path $RepoRoot 'plugins\wfe'
$PluginRoot = Join-Path $env:USERPROFILE '.codex\plugins\wfe'
$MarketplaceDir = Join-Path $env:USERPROFILE '.agents\plugins'
$MarketplacePath = Join-Path $MarketplaceDir 'marketplace.json'
$SourcePath = './.codex/plugins/wfe'

if (-not (Test-Path (Join-Path $Source 'plugin.json'))) {
  throw "WFE plugin package not found at $Source"
}

if (Test-Path (Join-Path $PluginRoot 'plugin.json')) {
  $existingPlugin = Get-Content (Join-Path $PluginRoot 'plugin.json') -Raw | ConvertFrom-Json
  if ($existingPlugin.name -ne 'wfe') {
    throw "Refusing to replace non-WFE plugin at $PluginRoot"
  }
}

if (Test-Path $MarketplacePath) {
  try {
    $marketplace = Get-Content $MarketplacePath -Raw | ConvertFrom-Json
  } catch {
    throw "Existing marketplace.json is invalid JSON; refusing to modify it."
  }

  if (-not $marketplace.plugins) {
    $marketplace | Add-Member -NotePropertyName plugins -NotePropertyValue @()
  }

  $conflict = @($marketplace.plugins) | Where-Object {
    $_.name -eq 'wfe' -and $_.source.path -ne $SourcePath
  }
  if ($conflict) {
    throw "Existing marketplace already defines a different 'wfe' source; refusing to replace it."
  }
} else {
  $marketplace = [pscustomobject]@{
    name = 'personal-local'
    interface = [pscustomobject]@{
      displayName = 'Personal Local Plugins'
    }
    plugins = @()
  }
}

$wfeEntry = [pscustomobject]@{
  name = 'wfe'
  source = [pscustomobject]@{
    source = 'local'
    path = $SourcePath
  }
  policy = [pscustomobject]@{
    installation = 'AVAILABLE'
    authentication = 'ON_INSTALL'
  }
  category = 'Developer Tools'
}

$otherPlugins = @($marketplace.plugins) | Where-Object { $_.name -ne 'wfe' }
$marketplace.plugins = @($otherPlugins) + @($wfeEntry)

if ($WhatIf) {
  Write-Host 'WFE local plugin install preflight: PASS' -ForegroundColor Green
  Write-Host "Source:      $Source"
  Write-Host "Destination: $PluginRoot"
  Write-Host "Marketplace: $MarketplacePath"
  exit 0
}

New-Item -ItemType Directory -Force -Path $PluginRoot | Out-Null
New-Item -ItemType Directory -Force -Path $MarketplaceDir | Out-Null

Copy-Item (Join-Path $Source '*') $PluginRoot -Recurse -Force

if (Test-Path $MarketplacePath) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  Copy-Item $MarketplacePath "$MarketplacePath.bak-$stamp"
}

$marketplace | ConvertTo-Json -Depth 20 | Set-Content -Path $MarketplacePath -Encoding utf8

Write-Host 'WFE local ChatGPT plugin installed.' -ForegroundColor Green
Write-Host "Plugin:      $PluginRoot"
Write-Host "Marketplace: $MarketplacePath"
Write-Host 'Restart ChatGPT Desktop, open Plugins, select the personal local marketplace, and install WFE.'
