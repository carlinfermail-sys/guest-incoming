const assert=require("node:assert/strict");
function reconcile(c){
 for(const k of ["read","created","updated","exceptions","duplicates"]){
  assert(Number.isInteger(c[k])&&c[k]>=0, k+" must be a non-negative integer");
 }
 const accounted=c.created+c.updated+c.exceptions;
 return {accounted,balanced:c.read===accounted,duplicatesCovered:c.duplicates<=c.exceptions};
}
const cases=[
 [{read:10,created:2,updated:7,exceptions:1,duplicates:1},true,true],
 [{read:10,created:2,updated:6,exceptions:1,duplicates:0},false,true],
 [{read:3,created:0,updated:2,exceptions:1,duplicates:2},true,false],
 [{read:0,created:0,updated:0,exceptions:0,duplicates:0},true,true]
];
for(const [input,balanced,covered] of cases){
 const r=reconcile(input); assert.equal(r.balanced,balanced);assert.equal(r.duplicatesCovered,covered);
}
console.log("P0_RECONCILIATION_CONTRACT_TEST_PASS");
module.exports={reconcile};