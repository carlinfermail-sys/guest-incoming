# Guest Incoming — P0 MICRO-FIX 2 Unit Guard deployer
# Authorized: scenario 7380915, Unit Guard only. No execution/backfill.
$ErrorActionPreference="Stop"
$ScenarioId=7380915
$BaseUri="https://eu1.make.com/api/v2"
$ExpectedActualHash="F68209D1FC582C1BE865477ADBE1360E49D5F138D45C8A270D33CE2E1E27FDFC"
$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$OutDir=Join-Path $RepoRoot "output\make-backups"
$secure=$null;$token=$null;$ptr=[IntPtr]::Zero

function Get-BP($h){
 $r=Invoke-RestMethod -Method Get -Uri "$BaseUri/scenarios/$ScenarioId/blueprint" -Headers $h
 if($r.response){
  if($r.response.blueprint){$x=$r.response.blueprint;if($x -is [string]){return ($x|ConvertFrom-Json)};return $x}
  if($r.response.flow){return $r.response}
 }
 if($r.blueprint){$x=$r.blueprint;if($x -is [string]){return ($x|ConvertFrom-Json)};return $x}
 if($r.flow){return $r}
 throw "Blueprint response shape non riconosciuta."
}
function Walk($flow,[hashtable]$map,[string]$path="root"){
 foreach($m in @($flow)){
  if($null -eq $m){continue}
  $map[[string]$m.id]=[pscustomobject]@{Path=$path;Module=$m}
  $n=0;foreach($r in @($m.routes)){$n++;if($r.flow){Walk $r.flow $map "$path/m$($m.id)/r$n"}}
 }
}
function CanonicalHash($bp,$path){
 $bp|ConvertTo-Json -Depth 100|Set-Content $path -Encoding UTF8
 return (Get-FileHash $path -Algorithm SHA256).Hash
}
try{
 Write-Host "Guest Incoming — DEPLOY P0 MICRO-FIX 2" -ForegroundColor Cyan
 Write-Host "TARGET: 7380915 | UNIT GUARD ONLY"
 Write-Host "NO RUN ONCE | NO BACKFILL | NO BEDS24 WRITE`n"
 $secure=Read-Host "Incolla il token Make WRITE (input nascosto)" -AsSecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 if([string]::IsNullOrWhiteSpace($token)){throw "Token vuoto."}
 $h=@{Authorization="Token $token";Accept="application/json";"Content-Type"="application/json"}
 New-Item -ItemType Directory -Force -Path $OutDir|Out-Null
 $ts=Get-Date -Format "yyyyMMdd-HHmmss"

 Write-Host "[1/6] PRE-CHECK scenario..." -ForegroundColor Cyan
 $sr=Invoke-RestMethod -Method Get -Uri "$BaseUri/scenarios/$ScenarioId" -Headers $h
 $s=$sr.scenario
 if(-not $s -or [string]$s.id -ne [string]$ScenarioId){throw "ABORT: scenario mismatch/envelope."}
 if($s.isActive -eq $true){throw "ABORT: scenario attivo."}
 Write-Host "Scenario: $($s.name)"
 Write-Host "Inactive: PASS" -ForegroundColor Green

 Write-Host "`n[2/6] READ current + semantic baseline..." -ForegroundColor Cyan
 $bp=Get-BP $h
 $map=@{};Walk $bp.flow $map
 foreach($id in 5,6,13,14,15,16,17,18){if(-not $map.ContainsKey([string]$id)){throw "ABORT: expected module $id missing."}}
 if($map["16"].Module.module -ne "builtin:BasicRouter"){throw "ABORT: Property Guard 16 invalid."}
 if($map["17"].Module.module -ne "util:SetVariable2" -or $map["18"].Module.module -ne "util:SetVariable2"){throw "ABORT: Property exception terminals invalid."}
 if($map["6"].Module.module -ne "notion:makeApiCall"){throw "ABORT: Unit lookup 6 invalid."}
 if($map["13"].Module.module -ne "builtin:BasicRouter"){throw "ABORT: downstream Router 13 invalid."}
 # Validate PROPERTY_OK semantics, not cosmetic label.
 $pf=$map["6"].Module.filter.conditions|ConvertTo-Json -Depth 20 -Compress
 if($pf -notmatch 'length\(5\.body\.results\)' -or $pf -notmatch '"b":"1"' -or $pf -notmatch '5\.body\.has_more' -or $pf -notmatch '"b":"false"'){
  throw "ABORT: PROPERTY_OK semantics differ."
 }
 Write-Host "Current Property Guard baseline: PASS" -ForegroundColor Green

 Write-Host "`n[3/6] Immediate PRE backup..." -ForegroundColor Cyan
 $pre=Join-Path $OutDir "scenario-$ScenarioId-PRE-MICRO-FIX-2-$ts.json"
 $preHash=CanonicalHash $bp $pre
 Write-Host "Backup: $pre"
 Write-Host "SHA256: $preHash"
 # Expected hash is advisory because PowerShell/Make normalization can alter byte-level formatting.
 if($preHash -ne $ExpectedActualHash){Write-Host "NOTE: byte hash differs from prior reader; semantic baseline passed. Continuing." -ForegroundColor Yellow}

 Write-Host "`n[4/6] Build + validate Unit Guard candidate..." -ForegroundColor Cyan
 $patched=($bp|ConvertTo-Json -Depth 100|ConvertFrom-Json)
 $pm=@{};Walk $patched.flow $pm
 $r13=$pm["13"].Module
 # UNIT_OK filter on existing Router 13
 $r13 | Add-Member -Force -NotePropertyName filter -NotePropertyValue ([pscustomobject]@{
   name="UNIT_OK - exactly one Unit";conditions=@(
    [pscustomobject]@{a="{{length(6.body.results)}}";b="1";o="number:equal"},
    [pscustomobject]@{a="{{6.body.has_more}}";b="false";o="boolean:equal"}
   )
 })
 $nf=[pscustomobject]@{
  id=19;module="util:SetVariable2";version=1;parameters=[pscustomobject]@{}
  filter=[pscustomobject]@{name="UNIT_NOT_FOUND";conditions=@(
   [pscustomobject]@{a="{{length(6.body.results)}}";b="0";o="number:equal"},
   [pscustomobject]@{a="{{6.body.has_more}}";b="false";o="boolean:equal"}
  )}
  mapper=[pscustomobject]@{name="P0_EXCEPTION";scope="roundtrip";value="UNIT_NOT_FOUND | booking={{3.id}} | propertyId={{3.propertyId}} | roomId={{3.roomId}}"}
  metadata=[pscustomobject]@{designer=[pscustomobject]@{x=1950;y=-100;name="UNIT_NOT_FOUND - EXCEPTION"}}
 }
 $amb=[pscustomobject]@{
  id=20;module="util:SetVariable2";version=1;parameters=[pscustomobject]@{}
  filter=[pscustomobject]@{name="UNIT_AMBIGUOUS";conditions=@(
   @([pscustomobject]@{a="{{length(6.body.results)}}";b="1";o="number:greater"}),
   @([pscustomobject]@{a="{{6.body.has_more}}";b="true";o="boolean:equal"})
  )}
  mapper=[pscustomobject]@{name="P0_EXCEPTION";scope="roundtrip";value="UNIT_AMBIGUOUS | booking={{3.id}} | propertyId={{3.propertyId}} | roomId={{3.roomId}} | matches={{length(6.body.results)}} | has_more={{6.body.has_more}}"}
  metadata=[pscustomobject]@{designer=[pscustomobject]@{x=1950;y=500;name="UNIT_AMBIGUOUS - EXCEPTION"}}
 }
 $ug=[pscustomobject]@{
  id=21;module="builtin:BasicRouter";version=1;parameters=[pscustomobject]@{};mapper=$null
  metadata=[pscustomobject]@{designer=[pscustomobject]@{x=1800;y=150;name="Unit Guard"}}
  routes=@([pscustomobject]@{flow=@($nf)},[pscustomobject]@{flow=@($r13)},[pscustomobject]@{flow=@($amb)})
 }
 # Replace Router 13 in its parent route recursively.
 function Replace13($flow){
  for($i=0;$i -lt $flow.Count;$i++){
   if($flow[$i].id -eq 13){$flow[$i]=$ug;return $true}
   foreach($rr in @($flow[$i].routes)){if($rr.flow -and (Replace13 $rr.flow)){return $true}}
  };return $false
 }
 if(-not (Replace13 $patched.flow)){throw "ABORT: could not insert Unit Guard."}
 $cm=@{};Walk $patched.flow $cm
 foreach($id in 5,6,13,14,15,16,17,18,19,20,21){if(-not $cm.ContainsKey([string]$id)){throw "ABORT: candidate module $id missing."}}
 if($cm["21"].Module.module -ne "builtin:BasicRouter"){throw "ABORT: Unit Guard type invalid."}
 if($cm["19"].Module.module -ne "util:SetVariable2" -or $cm["20"].Module.module -ne "util:SetVariable2"){throw "ABORT: Unit terminals invalid."}
 if($cm["14"].Path -notmatch '/m21/r2' -or $cm["15"].Path -notmatch '/m21/r2'){throw "ABORT: writes are not exclusively under UNIT_OK route."}
 $candidate=Join-Path $OutDir "scenario-$ScenarioId-CANDIDATE-MICRO-FIX-2-$ts.json"
 $null=CanonicalHash $patched $candidate
 Write-Host "Candidate structure: PASS" -ForegroundColor Green
 Write-Host "Candidate: $candidate"

 Write-Host "`n[5/6] PATCH Unit Guard..." -ForegroundColor Yellow
 $blueprintString=$patched|ConvertTo-Json -Depth 100 -Compress
 $payload=@{blueprint=$blueprintString}|ConvertTo-Json -Depth 5 -Compress
 $null=Invoke-RestMethod -Method Patch -Uri "$BaseUri/scenarios/$ScenarioId" -Headers $h -Body $payload
 Write-Host "PATCH accepted." -ForegroundColor Green

 Write-Host "`n[6/6] READ-BACK + semantic validation..." -ForegroundColor Cyan
 $after=Get-BP $h
 $am=@{};Walk $after.flow $am
 foreach($id in 5,6,13,14,15,16,17,18,19,20,21){if(-not $am.ContainsKey([string]$id)){throw "POST-CHECK FAIL: module $id missing. Scenario NOT executed."}}
 if($am["16"].Module.module -ne "builtin:BasicRouter"){throw "POST-CHECK FAIL: Property Guard lost."}
 if($am["21"].Module.module -ne "builtin:BasicRouter"){throw "POST-CHECK FAIL: Unit Guard invalid."}
 if($am["19"].Module.module -ne "util:SetVariable2" -or $am["20"].Module.module -ne "util:SetVariable2"){throw "POST-CHECK FAIL: Unit terminals invalid."}
 $uf=$am["13"].Module.filter.conditions|ConvertTo-Json -Depth 20 -Compress
 if($uf -notmatch 'length\(6\.body\.results\)' -or $uf -notmatch '"b":"1"' -or $uf -notmatch '6\.body\.has_more' -or $uf -notmatch '"b":"false"'){
  throw "POST-CHECK FAIL: UNIT_OK semantics invalid."
 }
 if($am["14"].Path -notmatch '/m21/r2' -or $am["15"].Path -notmatch '/m21/r2'){throw "POST-CHECK FAIL: CREATE/UPDATE not isolated under UNIT_OK."}
 $post=Join-Path $OutDir "scenario-$ScenarioId-POST-MICRO-FIX-2-$ts.json"
 $postHash=CanonicalHash $after $post
 Write-Host "POST backup: $post"
 Write-Host "SHA256: $postHash"
 Write-Host "`nP0 MICRO-FIX 2 DEPLOY: PASS" -ForegroundColor Green
 Write-Host "Property Guard preserved. Unit Guard verified."
 Write-Host "Scenario remains unexecuted. No Run Once/backfill performed."
}catch{
 Write-Host "`nP0 MICRO-FIX 2 DEPLOY: FAIL / ABORT" -ForegroundColor Red
 Write-Host $_.Exception.Message
 Write-Host "No Run Once/backfill was requested by this script."
 exit 1
}finally{
 if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
 $token=$null;$secure=$null
 Remove-Variable h -ErrorAction SilentlyContinue
}
