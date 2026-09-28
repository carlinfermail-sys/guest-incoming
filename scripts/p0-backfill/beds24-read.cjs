"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const BASE = "https://api.beds24.com/v2/";
const FROM = "2026-04-01";
const STATUSES = ["confirmed", "request", "new", "cancelled", "black", "inquiry"];
// Contract: https://api.beds24.com/v2/apiV2.yaml
// Default bookings omit cancellations and past arrivals. Query each documented
// status separately; March 31 safely covers either inclusive/exclusive bounds.
function safeUrl(value, current = BASE) {
  const url = new URL(value, current);
  if (url.origin !== "https://api.beds24.com" ||
      !["/v2/bookings", "/v2/authentication/details"].includes(url.pathname) ||
      url.username || url.password || url.hash) throw new Error("Unsafe API URL");
  return url.href;
}
async function get(url, token, request = fetch) {
  const response = await request(safeUrl(url), {
    method: "GET", redirect: "error",
    headers: { token, Accept: "application/json" },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error("Beds24 HTTP " + response.status);
  const body = await response.json();
  if (body.success === false) throw new Error("Beds24 reported failure");
  return body;
}
async function collect(token, request = fetch) {
  const records = new Map();
  let pagesRead = 0;
  for (const status of STATUSES) {
    let next = BASE + "bookings?" + new URLSearchParams({arrivalFrom:"2026-03-31",status});
    const seen = new Set();
    while (next) {
      next = safeUrl(next);
      if (seen.has(next) || pagesRead >= 10000) throw new Error("Pagination loop or limit");
      seen.add(next);
      const body = await get(next, token, request);
      pagesRead++;
      if (!Array.isArray(body.data) || typeof body.pages?.nextPageExists !== "boolean")
        throw new Error("Invalid booking page contract");
      for (const booking of body.data) {
        if (!booking.id || !/^\d{4}-\d{2}-\d{2}$/.test(booking.arrival) ||
            !STATUSES.includes(booking.status)) throw new Error("Invalid booking fields");
        if (booking.status !== status) throw new Error("API status filter mismatch");
        const id = String(booking.id);
        if (records.has(id)) throw new Error("Duplicate booking across pages");
        records.set(id, booking);
      }
      const link = body.pages.nextPageLink;
      if (body.pages.nextPageExists) {
        if (typeof link !== "string" || !link) throw new Error("Missing next page link");
        const resolved = safeUrl(link, next);
        if (new URL(resolved).pathname !== "/v2/bookings") throw new Error("Invalid pagination endpoint");
        next = resolved;
      } else {
        if (link) throw new Error("Inconsistent terminal page");
        next = null;
      }
    }
  }
  return {pagesRead, bookings: [...records.values()].filter(b => b.arrival >= FROM)
    .sort((a,b) => a.arrival.localeCompare(b.arrival) || String(a.id).localeCompare(String(b.id)))};
}
function saveSnapshot(snapshot, content) {
  fs.mkdirSync(path.dirname(snapshot), {recursive:true});
  const staged = snapshot + ".tmp";
  fs.writeFileSync(staged, content, {mode:0o600});
  if (fs.existsSync(snapshot) && fs.readFileSync(snapshot, "utf8") === content) {
    fs.unlinkSync(staged);
    return;
  }
  if (!fs.existsSync(snapshot)) {
    fs.renameSync(staged, snapshot);
    return;
  }
  const backup = snapshot + ".backup-" + process.pid + "-" + Date.now();
  fs.renameSync(snapshot, backup);
  try {
    fs.renameSync(staged, snapshot);
  } catch (error) {
    fs.renameSync(backup, snapshot);
    throw error;
  }
  fs.unlinkSync(backup);
}
function sanitize(value, secret) {
  if (Array.isArray(value)) return value.map(v => sanitize(v, secret));
  if (value && typeof value === "object") return Object.fromEntries(
    Object.keys(value).sort().filter(k => !/token|secret|password|credential|authorization/i.test(k))
      .map(k => [k, sanitize(value[k], secret)]));
  if (typeof value === "string" && secret && value.includes(secret)) return value.split(secret).join("[REDACTED]");
  return value;
}
async function main() {
  // Process-local trust: preserve certificate verification and include Windows
  // trusted roots (required by the installed AVG TLS inspection certificate).
  const tls = require("node:tls");
  tls.setDefaultCACertificates([...new Set([
    ...tls.getCACertificates("default"), ...tls.getCACertificates("system"),
  ])]);
  const tokenFile = path.join(os.homedir(), "Documents", "beds24-access-token.txt");
  const token = (process.env.BEDS24_ACCESS_TOKEN || fs.readFileSync(tokenFile, "utf8")).trim();
  if (!token) throw new Error("Missing Beds24 credential");
  const details = await get(BASE + "authentication/details", token);
  if (details.validToken !== true) throw new Error("Token validation failed");
  console.log("AUTH: PASS");
  const result = await collect(token);
  const bookings = sanitize(result.bookings, token);
  const snapshot = path.join(os.homedir(), "Documents", "Codex", "2026-09-16",
    "task-create-guest-incoming-powershell-desktop", "outputs", "beds24-p0-snapshot.json");
  const content = JSON.stringify({schemaVersion:1, arrivalFrom:FROM, bookings}, null, 2) + "\n";
  saveSnapshot(snapshot, content);
  if (fs.readFileSync(snapshot,"utf8") !== content) throw new Error("Snapshot verification failed");
  const report = ["EXTRACT: PASS", "AUTH: PASS", "PAGINATION: PASS",
    "PAGES: " + result.pagesRead, "BOOKINGS READ: " + bookings.length,
    "CANCELLED: " + bookings.filter(b => b.status === "cancelled").length,
    "EARLIEST: " + (bookings[0]?.arrival || "N/D"),
    "LATEST: " + (bookings.at(-1)?.arrival || "N/D"), "SNAPSHOT: " + snapshot,
    "BEDS24 WRITES: 0", "NOTION WRITES: 0"].join("\n");
  fs.writeFileSync(path.join(path.dirname(snapshot),"beds24-p0-report.txt"), report + "\n");
  console.log(report);
}
module.exports = {safeUrl, collect, sanitize, saveSnapshot};
if (require.main === module) main().catch(() => {
  console.error("EXTRACT: BLOCKED — authentication, network or data validation failed. No payload or credential logged.");
  process.exitCode = 1;
});
