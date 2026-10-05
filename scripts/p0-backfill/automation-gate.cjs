"use strict";
function evaluateAutomationGate(x){
 const checks={
  freshRead:x.freshRead===true,
  mf3ReadBack:x.mf3ReadBack===true,
  controlledRun:x.controlledRun===true,
  reconciliation:x.reconciliation===true,
  unexpectedCreates:Number(x.unexpectedCreates||0)===0,
  duplicates:Number(x.duplicates||0)===0,
  blockingExceptions:Number(x.blockingExceptions||0)===0
 };
 const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
 return {pass:failed.length===0,failed,schedule:failed.length?null:{frequency:"HOURLY",interval:6,timezone:"Europe/Rome"}};
}
module.exports={evaluateAutomationGate};