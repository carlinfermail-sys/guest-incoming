$ErrorActionPreference="Stop"
$ScenarioId=7380915
$Uri="https://eu1.make.com/api/v2/scenarios/$ScenarioId/blueprint"
$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$OutDir=Join-Path $RepoRoot "output\make-backups"
$secure=$null;$token=$null;$ptr=[IntPtr]::Zero
try{
 Write-Host "Guest Incoming - Make Blueprint READ V2" -ForegroundColor Cyan
 Write-Host "Scenario: $ScenarioId | READ ONLY"
 $secure=Read-Host "Incolla il token Make READ (input nascosto)" -AsSecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 if([string]::IsNullOrWhiteSpace($token)){throw "Token vuoto."}
 $h=@{Authorization="Token $token";Accept="application/json"}
 New-Item -ItemType Directory -Force -Path $OutDir|Out-Null
 $ts=Get-Date -Format "yyyyMMdd-HHmmss"

 Write-Host "`n[1/4] GET blueprint response..." -ForegroundColor Cyan
 $resp=Invoke-WebRequest -Method Get -Uri $Uri -Headers $h -UseBasicParsing
 Write-Host "HTTP: $($resp.StatusCode)" -ForegroundColor Green
 $rawFile=Join-Path $OutDir "scenario-$ScenarioId-blueprint-raw-$ts.json"
 [IO.File]::WriteAllText($rawFile,$resp.Content,[Text.UTF8Encoding]::new($false))
 Write-Host "Raw response saved: $rawFile"

 Write-Host "`n[2/4] Detect response shape..." -ForegroundColor Cyan
 $obj=$resp.Content|ConvertFrom-Json
 $props=@($obj.PSObject.Properties.Name)
 Write-Host ("Top-level properties: "+($props -join ", "))

 if($props -contains "blueprint"){
   $candidate=$obj.blueprint
 } elseif($props -contains "flow"){
   $candidate=$obj
 } elseif($props -contains "response" -and $obj.response){
   if($obj.response.PSObject.Properties.Name -contains "blueprint"){$candidate=$obj.response.blueprint}
   elseif($obj.response.PSObject.Properties.Name -contains "flow"){$candidate=$obj.response}
 }
 if($null -eq $candidate){throw "Formato blueprint non riconosciuto. La risposta grezza e stata salvata per analisi."}
 if($candidate -is [string]){$bp=$candidate|ConvertFrom-Json}else{$bp=$candidate}
 if(-not ($bp.PSObject.Properties.Name -contains "flow")){throw "Blueprint individuato ma proprieta flow assente."}
 Write-Host "Blueprint shape: PASS" -ForegroundColor Green

 Write-Host "`n[3/4] Save canonical blueprint..." -ForegroundColor Cyan
 $bpFile=Join-Path $OutDir "scenario-$ScenarioId-blueprint-$ts.json"
 $bp|ConvertTo-Json -Depth 100|Set-Content $bpFile -Encoding UTF8
 $sha=(Get-FileHash $bpFile -Algorithm SHA256).Hash
 Write-Host "Blueprint: $bpFile"
 Write-Host "SHA256:    $sha"

 function Get-Mods($flow,$path="root"){
   $o=@()
   foreach($m in @($flow)){
     if($null -eq $m){continue}
     $o += [pscustomobject]@{Path=$path;Id=$m.id;Module=$m.module;Version=$m.version}
     if($m.routes){
       $i=0
       foreach($route in @($m.routes)){
         $i++
         if($route.flow){$o += Get-Mods $route.flow "$path/module-$($m.id)/route-$i"}
       }
     }
   }
   $o
 }
 Write-Host "`n[4/4] Build module inventory..." -ForegroundColor Cyan
 $mods=Get-Mods $bp.flow
 $csv=Join-Path $OutDir "scenario-$ScenarioId-inventory-$ts.csv"
 $mods|Export-Csv $csv -NoTypeInformation -Encoding UTF8
 Write-Host "Inventory: $csv"
 Write-Host "Modules:   $($mods.Count)"
 Write-Host "`nBLUEPRINT AUDIT INPUT: PASS" -ForegroundColor Green
 Write-Host "Nessuna scrittura o esecuzione Make effettuata."
}catch{
 Write-Host "`nBLUEPRINT READ V2: FAIL" -ForegroundColor Red
 Write-Host $_.Exception.Message
 exit 1
}finally{
 if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
 $token=$null;$secure=$null
 Remove-Variable h -ErrorAction SilentlyContinue
}
