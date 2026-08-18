#!/usr/bin/env node
/**
 * Generate src/lib/permit/places-rest.ts from Census gazetteers.
 * Adds remaining county-equivalents + municipal AHJs. Refuses collisions.
 */
import { readFileSync, writeFileSync } from "node:fs";

const EXISTING_FILES = [
  "src/lib/permit/places.ts",
  "src/lib/permit/places-extra.ts",
  "src/lib/permit/places-more.ts",
];

const COUNTY_FILE = "/tmp/ahj-src/2024_Gaz_counties_national.txt";
const PLACE_FILE = "/tmp/ahj-src/2024_Gaz_place_national.txt";
const COUSUB_FILE = "/tmp/ahj-src/2024_Gaz_cousubs_national.txt";

const STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM",
  "NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
  "WV","WI","WY","PR","GU","VI","AS","MP",
]);

/** Counties here are not the building-permit AHJ — municipalities are. */
const SKIP_COUNTY_STATES = new Set(["CT", "MA", "RI", "DC"]);

const MCD_TOWN_STATES = new Set(["CT", "MA", "RI", "NH", "ME", "VT", "NY"]);
const MCD_MUNI_STATES = new Set(["NJ"]);

const SKIP_MCD = [
  /county subdivisions not defined/i,
  /\bunorganized\b/i,
  /\breservation\b/i,
  /\bgore\b/i,
  /\bgrant\b/i,
  /\bpurchase\b/i,
  /\blocation\b/i,
  /\bplantation\b/i,
  /\bUT\b/,
];

function slug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’.]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function domainSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’.]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function normKey(state, name, kind) {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’.]/g, "")
    .replace(/\b(county|parish|borough|census area|municipality|city and borough|city|town|township|charter township|village|zona urbana)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
  return `${state}|${kind}|${n}`;
}

function stripSuffix(name, suffixes) {
  let out = name.trim();
  for (const suf of suffixes) {
    const re = new RegExp(`\\s+${suf}$`, "i");
    if (re.test(out)) return out.replace(re, "").trim();
  }
  return out;
}

function parseExisting() {
  const ids = new Set();
  const names = new Set();
  const exact = new Set();
  for (const file of EXISTING_FILES) {
    const src = readFileSync(`/workspace/${file}`, "utf8");
    const found = [];
    for (const m of src.matchAll(/id:\s*"([a-z0-9-]+)",\s*name:\s*"([^"]+)",\s*kind:\s*"(city|county|district)",\s*state:\s*"([A-Z]{2})"/g)) {
      found.push({ id: m[1], name: m[2], kind: m[3], state: m[4] });
    }
    for (const m of src.matchAll(/p\(\s*"([a-z0-9-]+)",\s*"([^"]+)",\s*"(city|county|district)",\s*"([A-Z]{2})"/g)) {
      found.push({ id: m[1], name: m[2], kind: m[3], state: m[4] });
    }
    for (const place of found) {
      ids.add(place.id);
      names.add(normKey(place.state, place.name, place.kind));
      exact.add(`${place.state}|${place.name.toLowerCase()}`);
    }
  }
  return { ids, names, exact };
}

function splitGazetteer(line) {
  // Files are tab-separated after USPS+GEOID run together in some rows;
  // actual download is tab-delimited: USPS, GEOID, ANSICODE, NAME, ...
  return line.replace(/\r$/, "").split("\t");
}

function readGazetteer(path) {
  const raw = readFileSync(path, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = splitGazetteer(lines[i]);
    if (parts.length < 4) continue;
    const state = parts[0].trim();
    const name = parts[3].trim();
    if (!STATE_CODES.has(state) || !name) continue;
    rows.push({ state, name, lsad: parts[4]?.trim() ?? "", func: parts[5]?.trim() ?? "" });
  }
  return rows;
}

function countyKindAndDisplay(state, rawName) {
  const name = rawName.replace(/\s+/g, " ").trim();
  if (state === "PR") {
    return { kind: "city", display: stripSuffix(name, ["Municipio", "municipio"]), suffixNote: "municipio" };
  }
  if (state === "VA" && / city$/i.test(name)) {
    return { kind: "city", display: stripSuffix(name, ["city"]), suffixNote: "independent-city" };
  }
  if (/ city$/i.test(name) && ["MD", "MO", "NV"].includes(state)) {
    return { kind: "city", display: stripSuffix(name, ["city"]), suffixNote: "independent-city" };
  }
  if (/ Parish$/i.test(name)) return { kind: "county", display: name, suffixNote: "parish" };
  if (/ Borough$/i.test(name) || / Census Area$/i.test(name) || / Municipality$/i.test(name) || / city and borough$/i.test(name)) {
    return { kind: "county", display: name, suffixNote: "borough" };
  }
  if (/ County$/i.test(name)) return { kind: "county", display: name, suffixNote: "county" };
  return { kind: "county", display: name, suffixNote: "county" };
}

