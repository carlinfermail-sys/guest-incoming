$ErrorActionPreference="Stop"
$ScenarioId=7380915
$BaseUri="https://eu1.make.com/api/v2"
$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$BackupDir=Join-Path $RepoRoot "output\make-backups"
$secure=$null;$token=$null;$ptr=[IntPtr]::Zero
try {
 Write-Host "Guest Incoming - Make Blueprint READ" -ForegroundColor Cyan
 Write-Host "Scenario: $ScenarioId | READ ONLY"
 $secure=Read-Host "Incolla il token Make READ (input nascosto)" -AsSecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 if([string]::IsNullOrWhiteSpace($token)){throw "Token vuoto."}
 $h=@{Authorization="Token $token";Accept="application/json"}
 New-Item -ItemType Directory -Force -Path $BackupDir|Out-Null
 $ts=Get-Date -Format "yyyyMMdd-HHmmss"

 Write-Host "`n[1/3] GET scenario blueprint..." -ForegroundColor Cyan
 $r=Invoke-RestMethod -Method Get -Uri "$BaseUri/scenarios/$ScenarioId/blueprint" -Headers $h
 if(-not $r.blueprint){throw "Oggetto blueprint assente nella risposta Make."}
 Write-Host "BLUEPRINT READ: PASS" -ForegroundColor Green

 $raw=Join-Path $BackupDir "scenario-$ScenarioId-blueprint-response-$ts.json"
 $r|ConvertTo-Json -Depth 100|Set-Content $raw -Encoding UTF8

 $bp=$r.blueprint
 if($bp -is [string]){$bpObj=$bp|ConvertFrom-Json}else{$bpObj=$bp}
 $bpFile=Join-Path $BackupDir "scenario-$ScenarioId-blueprint-$ts.json"
 $bpObj|ConvertTo-Json -Depth 100|Set-Content $bpFile -Encoding UTF8
 $sha=(Get-FileHash $bpFile -Algorithm SHA256).Hash

 Write-Host "`n[2/3] Blueprint backup salvato." -ForegroundColor Cyan
 Write-Host "Blueprint: $bpFile"
 Write-Host "SHA256:    $sha"

 $modules=@()
 function Walk-Flow($flow,$path="root"){
   if($null -eq $flow){return}
   foreach($m in @($flow)){
     if($null -eq $m){continue}
     $modules += [pscustomobject]@{
       Path=$path; Id=$m.id; Module=$m.module; Version=$m.version
     }
     if($m.routes){
       $ri=0
       foreach($route in @($m.routes)){
         $ri++
         if($route.flow){Walk-Flow $route.flow "$path/module-$($m.id)/route-$ri"}
       }
     }
   }
 }
 # PowerShell function scope: collect via explicit recursive helper return
 function Get-Modules($flow,$path="root"){
   $out=@()
   foreach($m in @($flow)){
     if($null -eq $m){continue}
     $out += [pscustomobject]@{Path=$path;Id=$m.id;Module=$m.module;Version=$m.version}
     if($m.routes){
       $ri=0
       foreach($route in @($m.routes)){
         $ri++
         if($route.flow){$out += Get-Modules $route.flow "$path/module-$($m.id)/route-$ri"}
       }
     }
   }
   return $out
 }
 $inventory=Get-Modules $bpObj.flow
 $invFile=Join-Path $BackupDir "scenario-$ScenarioId-inventory-$ts.csv"
 $inventory|Export-Csv -NoTypeInformation -Encoding UTF8 -Path $invFile

 Write-Host "`n[3/3] Inventario moduli creato." -ForegroundColor Cyan
 Write-Host "Inventory: $invFile"
 Write-Host "Modules:   $($inventory.Count)"
 Write-Host "`nBLUEPRINT AUDIT INPUT: PASS" -ForegroundColor Green
 Write-Host "Nessuna scrittura o esecuzione Make effettuata."
} catch {
 Write-Host "`nBLUEPRINT READ: FAIL" -ForegroundColor Red
 Write-Host $_.Exception.Message
 exit 1
} finally {
 if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
 $token=$null;$secure=$null
 Remove-Variable h -ErrorAction SilentlyContinue
}
