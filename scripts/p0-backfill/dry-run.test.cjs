"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {classify,reconcile}=require("./dry-run.cjs");
test("P0 guards classify every input, respect precedence and reconcile",()=>{
const base={booking:{id:1},properties:[{}],units:[{}],existingBookings:[]};
const cases=[
[{}, {outcome:"WOULD_CREATE"}],
[{existingBookings:[{}]}, {outcome:"WOULD_UPDATE"}],
[{properties:[]}, {outcome:"EXCEPTION",reason:"PROPERTY_NOT_FOUND"}],
[{properties:[{},{}]}, {outcome:"EXCEPTION",reason:"PROPERTY_AMBIGUOUS"}],
[{units:[]}, {outcome:"EXCEPTION",reason:"UNIT_NOT_FOUND"}],
[{units:[{},{}]}, {outcome:"EXCEPTION",reason:"UNIT_AMBIGUOUS"}],
[{existingBookings:[{},{}]}, {outcome:"EXCEPTION",reason:"DUPLICATE_BOOKING_ID"}],
[{booking:{}}, {outcome:"EXCEPTION",reason:"BOOKING_ID_MISSING"}],
[{properties:[],units:[],existingBookings:[{},{}]}, {outcome:"EXCEPTION",reason:"PROPERTY_NOT_FOUND"}]];
for(const [override,expected] of cases)assert.deepEqual(classify({...base,...override}),expected);
const totals=reconcile();
assert.equal(totals.READ,9);assert.equal(totals.EXCEPTIONS,7);
assert.equal(totals.DUPLICATES,1);assert.equal(totals.RECONCILED,true);
assert.equal(totals.DUPLICATES_VALID,true);
});
