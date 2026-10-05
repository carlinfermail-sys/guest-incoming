"use strict";const {test}=require("node:test");const assert=require("node:assert/strict");const {ORDER,normalizeGuest,validateGuest}=require("./ros1000-contract.cjs");
const base={tipoAlloggiato:"capofamiglia",camereOccupate:1,dataArrivo:"2026-10-05",dataPartenza:"2026-10-07",sesso:"M",cognome:"ROSSI",nome:"MARIO",dataNascita:"1990-04-12",cittadinanza:"ITA",statoNascita:"ITALIA",comuneNascita:"BERGAMO",tipoDocumento:"CARTA_IDENTITA",numeroDocumento:"CA00000AA",statoRilascio:"ITALIA",comuneRilascio:"BERGAMO",dataRilascio:"2020-04-12",dataScadenza:"2030-04-11"};
test("output preserves exact ROS1000 order",()=>assert.deepEqual(Object.keys(normalizeGuest(base)),ORDER));
test("holiday-home occupied unit is one",()=>assert.equal(validateGuest(base).errors.length,0));
test("wrong occupied-unit count is blocked",()=>assert(validateGuest({...base,camereOccupate:2}).errors.some(e=>e.code==="HOLIDAY_HOME_UNIT_COUNT_MUST_BE_1")));
test("low OCR confidence and failed MRZ require review",()=>{const r=validateGuest({...base,_confidence:{numeroDocumento:.61},_mrzValid:false});assert.equal(r.operatorApprovalRequired,true);assert.equal(r.autoSubmitAllowed,false);assert.equal(r.review.length,2)});
