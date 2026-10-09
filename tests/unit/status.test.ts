import { describe, expect, it } from "vitest";
import { getPhaseStates } from "@/lib/domain/phases";
import {
  BUCKET_STYLES,
  getBucket,
  getStatusBadge,
  getStatusLabel,
  resolveDropboxBar,
  resolveStatusBar,
  STATUS_META,
  type Bucket,
} from "@/lib/domain/status";
import { CLAIM_STATUSES } from "@/lib/domain/types";
import { NOW, seed, seedCase } from "./helpers";

describe("STATUS_META", () => {
  it("has copy, a badge and a bucket for every status", () => {
    for (const status of CLAIM_STATUSES) {
      const meta = STATUS_META[status];
      expect(meta, status).toBeDefined();
      expect(meta.title.length, status).toBeGreaterThan(5);
      expect(meta.label.length, status).toBeGreaterThan(2);
      expect(BUCKET_STYLES[meta.bucket], status).toBeDefined();
    }
  });

  it("only attaches CTAs that point at a real sub-route", () => {
    const valid = new Set(["/questionnaire", "/review", "/documents", "/outcome"]);
    for (const status of CLAIM_STATUSES) {
      const cta = STATUS_META[status].cta;
      if (cta) expect(valid.has(cta.hrefSuffix), status).toBe(true);
    }
  });
});

describe("seeded scenarios land in the intended bucket", () => {
  const expected: Record<string, Bucket> = {
    // Small Claims
    "sc-letter-in-progress": "waiting_on_us",
    "sc-awaiting-signature": "waiting_on_client",
    "sc-ready-to-send": "waiting_on_client",
    "sc-waiting-window": "waiting_period",
    "sc-court-needs-changes": "waiting_on_client",
    "sc-court-in-review": "waiting_on_us",
    "sc-court-ready-to-close": "waiting_on_client",
    "sc-closed-settled": "done",
    // Activation Hero — every stage
    "ah-get-organized": "waiting_on_client",
    "ah-questionnaire-ready": "waiting_on_client",
    "ah-evidence-nudge": "waiting_on_us",
    "ah-letter-in-progress": "waiting_on_us",
    "ah-revision-requested": "waiting_on_us",
    "ah-awaiting-signature": "waiting_on_client",
    "ah-ready-to-send": "waiting_on_client",
    "ah-waiting-window": "waiting_period",
    "ah-window-urgent": "waiting_period",
    "ah-outcome-needed": "waiting_on_client",
    "ah-court-just-started": "waiting_on_client",
    "ah-court-needs-changes": "waiting_on_client",
    "ah-court-in-review": "waiting_on_us",
    "ah-court-ready-to-close": "waiting_on_client",
    "ah-closed-settled": "done",
    "ah-closed-court": "done",
  };

  it.each(Object.entries(expected))("%s → %s", (id, bucket) => {
    expect(getBucket(seedCase(id), NOW)).toBe(bucket);
  });

  it("has an expectation for every seeded case, and Activation Hero covers every stage", () => {
    expect(seed.cases.map((c) => c.id).sort()).toEqual(Object.keys(expected).sort());
    const ahStatuses = new Set(seed.cases.filter((c) => c.service === "activation_hero").map((c) => c.status));
    expect(ahStatuses).toEqual(new Set(CLAIM_STATUSES));
  });

  it("covers every status and every bucket at least once", () => {
    expect(new Set(seed.cases.map((c) => c.status))).toEqual(new Set(CLAIM_STATUSES));
    expect(new Set(seed.cases.map((c) => getBucket(c, NOW)))).toEqual(
      new Set<Bucket>(["waiting_on_client", "waiting_on_us", "waiting_period", "done"]),
    );
  });
});

describe("resolveStatusBar priorities", () => {
  it("turns an expired response window into a mark-outcome action", () => {
    const info = resolveStatusBar(seedCase("ah-outcome-needed"), NOW);
    expect(info.bucket).toBe("waiting_on_client");
    expect(info.cta?.hrefSuffix).toBe("/outcome");
    // The badge keeps the production wording; the status *bar* carries the action.
    expect(getStatusLabel(seedCase("ah-outcome-needed"), NOW)).toBe("Mailed");
    expect(getStatusBadge(seedCase("ah-outcome-needed"), NOW)).toBe("success");
  });

  it("keeps the passive waiting bar while the window is open", () => {
    const info = resolveStatusBar(seedCase("sc-waiting-window"), NOW);
    expect(info.bucket).toBe("waiting_period");
    expect(info.cta).toBeUndefined();
  });

  it("gates the Activation Hero questionnaire behind getting organized", () => {
    const c = seedCase("ah-get-organized");
    expect(resolveStatusBar(c, NOW).cta?.hrefSuffix).toBe("/documents");

    const organized = { ...c, hasEvidenceToUpload: false as const };
    expect(resolveStatusBar(organized, NOW).cta?.hrefSuffix).toBe("/questionnaire");
  });

  it("nudges evidence upload only once Dropbox is connected and no file is attached", () => {
    const base = { ...seedCase("sc-letter-in-progress"), hasEvidenceToUpload: true as const };
    expect(resolveStatusBar(base, NOW).title).toBe("Our team is preparing your demand letter");

    const connected = { ...base, dropbox: { connected: true, accountEmail: "a@b.c", connectedAt: NOW.toISOString() } };
    const info = resolveStatusBar(connected, NOW);
    expect(info.title).toMatch(/upload your evidence/i);
    expect(info.bucket).toBe("waiting_on_us");
  });

  it("refines court filing by the open task", () => {
    expect(resolveStatusBar(seedCase("sc-court-needs-changes"), NOW).title).toMatch(/needs changes/);
    expect(resolveStatusBar(seedCase("sc-court-in-review"), NOW).bucket).toBe("waiting_on_us");
  });
});

describe("resolveDropboxBar", () => {
  it("shows the secondary strip when Dropbox is not connected", () => {
    const c = seedCase("sc-letter-in-progress");
    expect(resolveDropboxBar(c, resolveStatusBar(c, NOW))?.cta?.hrefSuffix).toBe("/documents");
  });

  it("hides when connected, when closed, and when the main bar already says get organized", () => {
    const connected = seedCase("sc-awaiting-signature");
    expect(resolveDropboxBar(connected, resolveStatusBar(connected, NOW))).toBeNull();

    const closed = { ...seedCase("sc-closed-settled"), dropbox: { connected: false, accountEmail: null, connectedAt: null } };
    expect(resolveDropboxBar(closed, resolveStatusBar(closed, NOW))).toBeNull();

    const ah = seedCase("ah-get-organized");
    expect(resolveDropboxBar(ah, resolveStatusBar(ah, NOW))).toBeNull();
  });
});

describe("getPhaseStates", () => {
  it("locks later phases until earlier ones finish", () => {
    expect(getPhaseStates(seedCase("sc-awaiting-signature"))).toEqual({ letter: "active", response: "locked", court: "locked" });
    expect(getPhaseStates(seedCase("sc-waiting-window"))).toEqual({ letter: "complete", response: "active", court: "locked" });
    expect(getPhaseStates(seedCase("sc-court-in-review"))).toEqual({ letter: "complete", response: "complete", court: "active" });
    expect(getPhaseStates(seedCase("sc-court-ready-to-close"))).toEqual({ letter: "complete", response: "complete", court: "complete" });
  });

  it("marks court filing as skipped when a case settles", () => {
    expect(getPhaseStates(seedCase("sc-closed-settled")).court).toBe("skipped");
  });
});
