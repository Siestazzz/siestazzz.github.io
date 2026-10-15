$ErrorActionPreference = 'Stop'
$credentialFile = Join-Path $env:APPDATA 'xdg.config/.wrangler/config/default.toml'
$credentialText = [IO.File]::ReadAllText($credentialFile)
$token = [regex]::Match($credentialText, '(?m)^oauth_token\s*=\s*"([^"]+)"').Groups[1].Value
if (!$token) { throw 'Wrangler OAuth login required' }
$headers = @{ Authorization = "Bearer $token" }
$base = 'https://api.cloudflare.com/client/v4/accounts/11c3b70bf1c59eec79ced7e3d7c2a19e'
$destination = Join-Path (Get-Location) ('backups/cloudflare/' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $destination -Force | Out-Null
foreach ($part in @('settings','schedules','deployments')) {
  $result = Invoke-RestMethod -Uri "$base/workers/scripts/siestablog/$part" -Headers $headers
  $result | ConvertTo-Json -Depth 40 | Set-Content -LiteralPath (Join-Path $destination "$part.json")
  if ($part -eq 'settings') {
    $bindings = $result.result.bindings
    $bindings | Select-Object name,type,id,namespace_id | ConvertTo-Json
  }
}
Invoke-WebRequest -Uri "$base/workers/scripts/siestablog" -Headers $headers -OutFile (Join-Path $destination 'worker.multipart')
$database = ($bindings | Where-Object { $_.name -eq 'DB' }).id
if (!$database) { throw 'No DB binding found' }
$query = @{sql="SELECT name,sql FROM sqlite_master WHERE type IN ('table','trigger','index'); SELECT * FROM totals; SELECT * FROM articles ORDER BY id;"} | ConvertTo-Json
$data = Invoke-RestMethod -Method Post -Uri "$base/d1/database/$database/query" -Headers $headers -ContentType 'application/json' -Body $query
$data | ConvertTo-Json -Depth 40 | Set-Content -LiteralPath (Join-Path $destination 'database-readonly-snapshot.json')
Write-Output "Backup: $destination"
Write-Output "Database: $database"
$data.result | ForEach-Object { $_.results } | ConvertTo-Json -Depth 8
