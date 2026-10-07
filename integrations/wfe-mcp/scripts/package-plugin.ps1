param([Parameter(Mandatory=$true)][string]$OutputPath)
$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$source=Join-Path $repoRoot 'plugins\wfe'
$manifest=Get-Content -LiteralPath (Join-Path $source 'plugin.json') -Raw | ConvertFrom-Json
$connection=Get-Content -LiteralPath (Join-Path $source 'mcp.json') -Raw | ConvertFrom-Json
if($manifest.name -ne 'wfe' -or $connection.mcpServers.'wfe-local'.type -ne 'streamable-http'){throw 'Unexpected integration contract'}
$target=[System.IO.Path]::GetFullPath($OutputPath)
if($target.StartsWith($source+[System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase)){throw 'Output must be outside plugin source'}
if(Test-Path -LiteralPath $target){throw 'Refusing to overwrite existing package'}
if(-not(Test-Path -LiteralPath ([System.IO.Path]::GetDirectoryName($target)))){throw 'Output parent must already exist'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[System.IO.Compression.ZipFile]::Open($target,[System.IO.Compression.ZipArchiveMode]::Create)
try{
 foreach($name in @('plugin.json','mcp.json')){
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path $source $name),('wfe/'+$name)) | Out-Null
 }
}finally{$archive.Dispose()}
Write-Output $target