function countyId(state, display, suffixNote) {
  const base = slug(display.replace(/\s+(County|Parish|Borough|Census Area|Municipality)$/i, ""));
  const st = state.toLowerCase();
  if (suffixNote === "parish") return `${st}-${base}-parish`;
  if (suffixNote === "municipio" || suffixNote === "independent-city") return `${st}-${base}`;
  if (suffixNote === "borough") {
    if (/census area/i.test(display)) return `${st}-${base}-ca`;
    return `${st}-${base}`;
  }
  return `${st}-${base}-county`;
}

function countyUrl(state, display, suffixNote) {
  const d = domainSlug(display.replace(/\s+(County|Parish|Borough|Census Area|Municipality)$/i, ""));
  const st = state.toLowerCase();
  if (state === "PR") return `https://www.${d}.pr.gov/`;
  if (suffixNote === "parish") return `https://www.${d}parish.com/`;
  if (suffixNote === "independent-city") return `https://www.${d}${st}.gov/`;
  if (state === "AK") return `https://www.${d}ak.us/`;
  return `https://www.${d}county${st}.gov/`;
}

function countyAhj(display, suffixNote) {
  if (suffixNote === "parish") return `${display} Permits / Development`;
  if (suffixNote === "municipio") return `Municipio de ${display} — Permisos`;
  if (suffixNote === "independent-city") return `${display} Building / Permits`;
  if (suffixNote === "borough") return `${display} Planning / Permits`;
  return `${display} Building / Development`;
}

function cityUrl(state, display) {
  const d = domainSlug(display);
  const st = state.toLowerCase();
  if (state === "PR") return `https://www.${d}.pr.gov/`;
  if (state === "GU") return "https://dpw.guam.gov/";
  return `https://www.${d}${st}.gov/`;
}

function uniqueId(ids, preferred) {
  if (!ids.has(preferred)) return preferred;
  for (const extra of ["-city", "-town", "-twp", "-boro", "-desk", "-muni"]) {
    const next = `${preferred}${extra}`;
    if (!ids.has(next)) return next;
  }
  let i = 2;
  while (ids.has(`${preferred}-${i}`)) i += 1;
  return `${preferred}-${i}`;
}

function jsString(value) {
  return JSON.stringify(value ?? "");
}

function emitRow(row) {
  const args = [
    jsString(row.id),
    jsString(row.name),
    jsString(row.kind),
    jsString(row.state),
    jsString(row.ahj),
    jsString(row.portal),
    jsString(row.url),
  ];
  if (row.county || row.note) args.push(row.county ? jsString(row.county) : "undefined");
  if (row.note) args.push(jsString(row.note));
  return `  p(${args.join(", ")}),`;
}

const existing = parseExisting();
const rows = [];
const skipped = { id: 0, name: 0, filter: 0 };

function add(row) {
  if (!STATE_CODES.has(row.state)) {
    skipped.filter += 1;
    return;
  }
  const exact = `${row.state}|${row.name.toLowerCase()}`;
  if (existing.exact.has(exact)) {
    skipped.name += 1;
    return;
  }
  const key = normKey(row.state, row.name, row.kind);
  if (existing.names.has(key)) {
    skipped.name += 1;
    return;
  }
  const id = uniqueId(existing.ids, row.id);
  row.id = id;
  existing.ids.add(id);
  existing.names.add(key);
  existing.exact.add(exact);
  rows.push(row);
}

// --- Counties / county-equivalents ---
for (const rec of readGazetteer(COUNTY_FILE)) {
  if (SKIP_COUNTY_STATES.has(rec.state)) {
    skipped.filter += 1;
    continue;
  }
  const meta = countyKindAndDisplay(rec.state, rec.name);
  const id = countyId(rec.state, meta.display, meta.suffixNote);
  const note =
    meta.suffixNote === "municipio"
      ? "OGPe is the territorial permit desk; the municipio may still hold related local reviews."
      : meta.suffixNote === "independent-city"
        ? "Independent city — confirm this desk, not the surrounding county."
        : `Unincorporated ${meta.display}. Municipalities inside may be a different AHJ.`;
  add({
    id,
    name: meta.display,
    kind: meta.kind,
    state: rec.state,
    ahj: countyAhj(meta.display, meta.suffixNote),
    portal: meta.suffixNote === "municipio" ? "Municipal permits" : meta.kind === "city" ? "City permitting" : "County permitting",
    url: countyUrl(rec.state, meta.display, meta.suffixNote),
    county: undefined,
    note,
  });
}

