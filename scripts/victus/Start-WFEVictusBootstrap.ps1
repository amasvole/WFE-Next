param(
    [string]$Root = 'F:\WFE\bootstrap',
    [string]$RdcVersion = '0.2.52',
    [ValidatePattern('^[0-9a-f]{40}$')][string]$ExpectedWfeNextSha,
    [ValidatePattern('^[0-9a-f]{64}$')][string]$ExpectedNodeSha256
)

$ErrorActionPreference = 'Stop'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
try { [Console]::InputEncoding = $Utf8NoBom } catch {}
try { [Console]::OutputEncoding = $Utf8NoBom } catch {}
$OutputEncoding = $Utf8NoBom
$PSDefaultParameterValues['Get-Content:Encoding'] = 'UTF8'
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
$logDir = Join-Path $Root 'logs'
$rdcRoot = Join-Path $Root 'rdc'
New-Item -ItemType Directory -Force -Path $Root,$logDir | Out-Null

function Write-BootstrapLog([string]$Message) {
    $line = "$(Get-Date -Format o) $Message`r`n"
    [System.IO.File]::AppendAllText((Join-Path $logDir 'bootstrap.log'), $line, $Utf8NoBom)
}

$utf8Smoke = Join-Path $Root 'runtime\Test-WFEUtf8.ps1'
if (-not (Test-Path -LiteralPath $utf8Smoke -PathType Leaf)) { throw "UTF-8 smoke test missing: $utf8Smoke" }
& $utf8Smoke | ForEach-Object { Write-BootstrapLog "UTF8 $_" }

$packageJson = Join-Path $rdcRoot 'node_modules\@wonderwhy-er\desktop-commander\package.json'
$entrypoint = Join-Path $rdcRoot 'node_modules\@wonderwhy-er\desktop-commander\dist\index.js'
if (-not (Test-Path -LiteralPath $packageJson -PathType Leaf)) { throw "Pinned RDC package missing: $packageJson" }
if (-not (Test-Path -LiteralPath $entrypoint -PathType Leaf)) { throw "Pinned RDC entrypoint missing: $entrypoint" }
$package = Get-Content -Raw -LiteralPath $packageJson | ConvertFrom-Json
if ([string]$package.version -cne $RdcVersion) { throw "RDC version mismatch: expected=$RdcVersion actual=$($package.version)" }

$node = Get-Command node.exe -ErrorAction Stop
$running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*desktop-commander*' -and $_.CommandLine -like '*remote*' } |
    Select-Object -First 1

if (-not $running) {
    $stdout = Join-Path $logDir 'rdc-remote.out.log'
    $stderr = Join-Path $logDir 'rdc-remote.err.log'
    Write-BootstrapLog "START rdc-remote version=$RdcVersion node=$($node.Source)"
    Start-Process -FilePath $node.Source -ArgumentList @($entrypoint,'remote') -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr | Out-Null
} else {
    Write-BootstrapLog "SKIP rdc-remote already running pid=$($running.ProcessId)"
}

