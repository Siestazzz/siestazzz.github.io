$library = Join-Path $PSScriptRoot 'honor-library'
$catalog = Get-Content (Join-Path $library 'background-index.json') -Raw | ConvertFrom-Json -AsHashtable
$jobs = foreach ($key in $catalog.Keys) { foreach ($slot in @('main','sub')) { "$key/degree_$slot.png" } }
$results = $jobs | ForEach-Object -ThrottleLimit 8 -Parallel {
  $rel = $_
  $dest = Join-Path $using:library $rel
  $url = "https://storage.sekai.best/sekai-jp-assets/$rel"
  try {
    if (!(Test-Path -LiteralPath $dest)) {
      $response = Invoke-WebRequest -Uri $url -TimeoutSec 20
      $bytes = $response.Content
      if ($bytes -isnot [byte[]] -or $bytes.Length -lt 8 -or $bytes[0] -ne 137 -or $bytes[1] -ne 80) { throw 'Not PNG' }
      [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($dest)) | Out-Null
      [System.IO.File]::WriteAllBytes($dest,$bytes)
    }
    @{path=$rel;url=$url;status='ok';bytes=(Get-Item -LiteralPath $dest).Length;sha256=(Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash}
  } catch { @{path=$rel;url=$url;status='missing';error=$_.Exception.Message} }
}
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $library 'downloads.json') -Encoding utf8
$results | Group-Object status | Select-Object Name,Count
