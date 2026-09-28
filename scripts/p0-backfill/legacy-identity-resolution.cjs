"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const norm=v=>String(v??"").normalize("NFC").trim().replace(/\s+/g," ").toLowerCase();
const pid=v=>String(v??"").split("/").at(-1).replace(/-/g,"");
function relation(v){if(!v)return null;const r=JSON.parse(v),a=Array.isArray(r)?r:[r];return a.length===1?pid(a[0]):null}
function legacyFingerprint(l){
const property=relation(l.Property),unit=relation(l.Unit),arrival=l["date:Check-in:start"]||l["date:Dates:start"],departure=l["date:Check-out:start"]||l["date:Dates:end"];
const conflict=!!((l["date:Check-in:start"]&&l["date:Dates:start"]&&l["date:Check-in:start"]!==l["date:Dates:start"])||(l["date:Check-out:start"]&&l["date:Dates:end"]&&l["date:Check-out:start"]!==l["date:Dates:end"]));
return {property,unit,arrival:arrival||null,departure:departure||null,conflict,key:property&&unit&&arrival&&departure?[property,unit,arrival,departure].join("|"):null};
}
function contradictions(b,m,l){
const c=[],n=norm(l["Guest / Stay"]).replace(/^(booking|prenotazione)\s*[-:]\s*/,"");
if(n&&n!==norm(b.firstName+" "+b.lastName))c.push("GUEST_NAME_DIFFERENT");
if(l["Guest Count"]!=null&&l["Guest Count"]!==b.numAdult+b.numChild)c.push("GUEST_COUNT_DIFFERENT");
for(const k of ["Channel","Booking Source"])if(l[k]&&norm(l[k])!==norm(m.plannedMapping[k]))c.push(k.toUpperCase().replace(/ /g,"_")+"_DIFFERENT");
if(l["Beds24 API Reference"]&&norm(l["Beds24 API Reference"])!==norm(b.apiReference))c.push("REFERENCE_DIFFERENT");
for(const [k,s] of [["Price","price"],["Commission","commission"]])if(l[k]!=null&&l[k]!==b[s])c.push(k.toUpperCase()+"_DIFFERENT");
if(legacyFingerprint(l).conflict)c.push("LEGACY_DATE_CONFLICT");
return c;
}
function resolve(snapshot,prior,legacy){
if(legacy.has_more!==false||legacy.results.length!==50)throw Error("Incomplete legacy evidence");
const index=new Map(),dateIndex=new Map();
const audit=legacy.results.map(l=>{
const f=legacyFingerprint(l);
if(f.key){const a=index.get(f.key)||[];a.push(l);index.set(f.key,a);}
else if(f.arrival&&f.departure){const key=f.arrival+"|"+f.departure,a=dateIndex.get(key)||[];a.push(l);dateIndex.set(key,a);}
return {notionPageId:pid(l.url),fingerprint:f,missing:["property","unit","arrival","departure"].filter(k=>!f[k]),titlePresent:!!l["Guest / Stay"],referencePresent:!!l["Beds24 API Reference"]};
});
const bs=new Map(snapshot.bookings.map(b=>[String(b.id),b])),sourceClaims=new Map();
for(const m of prior.bookings){const b=bs.get(String(m.bookingId)),key=[pid(m.plannedMapping.Property),pid(m.plannedMapping.Unit),b.arrival,b.departure].join("|");const a=sourceClaims.get(key)||[];a.push(b.id);sourceClaims.set(key,a);}
const rows=prior.bookings.map(m=>{
const b=bs.get(String(m.bookingId)),key=[pid(m.plannedMapping.Property),pid(m.plannedMapping.Unit),b.arrival,b.departure].join("|");
const row={bookingId:b.id,fingerprint:key,action:null,proposedOperation:null};
if(m.outcome==="WOULD_UPDATE"){row.action="SAFE_UPDATE";row.proposedOperation={method:"UPDATE",notionPageId:pid(m.matches.existingBookings[0]),properties:m.plannedMapping,executed:false};return row;}
if(m.outcome!=="WOULD_CREATE"){row.action="EXCEPTIONS";row.reason=m.reason;return row;}
const matches=index.get(key)||[];
const partial=(dateIndex.get(b.arrival+"|"+b.departure)||[]).filter(l=>{
const f=legacyFingerprint(l);
return (!f.property||f.property===pid(m.plannedMapping.Property))&&(!f.unit||f.unit===pid(m.plannedMapping.Unit));
});
row.exactFingerprintPages=matches.map(l=>pid(l.url));
row.partialDateCandidates=partial.map(l=>({notionPageId:pid(l.url),missing:legacyFingerprint(l).property?["Unit"]:["Property","Unit"]}));
const c=matches.length===1?contradictions(b,m,matches[0]):[];
if(matches.length===1&&!c.length&&sourceClaims.get(key).length===1&&partial.length===0){
row.action="LEGACY_RESOLVED_MATCH";row.proposedOperation={method:"UPDATE",notionPageId:pid(matches[0].url),properties:m.plannedMapping,executed:false};
row.criteria=["PROPERTY","UNIT","ARRIVAL","DEPARTURE","GUEST_EXACT_NORMALIZED","CHANNEL_SOURCE","NO_AVAILABLE_FIELD_CONTRADICTION"];
}else if(matches.length||partial.length){row.action="UNRESOLVED";row.missingInformation=c.length?c:matches.length>1?["DISTINGUISH_MULTIPLE_LEGACY_PAGES"]:sourceClaims.get(key).length>1?["DISTINGUISH_SOURCE_BOOKINGS_WITH_SAME_FINGERPRINT"]:["PROPERTY_UNIT_OR_SOURCE_REFERENCE_TO_DISTINGUISH_PARTIAL_DATE_MATCHES"];
}else{row.action="SAFE_CREATE";row.proposedOperation={method:"CREATE",properties:m.plannedMapping,executed:false};row.basis="No matching deterministic fingerprint or compatible exact-date partial group; per micro-mission 4 rule 7";}
return row;
});
const summary={READ:rows.length};for(const k of ["SAFE_CREATE","SAFE_UPDATE","LEGACY_RESOLVED_MATCH","UNRESOLVED","EXCEPTIONS"])summary[k]=rows.filter(r=>r.action===k).length;
summary.RECONCILED=summary.READ===summary.SAFE_CREATE+summary.SAFE_UPDATE+summary.LEGACY_RESOLVED_MATCH+summary.UNRESOLVED+summary.EXCEPTIONS;
summary.PROPOSED_CREATES=summary.SAFE_CREATE;summary.PROPOSED_UPDATES=summary.SAFE_UPDATE+summary.LEGACY_RESOLVED_MATCH;summary.WITHHELD=summary.UNRESOLVED+summary.EXCEPTIONS;
const controls=[[88522951,"36c31e5cb8d780edb050fae6feaa3511"],[88522952,"36c31e5cb8d7807e981af2414e6b2524"],[88522948,"36c31e5cb8d78018b4bbca0394c215bc"]].map(([bookingId,notionPageId])=>{
const r=rows.find(r=>r.bookingId===bookingId);return {bookingId,notionPageId,fingerprintConfirmed:r.exactFingerprintPages?.includes(notionPageId),resolved:r.action==="LEGACY_RESOLVED_MATCH",contradictions:r.missingInformation||[]};});
summary.THREE_CONTROL_MATCHES=controls.every(c=>c.resolved)?"CONFIRMED":"NOT CONFIRMED";
return {summary,controls,legacyIdentityInventory:audit,rows};
}
function main(){
const base=process.argv[2],out=path.join(base,"outputs");
const files=[path.join(out,"beds24-p0-snapshot.json"),path.join(out,"p0-notion-dry-run-manifest.json"),path.join(base,"work","legacy-identity-evidence.json")];
const raw=files.map(f=>fs.readFileSync(f)),inputs=raw.map(b=>JSON.parse(b));
const result=resolve(...inputs);
if(!result.summary.RECONCILED||result.summary.READ!==41)throw Error("Reconciliation failed");
const report={identityResolution:"PASS",writeGate:3,writeAuthorized:false,notionWrites:0,beds24Writes:0,
policy:["Micro-mission 4 supersedes blanket ambiguity for unidentifiable legacy records: absent matching fingerprint is SAFE_CREATE, not proof of real-world absence.",
"Index property+unit+exact arrival+departure; inspect only matching groups and compatible exact-date incomplete groups. No cross-product.",
"Exact-normalized guest name, channel/source, count, price, commission and reference are secondary contradiction checks. No fuzzy matching.",
"Legacy records without sufficient fingerprint remain documented as incomplete. They do not veto every CREATE.",
"Re-read target and canonical ID before any separately authorized write; never execute this file as a write runner."],
inputHashes:files.map((file,i)=>({file,sha256:crypto.createHash("sha256").update(raw[i]).digest("hex")})),...result};
fs.writeFileSync(path.join(out,"p0-final-write-manifest.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(result.summary,null,2));
console.log("CONTROLS",JSON.stringify(result.controls));
console.log("UNRESOLVED",JSON.stringify(result.rows.filter(r=>r.action==="UNRESOLVED").map(r=>({bookingId:r.bookingId,missingInformation:r.missingInformation}))));
}
module.exports={legacyFingerprint,contradictions,resolve};
if(require.main===module)main();
