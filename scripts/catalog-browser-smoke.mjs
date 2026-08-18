import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const SHOTS = "/workspace/screenshots";
mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  ["/", "catalog-home.png", ["Find the desk that issues", "Municipalities"]],
  ["/states", "catalog-states.png", ["Florida", "Territories", "Puerto Rico"]],
  ["/state/CA", "catalog-california.png", ["California", "Los Angeles", "Escondido"]],
  ["/state/TX", "catalog-texas.png", ["Texas", "El Paso County", "Counties"]],
  ["/state/PR", "catalog-puerto-rico.png", ["Puerto Rico", "OGPe", "San Juan"]],
  ["/state/GU", "catalog-guam.png", ["Guam", "Hagåtña"]],
  ["/place/pr-san-juan", "catalog-san-juan.png", ["San Juan", "PR"]],
  ["/place/pr-vieques", "catalog-vieques.png", ["Vieques", "PR"]],
  ["/place/tx-el-paso-county", "catalog-el-paso-county.png", ["El Paso County", "TX"]],
  ["/place/tx-carrollton", "catalog-carrollton.png", ["Carrollton", "TX"]],
  ["/place/fl-naples", "catalog-naples.png", ["Naples", "Collier"]],
  ["/place/ny-amherst", "catalog-amherst.png", ["Amherst", "Erie"]],
  ["/find", "catalog-find.png", ["Search this catalog"]],
];

const errors = [];
const browser = await chromium.launch({ args: ["--no-sandbox"] });

async function check(page, path, shot, needles, viewport) {
  const consoleErrors = [];
  page.removeAllListeners("pageerror");
  page.removeAllListeners("console");
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  if (viewport) await page.setViewportSize(viewport);
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("#main").waitFor({ state: "visible", timeout: 15000 });
  const status = res?.status() ?? 0;
  const missing = [];
  for (const needle of needles) {
    const loc = page.getByText(needle, { exact: false }).first();
    try {
      await loc.waitFor({ state: "attached", timeout: 5000 });
      if (path === "/states" && needle === "Territories") {
        await loc.scrollIntoViewIfNeeded();
      }
    } catch {
      missing.push(needle);
    }
  }
  if (status >= 400 || missing.length || consoleErrors.length) {
    const snippet = (await page.locator("#main").innerText().catch(() => "")).slice(0, 400);
    errors.push({ path, status, missing, consoleErrors, snippet });
  }
  if (shot) await page.screenshot({ path: `${SHOTS}/${shot}`, fullPage: true });
}

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
for (const [path, shot, needles] of ROUTES) {
  await check(page, path, shot, needles);
}

await check(page, "/states", "catalog-states-mobile.png", ["Territories", "Guam"], { width: 390, height: 844 });

await page.setViewportSize({ width: 1280, height: 800 });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
const search = page.getByLabel("Search municipalities, states, and playbooks");
await search.waitFor({ state: "visible", timeout: 8000 });
await search.click();
await search.fill("");
await search.pressSequentially("Dededo", { delay: 40 });
await page.waitForTimeout(800);
const after = await page.locator("#main").innerText();
if (!after.includes("Dededo")) {
  errors.push({ path: "/?q=Dededo", status: 200, missing: ["Dededo"], consoleErrors: [], snippet: after.slice(0, 500) });
}
await page.screenshot({ path: `${SHOTS}/catalog-search-dededo.png`, fullPage: true });

await browser.close();

if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
console.log(`catalog browser smoke ok — ${ROUTES.length} routes + mobile + search`);
