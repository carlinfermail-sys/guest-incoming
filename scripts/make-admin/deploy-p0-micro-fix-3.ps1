# Guest Incoming - P0 MICRO-FIX 3 Booking ID Guard deployer
# SAFETY: scenario 7380915 only. Fresh READ required. No Run Once/backfill/Beds24 write.
$ErrorActionPreference="Stop"
$ScenarioId=7380915
$BaseUri="https://eu1.make.com/api/v2"
$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$OutDir=Join-Path $RepoRoot "output\make-backups"
$secure=$null;$token=$null;$ptr=[IntPtr]::Zero

function Get-BP($h){
 $r=Invoke-RestMethod -Method Get -Uri "$BaseUri/scenarios/$ScenarioId/blueprint" -Headers $h
 if($r.response){if($r.response.blueprint){$x=$r.response.blueprint;if($x -is [string]){return ($x|ConvertFrom-Json)};return $x};if($r.response.flow){return $r.response}}
 if($r.blueprint){$x=$r.blueprint;if($x -is [string]){return ($x|ConvertFrom-Json)};return $x}
 if($r.flow){return $r}; throw "Blueprint response shape non riconosciuta."
}
function Walk($flow,[hashtable]$map,[string]$path="root"){
 foreach($m in @($flow)){if($null -eq $m){continue};$map[[string]$m.id]=[pscustomobject]@{Path=$path;Module=$m};$n=0;foreach($r in @($m.routes)){$n++;if($r.flow){Walk $r.flow $map "$path/m$($m.id)/r$n"}}}
}
function Save-BP($bp,$path){$bp|ConvertTo-Json -Depth 100|Set-Content $path -Encoding UTF8;return (Get-FileHash $path -Algorithm SHA256).Hash}

