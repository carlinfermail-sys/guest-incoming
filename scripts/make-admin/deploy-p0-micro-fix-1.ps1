# Guest Incoming — P0 MICRO-FIX 1 deployer
# Authorized scope: scenario 7380915 only. No scenario execution/backfill.
$ErrorActionPreference="Stop"
$ScenarioId=7380915
$BaseUri="https://eu1.make.com/api/v2"
$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$OutDir=Join-Path $RepoRoot "output\make-backups"
$secure=$null;$token=$null;$ptr=[IntPtr]::Zero

function Get-Blueprint($Headers){
    $r=Invoke-RestMethod -Method Get -Uri "$BaseUri/scenarios/$ScenarioId/blueprint" -Headers $Headers
    if($r.response){
        if($r.response.blueprint){
            $x=$r.response.blueprint
            if($x -is [string]){return ($x|ConvertFrom-Json)}
            return $x
        }
        if($r.response.flow){return $r.response}
    }
    if($r.blueprint){
        if($r.blueprint -is [string]){return ($r.blueprint|ConvertFrom-Json)}
        return $r.blueprint
    }
    if($r.flow){return $r}
    throw "Blueprint response shape non riconosciuta."
}
function Walk($flow,[hashtable]$Map){
    foreach($m in @($flow)){
        if($null -eq $m){continue}
        $Map[[string]$m.id]=$m
        foreach($r in @($m.routes)){if($r.flow){Walk $r.flow $Map}}
    }
}
function Filter($name,$conditions){return @{name=$name;conditions=@($conditions)}}

