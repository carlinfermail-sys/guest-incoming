# Refresh only a short-lived Beds24 access token from the existing Make data store.
$ErrorActionPreference = 'Stop'
$secure = $null; $plain = $null; $ptr = [IntPtr]::Zero
$refresh = $null; $access = $null; $stage = 'Make read'
try {
  $secure = Read-Host 'Make READ token (hidden)' -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr).Trim()
  if ([string]::IsNullOrWhiteSpace($plain)) { throw 'Empty Make token' }
  $headers = @{ Authorization = "Token $plain"; Accept = 'application/json' }
  $stage = 'Make data store read'
  $res = Invoke-RestMethod -Method Get -Uri 'https://eu1.make.com/api/v2/data-stores/184287/data?pg%5Blimit%5D=100' -Headers $headers
  $records = if ($res.records) { @($res.records) } elseif ($res.response.records) { @($res.response.records) } else { @() }
  $current = @($records | Where-Object { $_.key -eq 'current' })
  if ($current.Count -ne 1) { throw 'Current record not unique' }
  $refresh = [string]$current[0].data.refreshToken
  if ([string]::IsNullOrWhiteSpace($refresh)) { throw 'Refresh token missing' }
  $stage = 'Beds24 refresh'
  $fresh = Invoke-RestMethod -Method Get -Uri 'https://api.beds24.com/v2/authentication/token' -Headers @{ refreshToken = $refresh; Accept = 'application/json' }
  $access = [string]$fresh.token
  if ([string]::IsNullOrWhiteSpace($access)) { throw 'Access token missing' }
  $stage = 'Beds24 verification'
  $details = Invoke-RestMethod -Method Get -Uri 'https://api.beds24.com/v2/authentication/details' -Headers @{ token = $access; Accept = 'application/json' }
  if ($details.validToken -ne $true) { throw 'Access token invalid' }
  $stage = 'Local save'
  $target = Join-Path $env:USERPROFILE 'Documents\beds24-access-token.txt'
  $temp = "$target.tmp"
  [IO.File]::WriteAllText($temp, $access, [Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $temp -Destination $target -Force
  Write-Host 'BEDS24 REFRESH: PASS; verified access token stored locally. No token printed.'
} catch {
  $http = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'N/A' }
  Write-Host "BEDS24 REFRESH: BLOCKED at $stage (HTTP $http, $($_.Exception.GetType().Name)). No token printed."
  exit 1
} finally {
  if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  $plain = $null; $secure = $null; $refresh = $null; $access = $null
  Remove-Variable headers, res, fresh, details -ErrorAction SilentlyContinue
}
