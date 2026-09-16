"use strict";

const API_BASE = "https://api.beds24.com/v2";

function getAccessToken() {
  const token = process.env.BEDS24_ACCESS_TOKEN;

  if (!token || !token.trim()) {
    throw new Error(
      "BEDS24_ACCESS_TOKEN missing. No API request executed."
    );
  }

  return token.trim();
}

async function beds24Get(pathOrUrl) {
  const token = getAccessToken();

  const url = pathOrUrl.startsWith("https://")
    ? pathOrUrl
    : `${API_BASE}${pathOrUrl}`;

  if (!url.startsWith(`${API_BASE}/`)) {
    throw new Error(`Blocked non-Beds24 URL: ${url}`);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      token,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Beds24 GET failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

async function getAllBookings() {
  const bookings = [];

  const params = new URLSearchParams();
  params.set("arrivalFrom", "2026-04-01");

  for (const status of [
    "confirmed",
    "request",
    "new",
    "cancelled",
    "black",
    "inquiry",
  ]) {
    params.append("status", status);
  }

  let next = `/bookings?${params.toString()}`;
  let pagesRead = 0;

  while (next) {
    const payload = await beds24Get(next);
    pagesRead++;

    if (!Array.isArray(payload.data)) {
      throw new Error(
        `Invalid Beds24 response on page ${pagesRead}: data is not an array`
      );
    }

    bookings.push(...payload.data);

    const nextPageLink = payload?.pages?.nextPageLink;

    if (nextPageLink !== undefined &&
        nextPageLink !== null &&
        typeof nextPageLink !== "string") {
      throw new Error(
        `Invalid Beds24 pagination on page ${pagesRead}`
      );
    }

    next = nextPageLink || null;

    if (pagesRead > 10000) {
      throw new Error("Pagination safety limit exceeded");
    }
  }

  return {
    pagesRead,
    bookings,
  };
}

async function main() {
  console.log("P0 BEDS24 READ-ONLY");
  console.log("Mode: GET ONLY");
  console.log("Notion writes: DISABLED");

  const result = await getAllBookings();

  console.log(`Pages read: ${result.pagesRead}`);
  console.log(`Bookings read: ${result.bookings.length}`);

  /*
   * Deliberately do NOT dump booking payloads here:
   * they may contain personal/financial guest data.
   */

  console.log("P0 BEDS24 READ COMPLETE");
}

main().catch((error) => {
  console.error(`P0 BEDS24 READ FAILED: ${error.message}`);
  process.exitCode = 1;
});

