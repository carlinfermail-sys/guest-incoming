"use strict";

/*
 * Guest Incoming P0 Backfill Runner
 * SAFE DEFAULT: DRY-RUN ONLY.
 *
 * No Beds24 writes.
 * No Notion writes.
 * No credentials stored here.
 */

const counters = {
  READ: 0,
  WOULD_CREATE: 0,
  WOULD_UPDATE: 0,
  EXCEPTIONS: 0,
  DUPLICATES: 0,
};

function classify({ booking, properties, units, existingBookings }) {
  counters.READ++;

  if (!booking?.id) {
    counters.EXCEPTIONS++;
    return { outcome: "EXCEPTION", reason: "BOOKING_ID_MISSING" };
  }

  if (properties.length === 0) {
    counters.EXCEPTIONS++;
    return { outcome: "EXCEPTION", reason: "PROPERTY_NOT_FOUND" };
  }

  if (properties.length > 1) {
    counters.EXCEPTIONS++;
    return { outcome: "EXCEPTION", reason: "PROPERTY_AMBIGUOUS" };
  }

  if (units.length === 0) {
    counters.EXCEPTIONS++;
    return { outcome: "EXCEPTION", reason: "UNIT_NOT_FOUND" };
  }

  if (units.length > 1) {
    counters.EXCEPTIONS++;
    return { outcome: "EXCEPTION", reason: "UNIT_AMBIGUOUS" };
  }

  if (existingBookings.length > 1) {
    counters.EXCEPTIONS++;
    counters.DUPLICATES++;
    return { outcome: "EXCEPTION", reason: "DUPLICATE_BOOKING_ID" };
  }

  if (existingBookings.length === 0) {
    counters.WOULD_CREATE++;
    return { outcome: "WOULD_CREATE" };
  }

  counters.WOULD_UPDATE++;
  return { outcome: "WOULD_UPDATE" };
}

function reconcile() {
  const accounted =
    counters.WOULD_CREATE +
    counters.WOULD_UPDATE +
    counters.EXCEPTIONS;

  return {
    ...counters,
    ACCOUNTED: accounted,
    RECONCILED: counters.READ === accounted,
    DUPLICATES_VALID: counters.DUPLICATES <= counters.EXCEPTIONS,
  };
}

module.exports = { classify, reconcile };
if (require.main === module) {
/* Synthetic safety contract: zero external calls. */
const cases = [
  {
    name: "create",
    booking: { id: "TEST-1" },
    properties: [{}],
    units: [{}],
    existingBookings: [],
  },
  {
    name: "update",
    booking: { id: "TEST-2" },
    properties: [{}],
    units: [{}],
    existingBookings: [{}],
  },
  {
    name: "property-not-found",
    booking: { id: "TEST-3" },
    properties: [],
    units: [],
    existingBookings: [],
  },
  {
    name: "property-ambiguous",
    booking: { id: "TEST-4" },
    properties: [{}, {}],
    units: [],
    existingBookings: [],
  },
  {
    name: "unit-not-found",
    booking: { id: "TEST-5" },
    properties: [{}],
    units: [],
    existingBookings: [],
  },
  {
    name: "unit-ambiguous",
    booking: { id: "TEST-6" },
    properties: [{}],
    units: [{}, {}],
    existingBookings: [],
  },
  {
    name: "duplicate-booking-id",
    booking: { id: "TEST-7" },
    properties: [{}],
    units: [{}],
    existingBookings: [{}, {}],
  },
];

const manifest = cases.map((testCase) => ({
  case: testCase.name,
  ...classify(testCase),
}));

const summary = reconcile();

console.table(manifest);
console.table(summary);

if (!summary.RECONCILED || !summary.DUPLICATES_VALID) {
  console.error("P0 DRY-RUN CONTRACT FAILED");
  process.exitCode = 1;
} else {
  console.log("P0 DRY-RUN CONTRACT PASS — ZERO EXTERNAL WRITES");
}

}
