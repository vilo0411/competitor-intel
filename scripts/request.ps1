# PowerShell twin of scripts/request.sh (for Codex / agents on Windows without Git Bash). Needs only git.
#   powershell -File scripts/request.ps1 run "Gorillanomics" @gorillanomics [-Refresh] [-Style 5] [-Limit 300]
#   powershell -File scripts/request.ps1 push "agent: labels + insights"
#   powershell -File scripts/request.ps1 wait
#   powershell -File scripts/request.ps1 status
param(
  [Parameter(Position = 0)][string]$Command,
  [Parameter(Position = 1, ValueFromRemainingArguments = $true)][string[]]$Rest,
  [switch]$Refresh,
  [int]$Style = 5,
  [int]$Limit = 300,
  [int]$Timeout = 1800
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$repoUrl = (git remote get-url origin) -replace '\.git$', ''

function Invoke-Git { & git @args; if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed" } }

function Wait-Bot([string]$base) {
  Write-Output "Đang chờ GitHub Actions… (xem tiến độ: $repoUrl/actions)"
  $waited = 0
  while ($waited -lt $Timeout) {
    Start-Sleep -Seconds 15; $waited += 15
    $head = ((git ls-remote origin refs/heads/main) -split "`t")[0]
    if ($head -and $head -ne $base) { Invoke-Git pull -q --rebase --autostash origin main; Write-Output "Xong sau ${waited}s."; return $true }
  }
  Write-Error "Hết thời gian chờ (${Timeout}s): $repoUrl/actions"; return $false
}

function Push-AndWait {
  Invoke-Git pull -q --rebase --autostash origin main
  Invoke-Git push -q origin HEAD:main
  Wait-Bot (git rev-parse HEAD)
}

switch ($Command) {
  'run' {
    $channels = @($Rest | Where-Object { $_ -match '^@' -or $_ -match 'tiktok\.com' })
    $name = (@($Rest | Where-Object { $_ -notmatch '^@' -and $_ -notmatch 'tiktok\.com' }) -join ' ').Trim()
    if (-not $name -and -not $channels) { throw 'Cần tên đối thủ hoặc ít nhất một @kenh' }
    $label = if ($name) { $name } else { $channels[0] }
    $id = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss') + '-' + (($label -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower())
    $req = [ordered]@{ id = $id; name = $name; channels = $channels; refresh = [bool]$Refresh; style = $Style; limit = $Limit }
    New-Item -ItemType Directory -Force requests | Out-Null
    # UTF-8 without BOM so Node's JSON.parse accepts it
    [IO.File]::WriteAllText((Join-Path (Get-Location) "requests/$id.json"), ($req | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))
    Invoke-Git add "requests/$id.json"
    Invoke-Git commit -q -m "request: $label"
    if (-not (Push-AndWait)) { exit 1 }
    $runFile = "docs/_runs/$id.json"
    if (-not (Test-Path $runFile)) { Write-Error "Chưa thấy $runFile — chạy: scripts/request.ps1 wait"; exit 1 }
    $r = Get-Content $runFile -Raw -Encoding UTF8 | ConvertFrom-Json
    Write-Output "--- Kết quả ($id) --- status=$($r.status) slug=$($r.slug) report=$($r.report) seconds=$($r.seconds)"
    if ($r.status -ne 'ok') { Write-Output $r.log; exit 1 }
  }
  'push' {
    Invoke-Git add -A docs
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) { Write-Output 'Không có thay đổi để push'; exit 0 }
    $msg = if ($Rest) { $Rest -join ' ' } else { 'agent: update labels/style/insights' }
    Invoke-Git commit -q -m $msg
    if (-not (Push-AndWait)) { exit 1 }
  }
  'wait' { if (-not (Wait-Bot (git rev-parse HEAD))) { exit 1 } }
  'status' {
    Invoke-Git pull -q --rebase --autostash origin main
    Get-ChildItem docs/_runs/*.json -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 10 | ForEach-Object {
      $r = Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json; "$($_.BaseName)  $($r.status)"
    }
  }
  default { Get-Content $PSCommandPath -TotalCount 6 | Select-Object -Skip 1; exit 2 }
}
