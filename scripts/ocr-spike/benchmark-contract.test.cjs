const assert=require("node:assert/strict");const fs=require("node:fs");const path=require("node:path");
const d=JSON.parse(fs.readFileSync(path.join(__dirname,"synthetic-dataset.json"),"utf8"));
assert(d.length>=5);assert(d.some(x=>x.rotation));assert(d.some(x=>x.contrast==="low"));assert(d.filter(x=>x.kind==="passport-mrz").length>=2);
for(const x of d){assert(x.id);assert(x.kind);if(x.kind==="passport-mrz"){assert.equal(x.lines.length,2);assert(x.lines.every(s=>s.length===44));}}
console.log("OCR_SYNTHETIC_DATASET_CONTRACT_PASS",d.length);