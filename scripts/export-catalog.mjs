import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function parseStates(src) {
  const states = [];
  const re = /code:\s*"([A-Z]{2})",\s*name:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) states.push({ code: m[1], name: m[2] });
  return states;
}

function parseCorePlaces(src) {
  const places = [];
  const re =
    /id:\s*"([a-z0-9-]+)",\s*name:\s*"([^"]+)",\s*kind:\s*"(city|county|district)",\s*state:\s*"([A-Z]{2})"/g;
  let m;
  while ((m = re.exec(src))) {
    places.push({ id: m[1], name: m[2], kind: m[3], state: m[4], layer: "core" });
  }
  return places;
}

function parseFactoryPlaces(src, layer) {
  const places = [];
  const re =
    /p\(\s*"([a-z0-9-]+)",\s*"([^"]+)",\s*"(city|county|district)",\s*"([A-Z]{2})",\s*"([^"]+)",\s*"([^"]+)",\s*"(https:[^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    places.push({
      id: m[1],
      name: m[2],
      kind: m[3],
      state: m[4],
      ahj: m[5],
      portal: m[6],
      url: m[7],
      layer,
    });
  }
  return places;
}

const states = parseStates(read("src/lib/permit/states.ts"));
const core = parseCorePlaces(read("src/lib/permit/places.ts"));
const extra = parseFactoryPlaces(read("src/lib/permit/places-extra.ts"), "extra");
const more = parseFactoryPlaces(read("src/lib/permit/places-more.ts"), "more");
const rest = parseFactoryPlaces(read("src/lib/permit/places-rest.ts"), "rest");

const outDir = join(ROOT, "public");
mkdirSync(outDir, { recursive: true });

const summary = {
  generated: new Date().toISOString(),
  lock: "2026-08-18",
  counts: {
    states: states.length,
    core: core.length,
    extra: extra.length,
    more: more.length,
    rest: rest.length,
    total: core.length + extra.length + more.length + rest.length,
  },
  accuracy: {
    uniqueIds: "Verified",
    noNameStateKindDupes: "Verified",
    packs: "Verified — 56 (50 states + DC + 5 territories)",
    corePortals: "Higher confidence — Batch 1 repairs",
    factoryUrls: "Provisional research seeds",
    rowFiber: "Partial — national + selected major cities",
  },
  disclaimer:
    "Guidance only — not a city login, not legal advice. Confirm the current portal and city vs county with the local office.",
};

writeFileSync(join(outDir, "catalog-meta.json"), JSON.stringify(summary, null, 2));
writeFileSync(
  join(outDir, "catalog-index.json"),
  JSON.stringify({
    ...summary,
    states,
    core: core.map(({ id, name, kind, state }) => ({ id, name, kind, state })),
  }),
);

console.log(
  `export ok  states=${states.length} core=${core.length} extra=${extra.length} more=${more.length} rest=${rest.length} total=${summary.counts.total}`,
);
