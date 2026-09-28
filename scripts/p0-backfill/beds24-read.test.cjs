"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {collect,safeUrl,sanitize} = require("./beds24-read.cjs");
test("pagination, inclusive cutoff, future and cancelled bookings", async () => {
  let calls=0;
  const result=await collect("test-secret",async (url,options)=>{
    calls++;
    assert.equal(options.method,"GET");
    assert.equal(options.redirect,"error");
    const u=new URL(url), status=u.searchParams.get("status");
    const second=u.searchParams.get("page")==="2";
    const data=status==="confirmed" ? (second
      ? [{id:2,status,arrival:"2027-04-22"}]
      : [{id:1,status,arrival:"2026-04-01"},{id:3,status,arrival:"2026-03-31"}])
      : status==="cancelled" ? [{id:4,status,arrival:"2026-05-01"}] : [];
    return {ok:true,json:async()=>({data,pages:{nextPageExists:status==="confirmed"&&!second,
      nextPageLink:status==="confirmed"&&!second ? url+"&page=2" : null}})};
  });
  assert.equal(calls,7);
  assert.deepEqual(result.bookings.map(b=>b.id),[1,4,2]);
});
test("reject unsafe destinations and missing page links",async()=>{
  assert.throws(()=>safeUrl("https://example.org/v2/bookings"));
  assert.throws(()=>safeUrl("https://api.beds24.com/v2/authentication/setup"));
  await assert.rejects(collect("test",async()=>({ok:true,json:async()=>({
    data:[],pages:{nextPageExists:true,nextPageLink:null}})})),/Missing next page/);
});
test("reject pagination cycles",async()=>{
  await assert.rejects(collect("test",async url=>({ok:true,json:async()=>({
    data:[],pages:{nextPageExists:true,nextPageLink:url}})})),/Pagination loop/);
});
test("remove credential fields and redact exact secret recursively",()=>{
  assert.deepEqual(sanitize({stripeToken:"x",nested:{password:"y",note:"abc secret"},id:1},"secret"),
    {id:1,nested:{note:"abc [REDACTED]"}});
});

const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const {saveSnapshot} = require("./beds24-read.cjs");
test("snapshot stays intact on equal data and safely replaces changed data", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "beds24-snapshot-"));
  t.after(() => fs.rmSync(dir, {recursive:true, force:true}));
  const target = path.join(dir, "snapshot.json");
  saveSnapshot(target, "old\n");
  assert.equal(fs.readFileSync(target,"utf8"), "old\n");
  saveSnapshot(target, "old\n");
  assert.deepEqual(fs.readdirSync(dir), ["snapshot.json"]);
  saveSnapshot(target, "new\n");
  assert.equal(fs.readFileSync(target,"utf8"), "new\n");
  assert.deepEqual(fs.readdirSync(dir), ["snapshot.json"]);
});
test("restore previous snapshot if installing a changed one fails", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "beds24-rollback-"));
  t.after(() => fs.rmSync(dir, {recursive:true, force:true}));
  const target = path.join(dir, "snapshot.json");
  fs.writeFileSync(target, "old\n");
  const realRename = fs.renameSync;
  fs.renameSync = (source, destination) => {
    if (source === target + ".tmp" && destination === target)
      throw Object.assign(new Error("locked"), {code:"EPERM"});
    return realRename(source, destination);
  };
  try { assert.throws(() => saveSnapshot(target, "new\n"), /locked/); }
  finally { fs.renameSync = realRename; }
  assert.equal(fs.readFileSync(target, "utf8"), "old\n");
  assert.equal(fs.readdirSync(dir).filter(n => n.includes("backup")).length, 0);
});
