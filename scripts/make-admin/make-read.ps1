$ErrorActionPreference="Stop"
$ScenarioId=7380915
$BaseUri="https://eu1.make.com/api/v2"
$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$BackupDir=Join-Path $RepoRoot "output\make-backups"
$secure=$null;$token=$null;$ptr=[IntPtr]::Zero
try {
 Write-Host "Guest Incoming - Make Admin READ" -ForegroundColor Cyan
 Write-Host "Scenario: $ScenarioId | READ ONLY"
 $secure=Read-Host "Incolla il token Make READ (input nascosto)" -AsSecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 if([string]::IsNullOrWhiteSpace($token)){throw "Token vuoto."}
 $h=@{Authorization="Token $token";Accept="application/json"}
 Write-Host "`n[1/2] GET scenario details..." -ForegroundColor Cyan
 $r=Invoke-RestMethod -Method Get -Uri "$BaseUri/scenarios/$ScenarioId" -Headers $h
 if(-not $r.scenario){throw "Oggetto scenario assente nella risposta Make."}
 Write-Host "MAKE API READ: PASS" -ForegroundColor Green
 Write-Host "Scenario ID: $($r.scenario.id)"
 Write-Host "Scenario:    $($r.scenario.name)"
 Write-Host "Active:      $($r.scenario.isActive)"
 Write-Host "Last edit:   $($r.scenario.lastEdit)"
 New-Item -ItemType Directory -Force -Path $BackupDir|Out-Null
 $ts=Get-Date -Format "yyyyMMdd-HHmmss"
 $file=Join-Path $BackupDir "scenario-$ScenarioId-details-$ts.json"
 $r|ConvertTo-Json -Depth 100|Set-Content $file -Encoding UTF8
 $sha=(Get-FileHash $file -Algorithm SHA256).Hash
 Write-Host "`n[2/2] Backup READ salvato." -ForegroundColor Cyan
 Write-Host "File:   $file"
 Write-Host "SHA256: $sha"
 Write-Host "`nBOOTSTRAP READ: PASS" -ForegroundColor Green
 Write-Host "Nessuna scrittura o esecuzione Make effettuata."
} catch {
 Write-Host "`nBOOTSTRAP READ: FAIL" -ForegroundColor Red
 Write-Host $_.Exception.Message
 exit 1
} finally {
 if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
 $token=$null;$secure=$null
 Remove-Variable h -ErrorAction SilentlyContinue
}