// --- Incorporated cities (not CDPs) ---
for (const rec of readGazetteer(PLACE_FILE)) {
  const lsad = rec.lsad;
  const raw = rec.name;
  if (/ CDP$/i.test(raw) || lsad === "57" || / comunidad$/i.test(raw) || / zona urbana$/i.test(raw)) {
    skipped.filter += 1;
    continue;
  }
  // Cities always. Boroughs only in NJ (municipal AHJ). Villages skipped except NJ.
  const isCity = / city$/i.test(raw) || lsad === "25" || / municipality$/i.test(raw) || / unified government/i.test(raw) || / consolidated government/i.test(raw);
  const isNjBoro = rec.state === "NJ" && (/ borough$/i.test(raw) || lsad === "21");
  const isNjVillage = rec.state === "NJ" && / village$/i.test(raw);
  if (!isCity && !isNjBoro && !isNjVillage) {
    skipped.filter += 1;
    continue;
  }
  const display = stripSuffix(raw, [
    "unified government \\(balance\\)",
    "consolidated government \\(balance\\)",
    "metro government \\(balance\\)",
    "city \\(balance\\)",
    "unified government",
    "consolidated government",
    "metropolitan government",
    "urban county",
    "municipality",
    "borough",
    "village",
    "city",
  ]);
  if (!display || /not defined/i.test(display)) {
    skipped.filter += 1;
    continue;
  }
  add({
    id: `${rec.state.toLowerCase()}-${slug(display)}`,
    name: display,
    kind: "city",
    state: rec.state,
    ahj: `${display} Building Department`,
    portal: "City permitting",
    url: cityUrl(rec.state, display),
    county: undefined,
    note: "Confirm city vs county jurisdiction at the parcel before you apply.",
  });
}

// --- New England towns + NJ townships/boroughs + NY towns ---
for (const rec of readGazetteer(COUSUB_FILE)) {
  const raw = rec.name;
  if (SKIP_MCD.some((re) => re.test(raw))) {
    skipped.filter += 1;
    continue;
  }
  const st = rec.state;
  let keep = false;
  let display = raw;
  if (MCD_TOWN_STATES.has(st) && / town$/i.test(raw)) {
    keep = true;
    display = stripSuffix(raw, ["town"]);
  } else if (MCD_MUNI_STATES.has(st)) {
    if (/ township$/i.test(raw)) {
      keep = true;
      display = stripSuffix(raw, ["township"]);
    } else if (/ borough$/i.test(raw)) {
      keep = true;
      display = stripSuffix(raw, ["borough"]);
    } else if (/ town$/i.test(raw)) {
      keep = true;
      display = stripSuffix(raw, ["town"]);
    } else if (/ village$/i.test(raw)) {
      keep = true;
      display = stripSuffix(raw, ["village"]);
    } else if (/ city$/i.test(raw)) {
      keep = true;
      display = stripSuffix(raw, ["city"]);
    } else if (!/not defined/i.test(raw)) {
      keep = true;
      display = raw;
    }
  }
  if (!keep || !display) {
    skipped.filter += 1;
    continue;
  }
  add({
    id: `${st.toLowerCase()}-${slug(display)}`,
    name: display,
    kind: "city",
    state: st,
    ahj: `${display} Construction / Building`,
    portal: "Municipal permitting",
    url: cityUrl(st, display),
    county: undefined,
    note: "Municipal construction official. Confirm this desk — not a neighboring town — at the parcel.",
  });
}

rows.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const header = `import type { PlaceDesk } from "./types";
import { p } from "./places-extra";

/**
 * Remaining US county-equivalents and municipal AHJs.
 * Generated from Census gazetteers. No overlap with CORE, EXTRA, or MORE ids.
 * Official-looking department landing pages — confirm the current portal before you apply.
 */
export const REST_PLACES: PlaceDesk[] = [
`;

const body = rows.map(emitRow).join("\n");
const out = `${header}${body}\n];\n`;
writeFileSync("/workspace/src/lib/permit/places-rest.ts", out);

const byState = {};
const byKind = { city: 0, county: 0, district: 0 };
for (const row of rows) {
  byState[row.state] = (byState[row.state] ?? 0) + 1;
  byKind[row.kind] += 1;
}
console.log(
  JSON.stringify(
    {
      added: rows.length,
      skipped,
      byKind,
      fileBytes: out.length,
      top: Object.entries(byState)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12),
    },
    null,
    2,
  ),
);
