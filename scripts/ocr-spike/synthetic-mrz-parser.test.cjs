const assert=require("node:assert/strict");
const norm=s=>String(s).toUpperCase().replace(/\s/g,"").replace(/[^A-Z0-9<]/g,"");
const val=c=>/\d/.test(c)?+c:/[A-Z]/.test(c)?c.charCodeAt(0)-55:c==="<"?0:(()=>{throw Error("bad char")})();
const cd=s=>String([...s].reduce((n,c,i)=>n+val(c)*[7,3,1][i%3],0)%10);
function parseTd3(lines){
 if(!Array.isArray(lines)||lines.length!==2)throw Error("TD3 requires two lines");
 const a=norm(lines[0]),b=norm(lines[1]); if(a.length!==44||b.length!==44)throw Error("TD3 lines must be 44 chars");
 const doc=b.slice(0,9),dob=b.slice(13,19),exp=b.slice(21,27),personal=b.slice(28,42);
 const names=a.slice(5).split("<<");
 const checks={document:cd(doc)===b[9],birth:cd(dob)===b[19],expiry:cd(exp)===b[27],personal:cd(personal)===b[42],composite:cd(b.slice(0,10)+b.slice(13,20)+b.slice(21,43))===b[43]};
 return {surname:(names[0]||"").replace(/</g," ").trim(),given:names.slice(1).join(" ").replace(/</g," ").replace(/\s+/g," ").trim(),documentNumber:doc.replace(/</g,""),nationality:b.slice(10,13),birthYYMMDD:dob,sex:b[20],expiryYYMMDD:exp,checks,valid:Object.values(checks).every(Boolean)};
}
const sample=["P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<","L898902C36UTO7408122F1204159ZE184226B<<<<<10"];
const r=parseTd3(sample); assert.equal(r.surname,"ERIKSSON");assert.equal(r.given,"ANNA MARIA");assert.equal(r.documentNumber,"L898902C3");assert.equal(r.valid,true);
const bad=parseTd3([sample[0],sample[1].replace("7408122","7408132")]);assert.equal(bad.valid,false);assert.equal(bad.checks.birth,false);
console.log("SYNTHETIC_MRZ_PARSER_TEST_PASS",JSON.stringify(r));