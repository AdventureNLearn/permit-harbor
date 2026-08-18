# Permit Harbor

US construction-permit desk. Find the Authority Having Jurisdiction (city, county, or territorial office) before you file.

Guidance only — not a city login, not legal advice. Confirm the adopted code, fees, and current portal with the department.

## Coverage

**16,165 named desks** across **56 packs** (50 states + DC + AS, GU, MP, PR, VI).

| Layer | Desks | What it is |
| --- | ---: | --- |
| Core | 79 | Major metros with hand-checked department / portal notes |
| Extra | 462 | Large remaining cities and metro counties |
| More | 699 | Remaining 50k+ cities, extra counties, territories |
| Rest | 14,925 | Remaining county-equivalents + municipal AHJs |

| Kind | Count |
| --- | ---: |
| City / town / municipio | 13,080 |
| County / parish / borough | 3,075 |
| District (DC, OGPe, island desks) | 10 |

Complete county-equivalent coverage except Connecticut, Massachusetts, and Rhode Island counties (those states issue through the municipality, not the county). Puerto Rico includes all 78 municipios plus OGPe. New Jersey is the full municipal map. New England towns and New York towns are included.

Every id is unique (`{st}-{slug}`). No name + state + kind duplicates.

## Try it

In the live preview:

- Search **Dededo**, **Vieques**, **El Paso County**, or **Princeton**
- Browse → **Territories** → Puerto Rico
- Open **Texas** and filter Cities / Counties
- Open **California** (520 desks)

## Confirm before you apply

Factory desks use the official municipal or county landing page when the exact building-portal URL is not hand-verified. Tiny municipalities sometimes share the county building official. Always ask: *which office issues the building permit for this parcel?*

## Catalog files

- [`src/lib/permit/states.ts`](src/lib/permit/states.ts) — 56 state / territory packs
- [`src/lib/permit/places.ts`](src/lib/permit/places.ts) — core desks + catalog index
- [`src/lib/permit/places-extra.ts`](src/lib/permit/places-extra.ts) — extra layer + `p()` factory
- [`src/lib/permit/places-more.ts`](src/lib/permit/places-more.ts) — more layer
- [`src/lib/permit/places-rest.ts`](src/lib/permit/places-rest.ts) — remaining county + municipal AHJs
- [`scripts/catalog-integrity.test.mjs`](scripts/catalog-integrity.test.mjs) — uniqueness and https checks
