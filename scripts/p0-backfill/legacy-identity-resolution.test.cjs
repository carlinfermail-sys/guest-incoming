"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {legacyFingerprint,contradictions}=require("./legacy-identity-resolution.cjs");
const base={Property:'["https://app.notion.com/p1"]',Unit:'["https://app.notion.com/u1"]',"date:Check-in:start":"2026-08-01","date:Check-out:start":"2026-08-05"};
test("fingerprint uses four exact components",()=>assert.equal(legacyFingerprint(base).key,"p1|u1|2026-08-01|2026-08-05"));
test("missing unit cannot form full fingerprint",()=>assert.equal(legacyFingerprint({...base,Unit:null}).key,null));
test("conflicting dates are flagged",()=>assert.equal(legacyFingerprint({...base,"date:Dates:start":"2026-08-02"}).conflict,true));
test("guest count contradiction blocks identity resolution",()=>{
const b={firstName:"Test",lastName:"Guest",numAdult:2,numChild:1};
assert.deepEqual(contradictions(b,{plannedMapping:{}},{...base,"Guest / Stay":"Booking - Test Guest","Guest Count":4}),["GUEST_COUNT_DIFFERENT"]);
});
test("name normalization is exact and never fuzzy",()=>{
const b={firstName:"Test",lastName:"Guest",numAdult:2,numChild:1};
assert.deepEqual(contradictions(b,{plannedMapping:{}},{...base,"Guest / Stay":"Booking - TEST   GUEST","Guest Count":3}),[]);
assert.deepEqual(contradictions(b,{plannedMapping:{}},{...base,"Guest / Stay":"Test Guestt"}),["GUEST_NAME_DIFFERENT"]);
});
