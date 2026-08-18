# Permit Harbor

**Work in progress · built in public.**

US construction-permit desk catalog. Find the Authority Having Jurisdiction (city, county, or territorial office) before you file.

Guidance only — not a city login, not legal advice, and not a finished verification of every portal. Confirm the adopted code, fees, and **current** application URL with the department.

---

## Accuracy status (read this first)

| Claim | Status |
| --- | --- |
| Unique desk IDs (`{st}-{slug}`) | **Verified** — integrity tests pass |
| No name + state + kind duplicates | **Verified** |
| 56 packs (50 states + DC + 5 territories) | **Verified** |
| Catalog shape / layer counts | **Verified** against generators + tests |
| Core metro portal URLs (hand-authored) | **Higher confidence** — checked when authored |
| Factory / Rest layer portal URLs | **Provisional** — pattern-built from Census names; many are not live department portals yet |
| “This office always issues the building permit” | **Not guaranteed** — small places often share the county official |

**Bottom line:** the map of *names and jurisdictions* is the durable work. The *click-through URL* for most non-core desks is a starting hint, not a certified login path. Treat factory links as research seeds until verified.

This repo is intentionally public while the catalog is still being hardened.

---

## Coverage (current snapshot)

**16,165 named desks** across **56 packs** (50 states + DC + AS, GU, MP, PR, VI).

| Layer | Desks | What it is |
| --- | ---: | --- |
| Core | 79 | Major metros with hand-authored department / portal notes |
| Extra | 462 | Large remaining cities and metro counties |
| More | 699 | Additional cities, counties, territories |
| Rest | 14,925 | Census-derived remaining county-equivalents + municipal names |

| Kind | Count |
| --- | ---: |
| City / town / municipio | 13,080 |
| County / parish / borough | 3,075 |
| District (DC, OGPe, island desks) | 10 |

Notes on scope:

- County-equivalent coverage is broad, except Connecticut, Massachusetts, and Rhode Island counties (those states typically issue through the municipality).
- Puerto Rico aims at all 78 municipios plus OGPe.
- New Jersey aims at the full municipal map.
- New England towns and New York towns are included as municipal-style desks.
- Rest-layer entries are generated from Census place / county-subdivision names; they are **not** a claim that every named place runs its own independent building department.

Every id is unique. Integrity tests enforce id uniqueness, state prefix, pack membership, and `https://` URL shape.

---

## What is *not* on this repo (yet)

- A full production web app / deploy config
- Live verification of every factory URL
- Franchise / ROW / telecom-specific permit paths (separate from building AHJ in many jurisdictions)
- Fee schedules, form PDFs, or account logins

Those may land in later public commits. Until then, this is a **catalog pack + tests + generators**.

---

## Confirm before you apply

Always ask the local office:

> Which office issues the building (or ROW / utility) permit for this parcel — city or county? What is the current portal?

Factory desks often use a municipal or county landing-page pattern when the exact building-portal URL is not hand-verified. Tiny municipalities sometimes share the county building official.

---

## Catalog files

- [`src/lib/permit/states.ts`](src/lib/permit/states.ts) — 56 state / territory packs
- [`src/lib/permit/places.ts`](src/lib/permit/places.ts) — core desks + catalog index
- [`src/lib/permit/places-extra.ts`](src/lib/permit/places-extra.ts) — extra layer + `p()` factory
- [`src/lib/permit/places-more.ts`](src/lib/permit/places-more.ts) — more layer
- [`src/lib/permit/places-rest.ts`](src/lib/permit/places-rest.ts) — remaining county + municipal names
- [`scripts/catalog-integrity.test.mjs`](scripts/catalog-integrity.test.mjs) — uniqueness and https-shape checks
- [`scripts/generate-rest-places.mjs`](scripts/generate-rest-places.mjs) — Census-driven generator for the Rest layer

---

## Contributing / public build

Issues and corrections welcome. Highest-value fixes:

1. Replace a provisional URL with the real building / development services portal
2. Mark desks that are county-administered only
3. Correct city vs county jurisdiction notes for a specific place

```bash
node --test scripts/catalog-integrity.test.mjs
```

---

*AdventureNLearn · Permit Harbor · built in public*
