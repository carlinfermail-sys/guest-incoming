"use strict";
function createCounters(){return {READ:0,CREATED:0,UPDATED:0,EXCEPTIONS:0,DUPLICATES:0};}
function record(c,outcome){
 if(!c||typeof c!=="object")throw new TypeError("counters required");
 c.READ++;
 switch(outcome){
  case "CREATED":c.CREATED++;break;
  case "UPDATED":c.UPDATED++;break;
  case "DUPLICATE_BOOKING_ID":c.EXCEPTIONS++;c.DUPLICATES++;break;
  case "EXCEPTION":c.EXCEPTIONS++;break;
  default:throw new Error("Unknown primary outcome: "+outcome);
 }
 return c;
}
function reconcile(c){
 const ACCOUNTED=c.CREATED+c.UPDATED+c.EXCEPTIONS;
 return {...c,ACCOUNTED,RECONCILED:c.READ===ACCOUNTED,DUPLICATES_VALID:c.DUPLICATES<=c.EXCEPTIONS};
}
function assertReconciled(c){
 const r=reconcile(c);
 if(!r.RECONCILED)throw new Error(`P0 reconciliation failed: READ=${r.READ}, ACCOUNTED=${r.ACCOUNTED}`);
 if(!r.DUPLICATES_VALID)throw new Error(`P0 duplicate accounting failed: DUPLICATES=${r.DUPLICATES}, EXCEPTIONS=${r.EXCEPTIONS}`);
 return r;
}
module.exports={createCounters,record,reconcile,assertReconciled};