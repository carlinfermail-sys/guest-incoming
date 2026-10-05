"use strict";
const ORDER=["tipoAlloggiato","camereOccupate","dataArrivo","dataPartenza","sesso","cognome","nome","dataNascita","cittadinanza","statoNascita","comuneNascita","tipoDocumento","numeroDocumento","statoRilascio","comuneRilascio","dataRilascio","dataScadenza"];
const REQUIRED=["tipoAlloggiato","dataArrivo","dataPartenza","sesso","cognome","nome","dataNascita","cittadinanza"];
function normalizeGuest(input){
 const out={};for(const k of ORDER)out[k]=input[k]??null;
 if(out.camereOccupate!=null)out.camereOccupate=Number(out.camereOccupate);
 return out;
}
function validateGuest(input){
 const x=normalizeGuest(input),errors=[],review=[];
 for(const k of REQUIRED)if(x[k]==null||x[k]==="")errors.push({field:k,code:"REQUIRED"});
 if(x.camereOccupate!=null&&x.camereOccupate!==1)errors.push({field:"camereOccupate",code:"HOLIDAY_HOME_UNIT_COUNT_MUST_BE_1"});
 const conf=input._confidence||{};for(const [k,v] of Object.entries(conf))if(typeof v==="number"&&v<0.9)review.push({field:k,code:"LOW_OCR_CONFIDENCE",confidence:v});
 if(input._mrzValid===false)review.push({field:"mrz",code:"MRZ_CHECK_FAILED"});
 return {data:x,errors,review,operatorApprovalRequired:true,autoSubmitAllowed:false};
}
module.exports={ORDER,REQUIRED,normalizeGuest,validateGuest};