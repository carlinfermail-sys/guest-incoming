"use strict";
const {validateGuest}=require("./ros1000-contract.cjs");
const STATES=Object.freeze({CAPTURED:"CAPTURED",OCR_COMPLETE:"OCR_COMPLETE",REVIEW_REQUIRED:"REVIEW_REQUIRED",APPROVED:"APPROVED",EXPORT_READY:"EXPORT_READY",PURGED:"PURGED"});
function createSession({sessionId,sourceImageRef,ocrData}){
 if(!sessionId)throw new Error("sessionId required");
 if(!sourceImageRef)throw new Error("sourceImageRef required");
 return {sessionId:String(sessionId),state:STATES.OCR_COMPLETE,sourceImageRef:String(sourceImageRef),ocrData:{...ocrData},normalized:null,review:[],errors:[],operatorApproved:false,exportReady:false,purged:false,audit:[]};
}
function validateSession(s){
 const r=validateGuest(s.ocrData);s.normalized=r.data;s.review=r.review;s.errors=r.errors;
 s.state=(r.errors.length||r.review.length)?STATES.REVIEW_REQUIRED:STATES.REVIEW_REQUIRED;
 s.audit.push({event:"VALIDATED",errors:r.errors.length,review:r.review.length});
 return s;
}
function applyOperatorCorrections(s,patch){
 if(s.purged)throw new Error("session purged");
 const allowed=new Set(Object.keys(s.normalized||{}));
 for(const [k,v] of Object.entries(patch||{})){if(!allowed.has(k))throw new Error("Unknown field correction: "+k);s.ocrData[k]=v}
 s.audit.push({event:"OPERATOR_CORRECTION",fields:Object.keys(patch||{})});
 return validateSession(s);
}
function approve(s,operatorId){
 if(!operatorId)throw new Error("operatorId required");
 if(s.errors.length)throw new Error("Cannot approve with blocking errors");
 s.operatorApproved=true;s.state=STATES.APPROVED;s.audit.push({event:"OPERATOR_APPROVED",operatorId:String(operatorId)});return s;
}
function prepareExport(s){
 if(!s.operatorApproved)throw new Error("Operator approval required");
 if(s.errors.length)throw new Error("Blocking errors remain");
 s.exportReady=true;s.state=STATES.EXPORT_READY;s.audit.push({event:"EXPORT_PREPARED"});
 return {sessionId:s.sessionId,state:s.state,data:s.normalized,autoSubmit:false};
}
function purgeSource(s){
 if(!s.exportReady)throw new Error("Cannot purge before export is prepared");
 s.sourceImageRef=null;s.ocrData=null;s.purged=true;s.state=STATES.PURGED;s.audit.push({event:"SOURCE_PURGED"});return s;
}
module.exports={STATES,createSession,validateSession,applyOperatorCorrections,approve,prepareExport,purgeSource};