try{
    Write-Host "Guest Incoming — DEPLOY P0 MICRO-FIX 1" -ForegroundColor Cyan
    Write-Host "TARGET: scenario $ScenarioId | PROPERTY GUARD ONLY"
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
    if(-not $s){throw "Scenario envelope inatteso."}
    if([string]$s.id -ne [string]$ScenarioId){throw "Scenario ID mismatch."}
    if($s.isActive -eq $true){throw "ABORT: scenario attivo. Nessun PATCH effettuato."}
    Write-Host "Scenario: $($s.name)"
    Write-Host "Inactive: PASS" -ForegroundColor Green

    Write-Host "`n[2/6] READ + structural baseline check..." -ForegroundColor Cyan
    $bp=Get-Blueprint $h
    $map=@{}; Walk $bp.flow $map
    foreach($id in 5,6,13,14,15){if(-not $map.ContainsKey([string]$id)){throw "ABORT: modulo baseline $id assente."}}
    if($map["5"].module -ne "notion:makeApiCall"){throw "ABORT: modulo 5 inatteso."}
    if($map["6"].module -ne "notion:makeApiCall"){throw "ABORT: modulo 6 inatteso."}
    if($map["13"].module -ne "builtin:BasicRouter"){throw "ABORT: Router 13 inatteso."}
    if($map["6"].filter.name -ne "Exactly one Property"){throw "ABORT: baseline Property filter non coincide."}
    $fc=$map["6"].filter.conditions|ConvertTo-Json -Depth 20 -Compress
    if($fc -notmatch 'length\(5\.body\.results\)' -or $fc -notmatch '5\.body\.has_more'){
        throw "ABORT: semantica Property filter non coincide."
    }
    Write-Host "Baseline structure: PASS" -ForegroundColor Green

    Write-Host "`n[3/6] Save immediate pre-write backup..." -ForegroundColor Cyan
    $pre=Join-Path $OutDir "scenario-$ScenarioId-PRE-MICRO-FIX-1-$ts.json"
    $bp|ConvertTo-Json -Depth 100|Set-Content $pre -Encoding UTF8
    $preHash=(Get-FileHash $pre -Algorithm SHA256).Hash
    Write-Host "Backup: $pre"
    Write-Host "SHA256: $preHash"

    Write-Host "`n[4/6] Build patch in memory..." -ForegroundColor Cyan
    # Work on JSON round-trip clone.
    $patched=($bp|ConvertTo-Json -Depth 100|ConvertFrom-Json)
    $root=@($patched.flow)
    $i5=-1;$i6=-1;$i13=-1
    for($i=0;$i -lt $root.Count;$i++){
        if($root[$i].id -eq 5){$i5=$i}
        if($root[$i].id -eq 6){$i6=$i}
        if($root[$i].id -eq 13){$i13=$i}
    }
    if($i5 -lt 0 -or $i6 -ne ($i5+1) -or $i13 -ne ($i6+1)){
        throw "ABORT: topologia root 5->6->13 inattesa."
    }
    $unit=$root[$i6]
    $router13=$root[$i13]
    $unit.PSObject.Properties.Remove("filter")

    $notFound=[pscustomobject]@{
        id=17; module="util:SetVariable2"; version=1; parameters=[pscustomobject]@{}
        filter=[pscustomobject]@{name="PROPERTY_NOT_FOUND";conditions=@(@(
            [pscustomobject]@{a="{{length(5.body.results)}}";b="0";o="number:equal"},
            [pscustomobject]@{a="{{5.body.has_more}}";b="false";o="boolean:equal"}
        ))}
        mapper=[pscustomobject]@{name="P0_EXCEPTION";scope="roundtrip";value="PROPERTY_NOT_FOUND | booking={{3.id}} | propertyId={{3.propertyId}}"}
        metadata=[pscustomobject]@{designer=[pscustomobject]@{x=1500;y=-250;name="PROPERTY_NOT_FOUND — EXCEPTION"}}
    }
    $unit | Add-Member -NotePropertyName filter -NotePropertyValue ([pscustomobject]@{
        name="PROPERTY_OK — exactly one Property";conditions=@(@(
            [pscustomobject]@{a="{{length(5.body.results)}}";b="1";o="number:equal"},
            [pscustomobject]@{a="{{5.body.has_more}}";b="false";o="boolean:equal"}
        ))
    })
    $ambiguous=[pscustomobject]@{
        id=18; module="util:SetVariable2"; version=1; parameters=[pscustomobject]@{}
        filter=[pscustomobject]@{name="PROPERTY_AMBIGUOUS";conditions=@(
            @([pscustomobject]@{a="{{length(5.body.results)}}";b="1";o="number:greater"}),
            @([pscustomobject]@{a="{{5.body.has_more}}";b="true";o="boolean:equal"})
        )}
        mapper=[pscustomobject]@{name="P0_EXCEPTION";scope="roundtrip";value="PROPERTY_AMBIGUOUS | booking={{3.id}} | propertyId={{3.propertyId}} | matches={{length(5.body.results)}} | has_more={{5.body.has_more}}"}
        metadata=[pscustomobject]@{designer=[pscustomobject]@{x=1500;y=550;name="PROPERTY_AMBIGUOUS — EXCEPTION"}}
    }
    $guard=[pscustomobject]@{
        id=16; module="builtin:BasicRouter"; version=1; parameters=[pscustomobject]@{}; mapper=$null
        metadata=[pscustomobject]@{designer=[pscustomobject]@{x=1350;y=150;name="Property Guard"}}
        routes=@(
            [pscustomobject]@{flow=@($notFound)},
            [pscustomobject]@{flow=@($unit,$router13)},
            [pscustomobject]@{flow=@($ambiguous)}
        )
    }
    $new=@()
    if($i6 -gt 0){$new += $root[0..($i6-1)]}
    $new += $guard
    if(($i13+1) -lt $root.Count){$new += $root[($i13+1)..($root.Count-1)]}
    $patched.flow=$new

    $pm=@{};Walk $patched.flow $pm
    foreach($id in 5,6,13,14,15,16,17,18){if(-not $pm.ContainsKey([string]$id)){throw "ABORT: patched module $id missing."}}
    if($pm["17"].module -ne "util:SetVariable2" -or $pm["18"].module -ne "util:SetVariable2"){throw "ABORT: exception terminal type mismatch."}
    Write-Host "Offline patch structure: PASS" -ForegroundColor Green

    $candidate=Join-Path $OutDir "scenario-$ScenarioId-CANDIDATE-MICRO-FIX-1-$ts.json"
    $patched|ConvertTo-Json -Depth 100|Set-Content $candidate -Encoding UTF8
    Write-Host "Candidate: $candidate"

    Write-Host "`n[5/6] PATCH scenario blueprint..." -ForegroundColor Yellow
    # Make API expects blueprint as a JSON string.
    $blueprintString=$patched|ConvertTo-Json -Depth 100 -Compress
    $payload=@{blueprint=$blueprintString}|ConvertTo-Json -Depth 5 -Compress
    $null=Invoke-RestMethod -Method Patch -Uri "$BaseUri/scenarios/$ScenarioId" -Headers $h -Body $payload
    Write-Host "PATCH accepted." -ForegroundColor Green

    Write-Host "`n[6/6] READ-BACK + post-deploy validation..." -ForegroundColor Cyan
    $after=Get-Blueprint $h
    $am=@{};Walk $after.flow $am
    foreach($id in 5,6,13,14,15,16,17,18){if(-not $am.ContainsKey([string]$id)){throw "POST-CHECK FAIL: modulo $id assente. STOP; scenario NON eseguito."}}
    if($am["16"].module -ne "builtin:BasicRouter"){throw "POST-CHECK FAIL: Property Guard router non valido."}
    if($am["17"].module -ne "util:SetVariable2" -or $am["18"].module -ne "util:SetVariable2"){throw "POST-CHECK FAIL: exception terminals non validi."}
    if($am["6"].filter.name -ne "PROPERTY_OK — exactly one Property"){throw "POST-CHECK FAIL: PROPERTY_OK filter non valido."}
    $post=Join-Path $OutDir "scenario-$ScenarioId-POST-MICRO-FIX-1-$ts.json"
    $after|ConvertTo-Json -Depth 100|Set-Content $post -Encoding UTF8
    $postHash=(Get-FileHash $post -Algorithm SHA256).Hash
    Write-Host "POST backup: $post"
    Write-Host "SHA256: $postHash"
    Write-Host "`nP0 MICRO-FIX 1 DEPLOY: PASS" -ForegroundColor Green
    Write-Host "Scenario remains unexecuted. No Run Once/backfill performed."
}
catch{
    Write-Host "`nP0 MICRO-FIX 1 DEPLOY: FAIL / ABORT" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "No Run Once/backfill was requested by this script."
    exit 1
}
finally{
    if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
    $token=$null;$secure=$null
    Remove-Variable h -ErrorAction SilentlyContinue
}