# Extend the existing login bootstrap, not a second scheduler or supervisor.
$repo = 'F:\WFE-Next'
$git = 'C:\Program Files\Git\cmd\git.exe'
$nodePath = 'C:\Program Files\nodejs\node.exe'
$statePath = Join-Path $repo '.wfe-next\state.json'
$mutex = New-Object System.Threading.Mutex($false, 'Local\WFEVictusUserBootstrap')
$locked = $false
$started = @()
$priorPort = $env:WFE_MCP_PORT
$priorOrigin = $env:WFE_OPERATOR_ORIGIN
try {
    try { $locked = $mutex.WaitOne(0) } catch [System.Threading.AbandonedMutexException] { $locked = $true }
    if (-not $locked) { throw 'WFE bootstrap already in progress' }
    if (-not $ExpectedWfeNextSha -and -not $ExpectedNodeSha256) {
        $binding = Get-Content -LiteralPath (Join-Path $Root 'runtime\wfe-next-startup-binding.json') -Raw | ConvertFrom-Json
        if (($binding.PSObject.Properties.Name | Sort-Object) -join ',' -cne 'nodeSha256,sourceSha' -or $binding.sourceSha -cnotmatch '^[0-9a-f]{40}$' -or $binding.nodeSha256 -cnotmatch '^[0-9a-f]{64}$') { throw 'Invalid fixed startup binding' }
        $ExpectedWfeNextSha = $binding.sourceSha
        $ExpectedNodeSha256 = $binding.nodeSha256
    }
    if (-not $ExpectedWfeNextSha -or -not $ExpectedNodeSha256) { throw 'Both source and Node bindings required' }
    $sha = & $git -C $repo rev-parse HEAD
    if ($LASTEXITCODE -ne 0 -or $sha -cne $ExpectedWfeNextSha) { throw 'WFE source SHA mismatch' }
    $dirty = & $git -C $repo status --porcelain --untracked-files=normal
    if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'WFE source worktree is not clean' }
    $canonicalBootstrap = Join-Path $repo 'scripts\victus\Start-WFEVictusBootstrap.ps1'
    if ((Get-FileHash -LiteralPath $PSCommandPath).Hash -ne (Get-FileHash -LiteralPath $canonicalBootstrap).Hash) { throw 'WFE deployed bootstrap differs from pinned source' }
    if ((Get-FileHash -LiteralPath $nodePath).Hash.ToLowerInvariant() -cne $ExpectedNodeSha256) { throw 'WFE Node hash mismatch' }
    $version = & $nodePath --version
    if ($LASTEXITCODE -ne 0 -or [int]($version.TrimStart('v').Split('.')[0]) -lt 22) { throw 'WFE requires Node >=22' }
    # The kernel otherwise silently falls back to empty state on load errors.
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    if ($null -eq $state.projects -or $state.projects -isnot [pscustomobject]) { throw 'Canonical state missing/malformed; refuse empty-state recovery' }
    $stateHash = (Get-FileHash -LiteralPath $statePath).Hash
    $fingerprintFiles = @('src/server.js','src/project-status.js','src/kernel.js','src/product-mutation.js','src/product-contract.js','src/product-control-http.js','src/provider.js','src/plan-output.js','src/workspace-files.js','src/browser-runtime.js','src/browser-procedure.js','scripts/browser-executor.js')
    $fingerprintText = ($fingerprintFiles | ForEach-Object { [IO.File]::ReadAllText((Join-Path $repo $_)) }) -join ''
    $sha256 = [Security.Cryptography.SHA256]::Create()
    try { $loadedCode = ([BitConverter]::ToString($sha256.ComputeHash([Text.Encoding]::UTF8.GetBytes($fingerprintText)))).Replace('-','').ToLowerInvariant() } finally { $sha256.Dispose() }
    $env:WFE_MCP_PORT = '4327'
    $env:WFE_OPERATOR_ORIGIN = 'http://127.0.0.1:4317'
    foreach ($component in @(
        @{Name='operator'; Port=4317; Entry='src\server.js'},
        @{Name='mcp'; Port=4327; Entry='integrations\wfe-mcp\src\server.mjs'}
    )) {
        $entry = Join-Path $repo $component.Entry
        $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -eq $component.Port })
        $existing = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
            $_.ExecutablePath -eq $nodePath -and $_.CommandLine -match ([regex]::Escape('"' + $entry + '"') + '$')
        })
        if ($listeners.Count -gt 1 -or $existing.Count -gt 1) { throw "Duplicate $($component.Name) ownership" }
        if ($listeners.Count -eq 1) {
            if ($listeners[0].LocalAddress -ne '127.0.0.1' -or $existing.Count -ne 1 -or $existing[0].ProcessId -ne $listeners[0].OwningProcess) { throw "Foreign $($component.Name) listener; refusing replacement" }
            $componentPid = $existing[0].ProcessId
            Write-BootstrapLog "WFE REUSE $($component.Name) pid=$componentPid"
        } else {
            if ($existing.Count) { throw "Existing $($component.Name) process is not ready; refusing duplicate" }
            $proc = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $entry + '"')) -WorkingDirectory $repo -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir "wfe-$($component.Name).out.log") -RedirectStandardError (Join-Path $logDir "wfe-$($component.Name).err.log")
            $started += $proc
            $componentPid = $proc.Id
            Write-BootstrapLog "WFE START $($component.Name) pid=$componentPid sha=$sha"
        }
        $ready = $false
        $deadline = (Get-Date).AddSeconds(30)
        do {
            try {
                if ($component.Name -eq 'operator') {
                    $snapshot = Invoke-RestMethod -Uri 'http://127.0.0.1:4317/api/state' -TimeoutSec 2
                    if ($snapshot.operator.pid -ne $componentPid -or $snapshot.operator.root -ne $repo -or $snapshot.operator.loadedCode -cne $loadedCode) { throw 'Operator identity mismatch' }
                    $ready = $true
                } else {
                    $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4327/mcp' -Method POST -ContentType 'application/json' -Headers @{Accept='application/json, text/event-stream'} -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' -TimeoutSec 2
                    $json = ($response.Content -split "`n" | Where-Object { $_ -like 'data: *' } | Select-Object -First 1) -replace '^data: ', ''
                    if (-not $json) { $json = $response.Content }
                    $discovery = $json | ConvertFrom-Json
                    if ($discovery.error -or -not $discovery.result.tools.Count) { throw 'MCP discovery unavailable' }
                    $ready = $true
                }
            } catch { $lastReadinessError = $_.Exception.Message }
            if (-not $ready) { Start-Sleep -Milliseconds 250 }
        } while (-not $ready -and (Get-Date) -lt $deadline)
        if (-not $ready) { throw "$($component.Name) readiness timeout: $lastReadinessError" }
        Write-BootstrapLog "WFE READY $($component.Name) pid=$componentPid port=$($component.Port)"
    }
    if ((Get-FileHash -LiteralPath $statePath).Hash -ne $stateHash) { throw 'Canonical state changed during startup' }
    Write-BootstrapLog 'USER BOOTSTRAP COMPLETE WFE READY'
} catch {
    Write-BootstrapLog "WFE BOOTSTRAP FAILED $($_.Exception.Message)"
    # Only terminate children created by this failed invocation, never reused services.
    foreach ($proc in $started) { if (-not $proc.HasExited) { Stop-Process -InputObject $proc -ErrorAction SilentlyContinue } }
    throw
} finally {
    $env:WFE_MCP_PORT = $priorPort
    $env:WFE_OPERATOR_ORIGIN = $priorOrigin
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
