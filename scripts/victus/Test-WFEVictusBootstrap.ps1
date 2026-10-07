$ErrorActionPreference = 'Stop'
$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'Start-WFEVictusBootstrap.ps1'), [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw 'Bootstrap syntax invalid' }
$definition = $ast.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Test-WfeProcessIdentity'}, $true)
if (-not $definition) { throw 'Missing ownership validator' }
# Load only the canonical pure validator, never execute the bootstrap in unit tests.
. ([scriptblock]::Create($definition.Extent.Text))
$node = 'C:\Program Files\nodejs\node.exe'
$entry = 'F:\WFE-Next\src\server.js'
$tests = @(
    @{Command='"C:\Program Files\nodejs\node.exe" "F:\WFE-Next\src\server.js" '; Exe=$node; Expected=$true},
    @{Command='"C:\Program Files\nodejs\node.exe" "f:\wfe-next\src\server.js"'; Exe=$node; Expected=$true},
    @{Command='"C:\Program Files\nodejs\node.exe" "F:\WFE-Next\src\server.js" --other'; Exe=$node; Expected=$false},
    @{Command='"C:\Program Files\nodejs\node.exe" "F:\WFE-Plugin-Test\src\server.js"'; Exe=$node; Expected=$false},
    @{Command='"C:\Program Files\nodejs\node.exe" "F:\WFE-Next\src\server.js"'; Exe='C:\other\node.exe'; Expected=$false},
    @{Command=$null; Exe=$null; Expected=$false}
)
foreach ($test in $tests) {
    $process = [pscustomobject]@{ExecutablePath=$test.Exe; CommandLine=$test.Command}
    if ((Test-WfeProcessIdentity $process $node $entry) -ne $test.Expected) { throw "Ownership regression: $($test.Command)" }
}
Write-Output 'PASS: 6 process ownership cases and bootstrap syntax'
