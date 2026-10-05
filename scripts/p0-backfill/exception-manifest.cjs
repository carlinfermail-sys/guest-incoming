"use strict";
const ALLOWED=new Set(["DUPLICATE_BOOKING_ID","MISSING_BOOKING_ID","PROPERTY_NOT_FOUND","PROPERTY_AMBIGUOUS","UNIT_NOT_FOUND","UNIT_AMBIGUOUS","UNEXPECTED"]);
function createManifest(){return []}
function addException(m,{bookingId=null,reason,detail=""}){
 if(!Array.isArray(m))throw new TypeError("manifest required");
 if(!ALLOWED.has(reason))throw new Error("Unknown exception reason: "+reason);
 const row={bookingId:bookingId==null?null:String(bookingId),reason,detail:String(detail||"")};
 m.push(row);return row;
}
function summarize(m){
 const byReason={};for(const x of m)byReason[x.reason]=(byReason[x.reason]||0)+1;
 return {EXCEPTIONS:m.length,DUPLICATES:byReason.DUPLICATE_BOOKING_ID||0,byReason};
}
module.exports={createManifest,addException,summarize,ALLOWED};