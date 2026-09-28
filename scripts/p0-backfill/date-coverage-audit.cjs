"use strict";
const fs=require("node:fs"), path=require("node:path"),os=require("node:os");
const {safeUrl}=require("./beds24-read.cjs");
async function main(){
const tls=require("node:tls");
tls.setDefaultCACertificates([...new Set([...tls.getCACertificates("default"),...tls.getCACertificates("system")])]);
const token=fs.readFileSync(path.join(os.homedir(),"Documents","beds24-access-token.txt"),"utf8").trim();
const audit={from:"2026-04-01",to:"2026-06-21",scope:"Bookings visible to the existing Beds24 credential; all documented statuses",queries:[],matches:[]};
for(const status of ["confirmed","request","new","cancelled","black","inquiry"]){
let url="https://api.beds24.com/v2/bookings?"+new URLSearchParams({arrivalFrom:"2026-03-31",arrivalTo:"2026-06-22",status});
const seen=new Set();let rows=0,pages=0;
while(url){
url=safeUrl(url);
if(seen.has(url)||pages>=10000)throw Error("Pagination loop");seen.add(url);
const response=await fetch(url,{method:"GET",headers:{token,Accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(60000)});
if(!response.ok)throw Error("HTTP "+response.status);
const b=await response.json();
if(b.success===false||!Array.isArray(b.data)||typeof b.pages?.nextPageExists!=="boolean")throw Error("Invalid page");
pages++;rows+=b.data.length;
for(const r of b.data)if(r.arrival>="2026-04-01"&&r.arrival<="2026-06-21")audit.matches.push({id:r.id,arrival:r.arrival,status:r.status,propertyId:r.propertyId,roomId:r.roomId});
if(b.pages.nextPageExists){if(!b.pages.nextPageLink)throw Error("Missing link");url=safeUrl(b.pages.nextPageLink,url)}else{if(b.pages.nextPageLink)throw Error("Terminal mismatch");url=null;}
}
audit.queries.push({status,pages,rows,complete:true});
}
audit.result=audit.matches.length?"ISSUE":"VERIFIED";
audit.conclusion=audit.matches.length?"Earlier bookings exist; snapshot coverage issue":"No arrivals 2026-04-01 through 2026-06-21 returned by the API across all six statuses. Local filter includes April 1 and has no upper bound.";
fs.writeFileSync(process.argv[2],JSON.stringify(audit,null,2)+"\n");
console.log(JSON.stringify(audit));
}
main().catch(()=>{console.error("DATE AUDIT BLOCKED: request or pagination failed; no credentials logged");process.exitCode=1;});
