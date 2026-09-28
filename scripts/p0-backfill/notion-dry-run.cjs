"use strict";
// Offline dry-run. Notion reads are captured through the connected read-only
// query tool; this program contains no network client and cannot write Notion.
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {classify,reconcile}=require("./dry-run.cjs");
function main(){
const [snapshotFile,evidenceFile,schemaFile,auditFile,outDir]=process.argv.slice(2);
if(!outDir)throw Error("Expected snapshot, evidence, schema, date audit, output directory");
const raw=fs.readFileSync(snapshotFile);
const snapshot=JSON.parse(raw),evidence=JSON.parse(fs.readFileSync(evidenceFile)),schema=JSON.parse(fs.readFileSync(schemaFile)).schema,audit=JSON.parse(fs.readFileSync(auditFile));
const snapshotHash=crypto.createHash("sha256").update(raw).digest("hex");
if(snapshot.bookings.length!==41||snapshot.arrivalFrom!=="2026-04-01")throw Error("Unexpected frozen input");
for(const key of ["properties","units","bookings"])if(evidence[key].has_more!==false||!Array.isArray(evidence[key].results))throw Error("Incomplete Notion evidence");
const canonical=v=>v==null?"":String(v).trim();
const idFromUrl=u=>u.split("/").at(-1).replace(/-/g,"");
const seen=new Set();
const manifest=snapshot.bookings.map(b=>{
if(seen.has(String(b.id)))throw Error("Duplicate source ID");seen.add(String(b.id));
const properties=evidence.properties.results.filter(p=>p["Beds24 Property ID"]===b.propertyId);
const units=evidence.units.results.filter(u=>u["Beds24 Property ID"]===b.propertyId&&u["Beds24 Room ID"]===b.roomId);
const existingBookings=evidence.bookings.results.filter(n=>canonical(n["Beds24 Booking ID"])===String(b.id));
const result=classify({booking:b,properties,units,existingBookings});
const warnings=[];
if(properties.length===1&&units.length===1&&!JSON.parse(units[0]["Property "]||"[]").some(u=>idFromUrl(u)===idFromUrl(properties[0].url)))warnings.push("UNIT_PROPERTY_RELATION_MISMATCH");
const status={confirmed:"Confirmed",new:"Pending",request:"Pending",inquiry:"Pending",cancelled:"Cancelled"}[b.status];
const channel={booking:"Booking.com",airbnb:"Airbnb"}[b.channel];
const plan={
"Beds24 Booking ID":String(b.id),"Beds24 Property ID":b.propertyId,"Beds24 Room ID":b.roomId,"Beds24 Unit ID":b.unitId,
"Beds24 Status":b.status,"Booking Status":status??null,
"Booking Source":channel&&b.apiSource===channel&&b.referer===channel?channel:null,
"Channel":channel??null,"Booking Type":channel?"OTA":null,
"Check-in":b.arrival,"Check-out":b.departure,"Dates":{start:b.arrival,end:b.departure},
"Guest Count":Number.isInteger(b.numAdult)&&Number.isInteger(b.numChild)?b.numAdult+b.numChild:null,
"Price":b.price??null,"Commission":b.commission??null,
"Beds24 API Reference":b.apiReference??null,"Beds24 Source ID":b.apiSourceId??null,
"Booking Time":b.bookingTime??null,"Modified Time":b.modifiedTime??null,
"Property":properties.length===1?properties[0].url:null,"Unit":units.length===1?units[0].url:null};
for(const [key,value] of Object.entries(plan)){
if(!schema[key])warnings.push("TARGET_FIELD_MISSING:"+key);
else if(schema[key].type==="select"&&value!=null&&!schema[key].options.some(o=>o.name===value))warnings.push("SELECT_NOT_ALLOWED:"+key);
if(value==null)warnings.push("MAPPING_UNRESOLVED:"+key);
}
if(!/^\d{4}-\d{2}-\d{2}$/.test(b.arrival)||b.departure<=b.arrival)warnings.push("INVALID_DATES");
return {bookingId:b.id,propertyId:b.propertyId,roomId:b.roomId,unitId:b.unitId,
matches:{properties:properties.map(p=>p.url),units:units.map(u=>u.url),existingBookings:existingBookings.map(n=>n.url)},
...result,plannedMapping:plan,
sourceAudit:{status:b.status,channel:b.channel,referer:b.referer,apiSource:b.apiSource,
guest:{firstNamePresent:!!b.firstName,lastNamePresent:!!b.lastName,numAdult:b.numAdult,numChild:b.numChild},
financial:{price:b.price,commission:b.commission,deposit:b.deposit,tax:b.tax},
unmappedAvailableFields:["deposit","tax"],guestNameHandling:"Present in frozen snapshot; not copied into audit artifacts"},
warnings};
});
const summary=reconcile();
for(const reason of ["PROPERTY_NOT_FOUND","PROPERTY_AMBIGUOUS","UNIT_NOT_FOUND","UNIT_AMBIGUOUS","DUPLICATE_BOOKING_ID"])summary[reason]=manifest.filter(m=>m.reason===reason).length;
summary.DATE_COVERAGE=audit.result;
summary.MAPPING_WARNINGS=manifest.reduce((n,m)=>n+m.warnings.length,0);
summary.NOTION_RECORDS_WITHOUT_CANONICAL_ID=evidence.bookings.results.filter(r=>!canonical(r["Beds24 Booking ID"])).length;
summary.DRY_RUN=summary.RECONCILED&&summary.DUPLICATES_VALID&&audit.result==="VERIFIED"&&summary.MAPPING_WARNINGS===0?"PASS":"BLOCKED";
const report={summary,input:{snapshotFile,snapshotHash,notionReadAt:evidence.capturedAt,notionDataSources:Object.fromEntries(["properties","units","bookings"].map(k=>[k,evidence[k].data_source_ids]))},
dateAudit:audit,mappingNotes:[
"Status and guest-count rules reused from P0 contract. All observed statuses match existing Notion options.",
"Observed channel booking/airbnb agrees with referer and apiSource Booking.com/Airbnb; dry-run candidates use these existing source/channel options and OTA. No writes certify these candidates.",
"Property uses propertyId. Unit uses propertyId+roomId, with relation consistency checked. unitId alone is never used.",
"All 41 records provide arrival/departure, guest names/counts, property/room/unit IDs, financial values and source timestamps.",
"Price and Commission have explicit raw source mappings in the live Notion schema. Deposit and tax have no dedicated target; preserve source values without inventing mappings.",
"Guest names remain in the frozen snapshot; audit records only presence. No names, email or phone copied into manifest.",
"Legacy Notion records without Beds24 Booking ID cannot be matched by the approved idempotency key; WOULD_CREATE is not proof these are new real-world stays.",
"Write gate closed. No payload has been sent to Notion."
],beds24Writes:0,notionWrites:0};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,"p0-notion-dry-run-manifest.json"),JSON.stringify({input:report.input,summary,bookings:manifest},null,2)+"\n");
fs.writeFileSync(path.join(outDir,"p0-notion-dry-run-report.json"),JSON.stringify(report,null,2)+"\n");
if(crypto.createHash("sha256").update(fs.readFileSync(snapshotFile)).digest("hex")!==snapshotHash)throw Error("Input changed");
console.log(JSON.stringify(summary,null,2));
console.log("EXCEPTIONS:",JSON.stringify(manifest.filter(m=>m.outcome==="EXCEPTION").map(m=>({bookingId:m.bookingId,reason:m.reason}))));
}
main();