try{
 Write-Host "Guest Incoming - DEPLOY P0 MICRO-FIX 3" -ForegroundColor Cyan
 Write-Host "TARGET: 7380915 | BOOKING ID GUARD ONLY"
 Write-Host "NO RUN ONCE | NO BACKFILL | NO BEDS24 WRITE"
 Write-Host "PATCH requires explicit user approval before this script is executed." -ForegroundColor Yellow

 $secure=Read-Host "Incolla il token Make WRITE (input nascosto)" -AsSecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 if([string]::IsNullOrWhiteSpace($token)){throw "Token vuoto."}
 $h=@{Authorization="Token $token";Accept="application/json";"Content-Type"="application/json"}
 New-Item -ItemType Directory -Force -Path $OutDir|Out-Null
 $ts=Get-Date -Format "yyyyMMdd-HHmmss"

 Write-Host "[1/6] PRE-CHECK scenario + fresh READ..."
 $sr=Invoke-RestMethod -Method Get -Uri "$BaseUri/scenarios/$ScenarioId" -Headers $h
 $s=$sr.scenario
 if(-not $s -or [string]$s.id -ne [string]$ScenarioId){throw "ABORT: scenario mismatch/envelope."}
 if($s.isActive -eq $true){throw "ABORT: scenario attivo."}
 $bp=Get-BP $h
 $map=@{};Walk $bp.flow $map
 foreach($mid in 5,6,13,14,15,16,17,18,19,20,21){if(-not $map.ContainsKey([string]$mid)){throw "ABORT: POST-MF2 baseline module $mid missing."}}
 if($map["16"].Module.module -ne "builtin:BasicRouter"){throw "ABORT: Property Guard 16 invalid."}
 if($map["21"].Module.module -ne "builtin:BasicRouter"){throw "ABORT: Unit Guard 21 invalid."}
 if($map["14"].Module.module -notmatch "notion:" -or $map["15"].Module.module -notmatch "notion:"){throw "ABORT: CREATE/UPDATE modules unexpected."}
 if($map["14"].Path -notmatch "/m21/r2" -or $map["15"].Path -notmatch "/m21/r2"){throw "ABORT: CREATE/UPDATE not isolated under UNIT_OK."}
 Write-Host "POST-MF2 semantic baseline: PASS" -ForegroundColor Green

 Write-Host "[2/6] Immediate fresh backup..."
 $pre=Join-Path $OutDir "scenario-$ScenarioId-PRE-MICRO-FIX-3-$ts.json"
 $preHash=Save-BP $bp $pre
 Write-Host "Backup: $pre";Write-Host "SHA256: $preHash"

 Write-Host "[3/6] Discover existing Booking lookup topology..."
 # MF3 must preserve the existing booking lookup module and only make its cardinality accountable.
 # Existing CREATE 14 and UPDATE 15 are source-of-truth anchors.
 $lookupCandidates=@()
 foreach($entry in $map.GetEnumerator()){
   $m=$entry.Value.Module
   if($m.module -match "^notion:" -and $m.id -notin 5,6,14,15){
     $json=$m|ConvertTo-Json -Depth 30 -Compress
     if($json -match "Booking ID|BookingID|bookingId|Beds24 Booking ID|3\.id"){$lookupCandidates += $m.id}
   }
 }
 if($lookupCandidates.Count -ne 1){throw "ABORT: expected exactly one Booking-ID lookup candidate; found $($lookupCandidates.Count): $($lookupCandidates -join ','). Inspect fresh blueprint; do not guess."}
 $lookupId=[int]$lookupCandidates[0]
 Write-Host "Booking lookup module: $lookupId"

 Write-Host "[4/6] Build MF3 candidate in memory..."
 $patched=($bp|ConvertTo-Json -Depth 100|ConvertFrom-Json)
 $pm=@{};Walk $patched.flow $pm
 $lookup=$pm[[string]$lookupId].Module
 # Validate cardinality source is a search-like result before editing.
 $lookupJson=$lookup|ConvertTo-Json -Depth 30 -Compress
 if($lookupJson -notmatch "results"){Write-Host "NOTE: lookup payload does not literally contain 'results'; topology validators remain authoritative." -ForegroundColor Yellow}

 # Existing filters on CREATE/UPDATE are replaced by explicit cardinality filters.
 $create=$pm["14"].Module; $update=$pm["15"].Module
 $create | Add-Member -Force -NotePropertyName filter -NotePropertyValue ([pscustomobject]@{
   name="BOOKING_ID_NEW - create";conditions=@([pscustomobject]@{a="{{length($lookupId.body.results)}}";b="0";o="number:equal"},[pscustomobject]@{a="{{$lookupId.body.has_more}}";b="false";o="boolean:equal"})
 })
 $update | Add-Member -Force -NotePropertyName filter -NotePropertyValue ([pscustomobject]@{
   name="BOOKING_ID_EXISTING - update";conditions=@([pscustomobject]@{a="{{length($lookupId.body.results)}}";b="1";o="number:equal"},[pscustomobject]@{a="{{$lookupId.body.has_more}}";b="false";o="boolean:equal"})
 })
 $dup=[pscustomobject]@{
   id=22;module="util:SetVariable2";version=1;parameters=[pscustomobject]@{}
   filter=[pscustomobject]@{name="DUPLICATE_BOOKING_ID";conditions=@(@([pscustomobject]@{a="{{length($lookupId.body.results)}}";b="1";o="number:greater"}),@([pscustomobject]@{a="{{$lookupId.body.has_more}}";b="true";o="boolean:equal"}))}
   mapper=[pscustomobject]@{name="P0_EXCEPTION";scope="roundtrip";value="DUPLICATE_BOOKING_ID | booking={{3.id}} | matches={{length($lookupId.body.results)}} | has_more={{$lookupId.body.has_more}}"}
   metadata=[pscustomobject]@{designer=[pscustomobject]@{x=2700;y=600;name="DUPLICATE_BOOKING_ID - EXCEPTION"}}
 }
 # Insert duplicate as an additional route on the router that already owns CREATE/UPDATE.
 $parentRouter=$null
 foreach($entry in $pm.GetEnumerator()){
   $m=$entry.Value.Module
   if($m.module -eq "builtin:BasicRouter"){
     $j=$m|ConvertTo-Json -Depth 60 -Compress
     if($j -match '"id":14' -and $j -match '"id":15'){$parentRouter=$m;break}
   }
 }
 if($null -eq $parentRouter){throw "ABORT: could not identify router owning CREATE/UPDATE."}
 $parentRouter.routes += [pscustomobject]@{flow=@($dup)}

 $cm=@{};Walk $patched.flow $cm
 foreach($mid in 5,6,13,14,15,16,17,18,19,20,21,22){if(-not $cm.ContainsKey([string]$mid)){throw "ABORT: candidate module $mid missing."}}
 if($cm["22"].Module.module -ne "util:SetVariable2"){throw "ABORT: duplicate terminal invalid."}
 $candidate=Join-Path $OutDir "scenario-$ScenarioId-CANDIDATE-MICRO-FIX-3-$ts.json"
 $candidateHash=Save-BP $patched $candidate
 Write-Host "Candidate structure: PASS" -ForegroundColor Green
 Write-Host "Candidate: $candidate";Write-Host "SHA256: $candidateHash"

 Write-Host "[5/6] PATCH MF3..." -ForegroundColor Yellow
 $blueprintString=$patched|ConvertTo-Json -Depth 100 -Compress
 $payload=@{blueprint=$blueprintString}|ConvertTo-Json -Depth 5 -Compress
 $null=Invoke-RestMethod -Method Patch -Uri "$BaseUri/scenarios/$ScenarioId" -Headers $h -Body $payload
 Write-Host "PATCH accepted." -ForegroundColor Green

 Write-Host "[6/6] READ-BACK semantic validation..."
 $after=Get-BP $h;$am=@{};Walk $after.flow $am
 foreach($mid in 5,6,13,14,15,16,17,18,19,20,21,22){if(-not $am.ContainsKey([string]$mid)){throw "POST-CHECK FAIL: module $mid missing. Scenario NOT executed."}}
 if($am["16"].Module.module -ne "builtin:BasicRouter" -or $am["21"].Module.module -ne "builtin:BasicRouter"){throw "POST-CHECK FAIL: earlier guards lost."}
 if($am["22"].Module.module -ne "util:SetVariable2"){throw "POST-CHECK FAIL: duplicate terminal invalid."}
 $cf=$am["14"].Module.filter.conditions|ConvertTo-Json -Depth 20 -Compress
 $uf=$am["15"].Module.filter.conditions|ConvertTo-Json -Depth 20 -Compress
 if($cf -notmatch "length\($lookupId\.body\.results\)" -or $cf -notmatch '"b":"0"'){throw "POST-CHECK FAIL: CREATE cardinality invalid."}
 if($uf -notmatch "length\($lookupId\.body\.results\)" -or $uf -notmatch '"b":"1"'){throw "POST-CHECK FAIL: UPDATE cardinality invalid."}
 $post=Join-Path $OutDir "scenario-$ScenarioId-POST-MICRO-FIX-3-$ts.json"
 $postHash=Save-BP $after $post
 Write-Host "POST backup: $post";Write-Host "SHA256: $postHash"
 Write-Host "P0 MICRO-FIX 3 DEPLOY: PASS" -ForegroundColor Green
 Write-Host "Scenario remains unexecuted. No Run Once/backfill performed."
}catch{
 Write-Host "P0 MICRO-FIX 3 DEPLOY: FAIL / ABORT" -ForegroundColor Red
 Write-Host $_.Exception.Message
 Write-Host "No Run Once/backfill was requested by this script."
 exit 1
}finally{
 if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
 $token=$null;$secure=$null;Remove-Variable h -ErrorAction SilentlyContinue
}
