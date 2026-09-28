"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const norm=v=>String(v??"").normalize("NFC").trim().replace(/\s+/g," ").toLowerCase();
const pageId=u=>String(u).split("/").at(-1).replace(/-/g,"");
function rel(v){if(!v)return [];try{const a=JSON.parse(v);return (Array.isArray(a)?a:[a]).filter(Boolean).map(pageId)}catch{throw Error("Invalid relation encoding")}}
function compare(b,m,l){
const criteria=[],missing=[],conflicts=[];
const p=rel(l.Property),u=rel(l.Unit);
const sp=pageId(m.plannedMapping.Property),su=pageId(m.plannedMapping.Unit);
const ci=l["date:Check-in:start"]||l["date:Dates:start"],co=l["date:Check-out:start"]||l["date:Dates:end"];
const eq=(key,observed,expected)=>{if(!observed){missing.push(key);return false;}if(observed===expected){criteria.push(key);return true;}conflicts.push(key);return false;};
const pe=p.length?eq("PROPERTY",p.includes(sp)?"yes":"no","yes"):(missing.push("PROPERTY"),false);
const ue=u.length?eq("UNIT",u.includes(su)?"yes":"no","yes"):(missing.push("UNIT"),false);
const ie=eq("ARRIVAL",ci,b.arrival),oe=eq("DEPARTURE",co,b.departure);
const ref=l["Beds24 API Reference"];
const re=ref?eq("SOURCE_REFERENCE",norm(ref),norm(b.apiReference)):(missing.push("SOURCE_REFERENCE"),false);
const legacyName=norm(l["Guest / Stay"]).replace(/^(booking|prenotazione)\s*[-:]\s*/,"");
const ne=legacyName===norm(b.firstName+" "+b.lastName);
if(ne)criteria.push("GUEST_NAME_SECONDARY");
const channel=l.Channel||l["Booking Source"];
const se=channel&&norm(channel)===norm(m.plannedMapping.Channel);
if(se)criteria.push("CHANNEL");
if(l["Guest Count"]!=null&&l["Guest Count"]===b.numAdult+b.numChild)criteria.push("GUEST_COUNT");
const datesConflict=(l["date:Check-in:start"]&&l["date:Dates:start"]&&l["date:Check-in:start"]!==l["date:Dates:start"])||
(l["date:Check-out:start"]&&l["date:Dates:end"]&&l["date:Check-out:start"]!==l["date:Dates:end"]);
if(datesConflict)conflicts.push("LEGACY_DATE_FIELDS_INCONSISTENT");
// A reference, or name plus location, can indicate the same reservation with
// changed dates. Do not silently reject these as different stays.
const strong=re||(ne&&(pe||ue));
const excluded=!strong&&!datesConflict&&conflicts.some(k=>["PROPERTY","UNIT","ARRIVAL","DEPARTURE","SOURCE_REFERENCE"].includes(k));
const exact=!conflicts.length&&!datesConflict&&pe&&ue&&ie&&oe&&(re||(ne&&se));
return {notionPageId:pageId(l.url),criteria,missing,conflicts,
classification:excluded?"NO_COLLISION":exact?"EXACT_LEGACY_MATCH":"AMBIGUOUS_LEGACY_MATCH",
reason:excluded?"CONTRADICTORY_STRUCTURED_FIELDS":exact?"UNIQUE_IDENTITY_CANDIDATE":
criteria.some(k=>["PROPERTY","UNIT","ARRIVAL","DEPARTURE","SOURCE_REFERENCE"].includes(k))?"PARTIAL_OR_CONFLICTING_MATCH":"INSUFFICIENT_LEGACY_FIELDS_TO_EXCLUDE"};
}
function audit(snapshot,prior,legacy){
if(legacy.has_more!==false||legacy.results.length!==50)throw Error("Expected complete 50-row legacy set");
if(snapshot.bookings.length!==41||prior.bookings.length!==41)throw Error("Unexpected inputs");
const byId=new Map(snapshot.bookings.map(b=>[String(b.id),b]));
const rows=prior.bookings.map(m=>{
const b=byId.get(String(m.bookingId));if(!b)throw Error("Source missing");
if(m.outcome==="WOULD_UPDATE")return {bookingId:m.bookingId,action:"SAFE_UPDATE",existingNotionPages:m.matches.existingBookings.map(pageId),basis:"Approved canonical-ID dry-run retained"};
if(m.outcome!=="WOULD_CREATE")return {bookingId:m.bookingId,action:"EXCEPTIONS",reason:m.reason};
const pairs=legacy.results.map(l=>compare(b,m,l));
const candidates=pairs.filter(p=>p.classification!=="NO_COLLISION");
const exact=candidates.length===1&&candidates[0].classification==="EXACT_LEGACY_MATCH";
return {bookingId:b.id,action:candidates.length?exact?"LEGACY_EXACT_MATCH":"LEGACY_AMBIGUOUS":"SAFE_CREATE",
classification:candidates.length?exact?"EXACT_LEGACY_MATCH":"AMBIGUOUS_LEGACY_MATCH":"NO_COLLISION",
candidates,pairsCompared:pairs.length,excluded:pairs.length-candidates.length,
futureUpdate:exact?{technicallyEligible:true,notionPageId:candidates[0].notionPageId,conditions:["Re-read canonical ID before writing","Confirm no other source booking claims this page","Explicit write authorization"],authorized:false}:null};
});
const claims=new Map();
for(const r of rows)for(const c of r.candidates||[]){const list=claims.get(c.notionPageId)||[];list.push(r.bookingId);claims.set(c.notionPageId,list);}
for(const r of rows)if(r.action==="LEGACY_EXACT_MATCH"&&claims.get(r.candidates[0].notionPageId).length>1){r.action="LEGACY_AMBIGUOUS";r.classification="AMBIGUOUS_LEGACY_MATCH";r.futureUpdate=null;r.reason="MULTIPLE_SOURCE_CLAIMS";}
const summary={READ:rows.length};
for(const k of ["SAFE_CREATE","SAFE_UPDATE","LEGACY_EXACT_MATCH","LEGACY_AMBIGUOUS","EXCEPTIONS"])summary[k]=rows.filter(r=>r.action===k).length;
summary.RECONCILED=summary.READ===summary.SAFE_CREATE+summary.SAFE_UPDATE+summary.LEGACY_EXACT_MATCH+summary.LEGACY_AMBIGUOUS+summary.EXCEPTIONS;
summary.SAFE_WRITES=summary.SAFE_CREATE+summary.SAFE_UPDATE;
summary.WITHHELD=summary.LEGACY_EXACT_MATCH+summary.LEGACY_AMBIGUOUS+summary.EXCEPTIONS;
return {summary,rows};
}
function main(){
const [base]=process.argv.slice(2),out=path.join(base,"outputs");
const files={snapshot:path.join(out,"beds24-p0-snapshot.json"),prior:path.join(out,"p0-notion-dry-run-manifest.json"),legacy:path.join(base,"work","legacy-collision-evidence.json")};
const raw=Object.fromEntries(Object.entries(files).map(([k,f])=>[k,fs.readFileSync(f)]));
const result=audit(...["snapshot","prior","legacy"].map(k=>JSON.parse(raw[k])));
if(!result.summary.RECONCILED)throw Error("Reconciliation failed");
const artifact={audit:"PASS",writeGate:"CLOSED",notionWrites:0,beds24Writes:0,inputHashes:Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,crypto.createHash("sha256").update(v).digest("hex")])),
policy:["Exact requires property+unit+both dates and either source reference or exact normalized guest name plus channel, without contradictions; one-to-one only.",
"Name is secondary; no fuzzy or substring matching.",
"Missing legacy fields do not prove no collision; compatible unidentifiable records are withheld as ambiguous.",
"SAFE_UPDATE is retained from the approved prior dry-run. SAFE_WRITES is a count of proposed actions, not executed writes."],
...result};
fs.writeFileSync(path.join(out,"p0-revised-write-manifest.json"),JSON.stringify(artifact,null,2)+"\n");
const lines=["# Legacy collision audit",JSON.stringify(result.summary,null,2),"",
"All lines below contain only Booking ID, Notion Page ID and comparison criteria. A candidate is not proof of identity.",""];
for(const r of result.rows.filter(r=>r.candidates?.length)){lines.push("## Beds24 "+r.bookingId+" — "+r.classification);for(const c of r.candidates)lines.push("- "+c.notionPageId+" | "+c.reason+" | equal: "+c.criteria.join(",")+" | missing: "+c.missing.join(",")+" | conflicts: "+c.conflicts.join(","));}
fs.writeFileSync(path.join(out,"p0-legacy-collision-report.md"),lines.join("\n")+"\n");
console.log(JSON.stringify(result.summary));
console.log("Strong pair candidates",result.rows.flatMap(r=>(r.candidates||[]).filter(c=>c.classification==="EXACT_LEGACY_MATCH").map(c=>({bookingId:r.bookingId,pageId:c.notionPageId,criteria:c.criteria}))));
}
module.exports={compare,audit};
if(require.main===module)main();
