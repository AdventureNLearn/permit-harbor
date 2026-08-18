import type { OfficialLink, ProcessStep } from "./types";

export const NATIONAL_LINKS: OfficialLink[] = [
  {
    id: "icc",
    label: "ICC public codes",
    url: "https://codes.iccsafe.org/",
    note: "Read-only model codes. Confirm the edition your AHJ adopted.",
  },
  {
    id: "fema-flood",
    label: "FEMA Flood Map Service Center",
    url: "https://msc.fema.gov/portal/home",
    note: "Check whether the parcel sits in a mapped flood zone before you design.",
  },
  {
    id: "call-811",
    label: "Call 811 before you dig",
    url: "https://call811.com/",
    note: "Utility locate. Separate from the building permit — still required.",
  },
  {
    id: "osha",
    label: "OSHA construction standards",
    url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1926",
    note: "Federal jobsite safety — a different lane from the building official.",
  },
  {
    id: "ada",
    label: "ADA Standards",
    url: "https://www.access-board.gov/ada/",
    note: "Federal accessibility. Many AHJs also enforce a local accessibility path.",
  },
  {
    id: "epa-cgp",
    label: "EPA construction stormwater",
    url: "https://www.epa.gov/npdes/stormwater-discharges-construction-activities",
    note: "Federal CGP overview. Check your state construction general permit.",
  },
  {
    id: "energy-codes",
    label: "DOE Building Energy Codes",
    url: "https://www.energycodes.gov/",
    note: "Status of state energy-code adoption. Confirm the local path.",
  },
  {
    id: "nfpa",
    label: "NFPA free access",
    url: "https://www.nfpa.org/for-professionals/codes-and-standards/list-of-codes-and-standards",
    note: "Index of fire standards. Free-access terms set by NFPA.",
  },
];

export const FIND_AHJ_STEPS: ProcessStep[] = [
  {
    id: "use-the-address",
    phase: "prepare",
    title: "Use the job address, not the mailing city",
    detail:
      "A Miami mailing address can sit in Coral Gables, Miami Beach, or unincorporated Miami-Dade. The folio / parcel / city-limits line decides the desk — not the post office.",
    owner: "Owner or GC",
  },
  {
    id: "city-or-county",
    phase: "prepare",
    title: "Decide city limits vs. unincorporated county",
    detail:
      "Inside a city, the municipal building department usually issues. Outside, it is often the county. Consolidated governments (Jacksonville, Nashville, Indianapolis, Denver, New Orleans) collapse that split — still confirm.",
    owner: "Owner or GC",
  },
  {
    id: "extra-desks",
    phase: "prepare",
    title: "Name the extra desks",
    detail:
      "Floodplain, historic, zoning, fire, health, and right-of-way are frequently separate counters. A building permit does not automatically clear them.",
    owner: "Designer",
  },
  {
    id: "confirm-voice",
    phase: "prepare",
    title: "Confirm in writing if two portals look plausible",
    detail:
      "Call or email both departments with the address and folio. Ask: “Which office issues the building permit for this parcel?” Keep the answer in the job file.",
    owner: "Applicant",
  },
];

export const PHASES: Array<{
  id: ProcessStep["phase"];
  title: string;
  summary: string;
}> = [
  {
    id: "prepare",
    title: "Prepare",
    summary: "Confirm the AHJ, whether the work is permitted, and who can pull the ticket. Clear zoning, flood, and utilities before you pay for a full set.",
  },
  {
    id: "apply",
    title: "Apply",
    summary: "Assemble a complete submittal and file it in the official portal. Pay intake. Keep the record number. A complete application is not a permit.",
  },
  {
    id: "review",
    title: "Review",
    summary: "Answer every comment, cloud the sheets, and resubmit the set the AHJ asked for. Issuance comes after fees and a stamped job copy.",
  },
  {
    id: "build",
    title: "Build",
    summary: "Build only what the last ticket allows. Call inspections before you conceal work. The approved set on site is the only legal job copy.",
  },
  {
    id: "closeout",
    title: "Close out",
    summary: "Trade finals, then building final. Ask the department to close the file. Keep the CO / CC, as-builts, and product papers with the property.",
  },
];

export const FIELD_TRUTHS = [
  "The Authority Having Jurisdiction is a desk, not a vibe. Name it.",
  "Starting before issuance is the fastest path to a stop-work order.",
  "A passed inspection is a ticket, not a conversation.",
  "The stamped set on site is the only legal job copy.",
  "A permit is not closed until the department finals it.",
  "Guidance here is not the adopted code. Confirm the edition on the permit.",
];

export function suggestedAhjSearch(city: string, stateCode: string): string {
  const place = city.trim();
  const st = stateCode.trim().toUpperCase();
  if (!place) return `${st} building department permit portal`;
  return `${place} ${st} building department permit portal`;
}
