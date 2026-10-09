// Seed data: ONE customer (Alex Rivera) with a case stopped at every interesting step.
// Everything is computed relative to `now`, so "14 days left" is true whenever the demo opens.

import { emptyIntakeForm, INTAKE_STEP_LABELS } from "../domain/intake";
import { PLATFORMS } from "../domain/directory";
import { createCourtTasks } from "../domain/tasks";
import { addDays, subtractDays } from "../domain/time";
import type {
  ActivityEntry,
  ActivityType,
  CaseRecord,
  ClaimStatus,
  CourtTask,
  DemoState,
  DraftApplication,
  EvidenceItem,
  Letter,
  Mailing,
  Outcome,
  Profile,
} from "../domain/types";

export const DEMO_PROFILE: Profile = {
  firstName: "Alex",
  lastName: "Rivera",
  email: "alex.rivera@example.com",
  phone: "5555550142",
  address: { line1: "418 Maple Avenue, Apt 3", city: "Sacramento", state: "CA", zip: "95814" },
};

const DEMO_DROPBOX = { connected: true, accountEmail: "alex.rivera@dropbox.example" } as const;

const iso = (d: Date) => d.toISOString();

/**
 * "My cases" shows only a few cases so the dashboard looks like a real customer's. Every other
 * stage is a scenario: reachable from the Demo panel's "Jump to a stage" list.
 */
export const DASHBOARD_CASE_IDS = new Set([
  "ah-get-organized",
  "ah-awaiting-signature",
  "ah-waiting-window",
  "ah-court-needs-changes",
  "ah-closed-settled",
]);

export interface DemoScenario {
  id: string;
  label: string;
}

/** Human names for each stage, in journey order — what the Demo panel lists. */
export const ACTIVATION_HERO_SCENARIOS: DemoScenario[] = [
  { id: "ah-get-organized", label: "Get organized" },
  { id: "ah-questionnaire-ready", label: "Answer the questionnaire" },
  { id: "ah-evidence-nudge", label: "Upload evidence reminder" },
  { id: "ah-letter-in-progress", label: "Letter being prepared" },
  { id: "ah-revision-requested", label: "Changes requested" },
  { id: "ah-awaiting-signature", label: "Review & sign the letter" },
  { id: "ah-ready-to-send", label: "Send the letter" },
  { id: "ah-waiting-window", label: "Waiting for a response (14 days left)" },
  { id: "ah-window-urgent", label: "Waiting for a response (2 days left)" },
  { id: "ah-outcome-needed", label: "Mark the outcome" },
  { id: "ah-court-just-started", label: "Court filing: first step" },
  { id: "ah-court-needs-changes", label: "Court filing: step needs changes" },
  { id: "ah-court-in-review", label: "Court filing: under review" },
  { id: "ah-court-ready-to-close", label: "Court filing: ready to close" },
  { id: "ah-closed-settled", label: "Closed: settled" },
  { id: "ah-closed-court", label: "Closed: after court" },
];

export const SMALL_CLAIMS_SCENARIOS: DemoScenario[] = [
  { id: "sc-letter-in-progress", label: "Letter being prepared" },
  { id: "sc-awaiting-signature", label: "Review & sign the letter" },
  { id: "sc-ready-to-send", label: "Send the letter" },
  { id: "sc-waiting-window", label: "Waiting for a response" },
  { id: "sc-court-needs-changes", label: "Court filing: step needs changes" },
  { id: "sc-court-in-review", label: "Court filing: under review" },
  { id: "sc-court-ready-to-close", label: "Court filing: ready to close" },
  { id: "sc-closed-settled", label: "Closed: settled" },
];

interface Builder {
  id: string;
  ref: string;
  service: CaseRecord["service"];
  status: ClaimStatus;
  /** Days since the case was created. */
  ageDays: number;
}

function activity(caseId: string, entries: [ActivityType, Date][]): ActivityEntry[] {
  return entries.map(([type, at], i) => ({ id: `${caseId}-a${i + 1}`, type, at: iso(at) }));
}

function letterFor(id: string, now: Date, ageDays: number, opts: { versions?: 1 | 2; signedDaysAgo?: number } = {}): Letter {
  const versions = Array.from({ length: opts.versions ?? 1 }, (_, i) => ({
    id: `${id}-v${i + 1}`,
    number: i + 1,
    source: i === 0 ? ("system_generated" as const) : ("agent_edit" as const),
    createdAt: iso(subtractDays(now, Math.max(ageDays - 1 - i, 0))),
  }));
  const signed = opts.signedDaysAgo !== undefined;
  return {
    versions,
    signedAt: signed ? iso(subtractDays(now, opts.signedDaysAgo ?? 0)) : null,
    signedName: signed ? "Alex Rivera" : null,
  };
}

const noLetter: Letter = { versions: [], signedAt: null, signedName: null };

function mailingFor(now: Date, sentDaysAgo: number, method: Mailing["method"], ref: string): Mailing {
  // One hour of margin: "14 days left" must stay 14 even if the clock is read a few ms earlier
  // than the moment the seed was built (daysRemaining rounds up).
  const sentAt = new Date(subtractDays(now, sentDaysAgo).getTime() - 60 * 60 * 1000);
  return {
    sentAt: iso(sentAt),
    responseWindowEndsAt: iso(addDays(sentAt, 21)),
    method,
    trackingNumber: method === "certified" ? `9407 1000 0000 ${ref.replace(/\D/g, "").padEnd(8, "0").slice(0, 4)} ${ref.replace(/\D/g, "").padEnd(8, "0").slice(4, 8)} 00` : null,
  };
}

function evidence(caseId: string, now: Date, items: { title: string; type: EvidenceItem["type"]; notes: string; files: string[] }[]): EvidenceItem[] {
  return items.map((item, i) => ({
    id: `${caseId}-ev${i + 1}`,
    title: item.title,
    type: item.type,
    notes: item.notes,
    createdAt: iso(subtractDays(now, 10 - i)),
    files: item.files.map((name, j) => ({
      id: `${caseId}-ev${i + 1}-f${j + 1}`,
      name,
      sizeBytes: 180_000 + (i * 7 + j * 13) * 11_000,
    })),
  }));
}

const SAC = { name: "Sacramento County", state: "CA" } as const;
const LA = { name: "Los Angeles County", state: "CA" } as const;

function tasksAt(county: { name: string; state: string }, now: Date, spec: ("approved" | "unlocked" | "submitted" | "rejected" | "locked")[]): CourtTask[] {
  return createCourtTasks(county).map((task, i) => {
    const status = spec[i] ?? "locked";
    const base = { ...task, status };
    if (status === "approved") {
      return {
        ...base,
        submission: { submittedAt: iso(subtractDays(now, 8 - i)), fields: sampleFields(task.type) },
        approvedAt: iso(subtractDays(now, 7 - i)),
      };
    }
    if (status === "submitted" || status === "rejected") {
      return {
        ...base,
        submission: { submittedAt: iso(subtractDays(now, 1)), fields: sampleFields(task.type) },
        reviewNote:
          status === "rejected"
            ? "The receipt number doesn't match the court's records. Please re-check the receipt and resubmit."
            : null,
      };
    }
    return base;
  });
}

function sampleFields(type: CourtTask["type"]): Record<string, string> {
  switch (type) {
    case "form_online":
      return { confirmationNumber: "SC-2026-004417", attest: "true" };
    case "fee_online":
      return { amountPaid: "75.00", receiptNumber: "R-99213" };
    case "serve_mail":
      return { trackingNumber: "9407 1000 0000 1234 5678 00", mailedOn: "2026-09-02" };
    case "court_date":
      return { courtDate: "2026-11-20", courtTime: "09:30", courtroom: "Dept. 14" };
    case "hearing":
      return { prepared: "true", notes: "" };
  }
}

export function buildSeed(now: Date): DemoState {
  const cases: CaseRecord[] = [];

  type Required4 = "amountCents" | "incidentDate" | "description" | "defendant";
  function add(b: Builder, rest: Pick<CaseRecord, Required4> & Partial<CaseRecord>) {
    const created = subtractDays(now, b.ageDays);
    cases.push({
      id: b.id,
      referenceCode: b.ref,
      service: b.service,
      status: b.status,
      claimType: null,
      county: SAC,
      mailingMethod: "first_class",
      dropbox: { connected: false, accountEmail: null, connectedAt: null },
      evidence: [],
      hasEvidenceToUpload: null,
      questionnaire: null,
      letter: noLetter,
      revisionRequest: null,
      mailing: null,
      outcome: null,
      reminderEnabled: false,
      tasks: [],
      activity: activity(b.id, [["case_created", created]]),
      createdAt: iso(created),
      updatedAt: iso(subtractDays(now, Math.max(b.ageDays - 1, 0))),
      ...rest,
    });
  }

  // 1 ─ Activation Hero: needs to get organized, then the questionnaire.
  add(
    { id: "ah-get-organized", ref: "AH-30417", service: "activation_hero", status: "paid_pending_claim_type_selection", ageDays: 1 },
    {
      amountCents: 412_000,
      incidentDate: iso(subtractDays(now, 20)),
      description:
        "My rideshare driver account was deactivated without a clear reason after more than two years on the platform. I was never given a chance to appeal and I still have unpaid earnings in my account.",
      defendant: { name: "RideNow Technologies, Inc.", address: { line1: "1 Market Plaza, Suite 400", city: "San Francisco", state: "CA", zip: "94105" } },
      mailingMethod: "certified",
    },
  );

  // 2 ─ Small Claims: team is preparing the letter.
  add(
    { id: "sc-letter-in-progress", ref: "SC-20931", service: "small_claims", status: "paid_pending_letter_review", ageDays: 2 },
    {
      amountCents: 185_000,
      claimType: "contract_dispute",
      incidentDate: iso(subtractDays(now, 45)),
      description:
        "I paid a deposit of $1,850 to a contractor for a kitchen remodel. The work never started and the contractor has stopped answering my calls and emails.",
      defendant: { name: "Brightside Remodeling LLC", address: { line1: "902 Industrial Way", city: "Elk Grove", state: "CA", zip: "95757" } },
      hasEvidenceToUpload: false,
    },
  );

  // 4 ─ Small Claims: letter ready — customer needs to review and sign.
  add(
    { id: "sc-awaiting-signature", ref: "SC-20702", service: "small_claims", status: "letter_signature_sent", ageDays: 6 },
    {
      amountCents: 240_000,
      claimType: "landlord_tenant",
      incidentDate: iso(subtractDays(now, 75)),
      description:
        "My former landlord has kept my $2,400 security deposit for more than 30 days after I moved out, with no itemized list of deductions.",
      defendant: { name: "Pinecrest Property Management", address: { line1: "2210 K Street", city: "Sacramento", state: "CA", zip: "95816" } },
      mailingMethod: "certified",
      dropbox: { ...DEMO_DROPBOX, connectedAt: iso(subtractDays(now, 5)) },
      hasEvidenceToUpload: true,
      evidence: evidence("sc-awaiting-signature", now, [
        { title: "Lease agreement", type: "contract", notes: "", files: ["lease-2024.pdf"] },
        { title: "Move-out photos", type: "photo", notes: "Taken the day I returned the keys", files: ["kitchen.jpg", "bedroom.jpg", "bathroom.jpg"] },
      ]),
      letter: letterFor("sc-awaiting-signature", now, 6),
      activity: activity("sc-awaiting-signature", [
        ["case_created", subtractDays(now, 6)],
        ["dropbox_connected", subtractDays(now, 5)],
        ["evidence_added", subtractDays(now, 5)],
        ["letter_sent_for_signature", subtractDays(now, 1)],
      ]),
    },
  );

  // 5 ─ Small Claims: signed — customer needs to press "Send letter".
  add(
    { id: "sc-ready-to-send", ref: "SC-20655", service: "small_claims", status: "letter_signed", ageDays: 8 },
    {
      amountCents: 68_000,
      claimType: "property_damage",
      incidentDate: iso(subtractDays(now, 40)),
      description:
        "A neighbor's contractor backed a truck into my fence, breaking six panels. They acknowledged it at the time but have not paid for repairs.",
      defendant: { name: "Delgado Landscaping", address: { line1: "17 Oak Hollow Rd", city: "Folsom", state: "CA", zip: "95630" } },
      hasEvidenceToUpload: false,
      letter: letterFor("sc-ready-to-send", now, 8, { signedDaysAgo: 0 }),
      activity: activity("sc-ready-to-send", [
        ["case_created", subtractDays(now, 8)],
        ["letter_sent_for_signature", subtractDays(now, 3)],
        ["letter_signed", now],
      ]),
    },
  );

  // 6 ─ Small Claims: mailed, plenty of time left.
  {
    const mailing = mailingFor(now, 7, "certified", "SC-20588");
    add(
      { id: "sc-waiting-window", ref: "SC-20588", service: "small_claims", status: "mailed", ageDays: 14 },
      {
        amountCents: 150_000,
        claimType: "unpaid_loan",
        incidentDate: iso(subtractDays(now, 200)),
        description:
          "I lent a former coworker $1,500 to cover moving costs. They agreed in writing to repay me within three months and have not made any payments.",
        defendant: { name: "Jordan Whitfield", address: { line1: "880 Willow Creek Ln", city: "Roseville", state: "CA", zip: "95661" } },
        mailingMethod: "certified",
        dropbox: { ...DEMO_DROPBOX, connectedAt: iso(subtractDays(now, 12)) },
        hasEvidenceToUpload: true,
        evidence: evidence("sc-waiting-window", now, [
          { title: "Signed repayment agreement", type: "contract", notes: "", files: ["repayment-agreement.pdf"] },
          { title: "Text thread", type: "message", notes: "Promises to pay", files: ["texts.png"] },
        ]),
        letter: letterFor("sc-waiting-window", now, 14, { signedDaysAgo: 8 }),
        mailing,
        reminderEnabled: true,
        activity: activity("sc-waiting-window", [
          ["case_created", subtractDays(now, 14)],
          ["letter_sent_for_signature", subtractDays(now, 10)],
          ["letter_signed", subtractDays(now, 8)],
          ["letter_mailed", subtractDays(now, 7)],
        ]),
      },
    );
  }

  // 8 ─ Activation Hero: window has closed — customer must mark the outcome.
  {
    const mailing = mailingFor(now, 23, "certified", "AH-30102");
    add(
      { id: "ah-outcome-needed", ref: "AH-30102", service: "activation_hero", status: "mailed", ageDays: 34 },
      {
        amountCents: 296_000,
        claimType: "wrongful_deactivation",
        incidentDate: iso(subtractDays(now, 70)),
        description:
          "My delivery account was deactivated after a single customer complaint that I was never shown. I lost my main source of income.",
        defendant: { name: "DashGo Delivery, Inc.", address: { line1: "800 Mission Street", city: "San Francisco", state: "CA", zip: "94103" } },
        mailingMethod: "certified",
        dropbox: { ...DEMO_DROPBOX, connectedAt: iso(subtractDays(now, 30)) },
        hasEvidenceToUpload: true,
        evidence: evidence("ah-outcome-needed", now, [
          { title: "Deactivation email", type: "screenshot", notes: "", files: ["deactivation-email.png"] },
          { title: "Earnings statements", type: "other", notes: "Last 12 weeks", files: ["earnings.pdf"] },
        ]),
        questionnaire: { answers: { false_claim: true, no_investigation: true, retaliation: false }, submittedAt: iso(subtractDays(now, 32)) },
        letter: letterFor("ah-outcome-needed", now, 34, { signedDaysAgo: 24 }),
        mailing,
        activity: activity("ah-outcome-needed", [
          ["case_created", subtractDays(now, 34)],
          ["questionnaire_submitted", subtractDays(now, 32)],
          ["claim_type_selected", subtractDays(now, 31)],
          ["letter_signed", subtractDays(now, 24)],
          ["letter_mailed", subtractDays(now, 23)],
        ]),
      },
    );
  }

  const courtBase = (id: string, ref: string, ageDays: number) => ({
    id,
    ref,
    service: "small_claims" as const,
    ageDays,
  });
  const outcomeNoResponse = (now: Date): Outcome => ({
    type: "no_response",
    resolution: null,
    issues: [],
    amountReceivedCents: null,
    markedAt: iso(subtractDays(now, 9)),
  });

  // 9 ─ Court filing: a step was rejected and needs changes.
  {
    const id = "sc-court-needs-changes";
    add(
      { ...courtBase(id, "SC-19844", 48), status: "phase2_in_progress" },
      {
        amountCents: 310_000,
        claimType: "contract_dispute",
        county: LA,
        incidentDate: iso(subtractDays(now, 120)),
        description:
          "A web developer was paid $3,100 up front to build my shop's online store and delivered nothing usable after four months.",
        defendant: { name: "PixelCraft Studio LLC", address: { line1: "4100 Wilshire Blvd", city: "Los Angeles", state: "CA", zip: "90010" } },
        dropbox: { ...DEMO_DROPBOX, connectedAt: iso(subtractDays(now, 40)) },
        hasEvidenceToUpload: false,
        letter: letterFor(id, now, 48, { signedDaysAgo: 38 }),
        mailing: mailingFor(now, 36, "certified", "SC-19844"),
        outcome: outcomeNoResponse(now),
        tasks: tasksAt(LA, now, ["approved", "rejected"]),
        activity: activity(id, [
          ["case_created", subtractDays(now, 48)],
          ["letter_mailed", subtractDays(now, 36)],
          ["phase2_unlocked", subtractDays(now, 9)],
          ["task_approved", subtractDays(now, 7)],
          ["task_submitted", subtractDays(now, 2)],
          ["task_rejected", subtractDays(now, 1)],
        ]),
      },
    );
  }

  // 10 ─ Court filing: step submitted, our team is reviewing.
  {
    const id = "sc-court-in-review";
    add(
      { ...courtBase(id, "SC-19702", 52), status: "phase2_in_progress" },
      {
        amountCents: 128_000,
        claimType: "property_damage",
        incidentDate: iso(subtractDays(now, 130)),
        description:
          "A tenant in my rental property left without paying the last two months and caused damage to the flooring.",
        defendant: { name: "Marcus Bell", address: { line1: "76 Harbor View Ct", city: "Oakland", state: "CA", zip: "94607" } },
        county: { name: "Alameda County", state: "CA" },
        dropbox: { ...DEMO_DROPBOX, connectedAt: iso(subtractDays(now, 45)) },
        hasEvidenceToUpload: false,
        letter: letterFor(id, now, 52, { signedDaysAgo: 42 }),
        mailing: mailingFor(now, 40, "first_class", "SC-19702"),
        outcome: { ...outcomeNoResponse(now), type: "unsatisfactory", issues: ["Partial payment only"], amountReceivedCents: 20_000 },
        tasks: tasksAt({ name: "Alameda County", state: "CA" }, now, ["approved", "approved", "submitted"]),
        activity: activity(id, [
          ["case_created", subtractDays(now, 52)],
          ["letter_mailed", subtractDays(now, 40)],
          ["phase2_unlocked", subtractDays(now, 12)],
          ["task_approved", subtractDays(now, 9)],
          ["task_approved", subtractDays(now, 4)],
          ["task_submitted", subtractDays(now, 1)],
        ]),
      },
    );
  }

  // 11 ─ Court filing: every step approved — customer can close.
  {
    const id = "sc-court-ready-to-close";
    add(
      { ...courtBase(id, "SC-19420", 90), status: "phase2_completed" },
      {
        amountCents: 205_000,
        claimType: "landlord_tenant",
        incidentDate: iso(subtractDays(now, 200)),
        description:
          "My landlord refused to return my deposit and then failed to appear at the hearing where I was awarded judgment.",
        defendant: { name: "Harbor Point Apartments LP", address: { line1: "1200 Bay Street", city: "San Diego", state: "CA", zip: "92101" } },
        county: { name: "San Diego County", state: "CA" },
        dropbox: { ...DEMO_DROPBOX, connectedAt: iso(subtractDays(now, 80)) },
        hasEvidenceToUpload: false,
        letter: letterFor(id, now, 90, { signedDaysAgo: 80 }),
        mailing: mailingFor(now, 78, "certified", "SC-19420"),
        outcome: outcomeNoResponse(now),
        tasks: tasksAt({ name: "San Diego County", state: "CA" }, now, ["approved", "approved", "approved", "approved", "approved"]),
        activity: activity(id, [
          ["case_created", subtractDays(now, 90)],
          ["letter_mailed", subtractDays(now, 78)],
          ["phase2_unlocked", subtractDays(now, 40)],
          ["task_approved", subtractDays(now, 3)],
        ]),
      },
    );
  }

  // 12 ─ Closed: settled.
  {
    const id = "sc-closed-settled";
    add(
      { ...courtBase(id, "SC-18990", 70), status: "closed" },
      {
        amountCents: 75_000,
        claimType: "consumer_dispute",
        incidentDate: iso(subtractDays(now, 160)),
        description: "A dentist's office billed me for a procedure insurance had already covered and refused to correct the charge.",
        defendant: { name: "BrightSmile Dental Group", address: { line1: "640 Elm Street", city: "Davis", state: "CA", zip: "95616" } },
        hasEvidenceToUpload: false,
        letter: letterFor(id, now, 70, { signedDaysAgo: 62 }),
        mailing: mailingFor(now, 60, "first_class", "SC-18990"),
        outcome: {
          type: "settled",
          resolution: "full_payment_received",
          issues: [],
          amountReceivedCents: 75_000,
          markedAt: iso(subtractDays(now, 45)),
        },
        activity: activity(id, [
          ["case_created", subtractDays(now, 70)],
          ["letter_mailed", subtractDays(now, 60)],
          ["outcome_settled", subtractDays(now, 45)],
          ["case_closed", subtractDays(now, 45)],
        ]),
      },
    );
  }

  // ── Activation Hero: a case at every stage of the journey ───────────────────────────────────
  const platformDefendant = (platformId: string) => {
    const p = PLATFORMS.find((x) => x.id === platformId)!;
    return { name: p.name, address: p.address };
  };
  const answers = { false_claim: true, no_investigation: true, retaliation: false };
  const questionnaireDone = (daysAgo: number) => ({ answers, submittedAt: iso(subtractDays(now, daysAgo)) });
  const ahDescription = (platformName: string) =>
    `My ${platformName.split(",")[0]} account was deactivated after a customer complaint I was never shown. I had a high rating and thousands of completed jobs, and my appeals only got automated replies.`;

  interface AhSpec {
    id: string;
    ref: string;
    platform: string;
    status: ClaimStatus;
    ageDays: number;
    amount: number;
    rest?: Partial<CaseRecord>;
  }
  function ah(spec: AhSpec) {
    const def = platformDefendant(spec.platform);
    add(
      { id: spec.id, ref: spec.ref, service: "activation_hero", status: spec.status, ageDays: spec.ageDays },
      {
        amountCents: spec.amount * 100,
        incidentDate: iso(subtractDays(now, spec.ageDays + 25)),
        description: ahDescription(def.name),
        defendant: def,
        claimType: "wrongful_deactivation",
        ...spec.rest,
      },
    );
  }
  const connected = (daysAgo: number) => ({ ...DEMO_DROPBOX, connectedAt: iso(subtractDays(now, daysAgo)) });

  // A2 ─ Organized (confirmed no evidence): the questionnaire is next.
  ah({
    id: "ah-questionnaire-ready", ref: "AH-30398", platform: "lyft", status: "paid_pending_claim_type_selection", ageDays: 2, amount: 2800,
    rest: { claimType: null, hasEvidenceToUpload: false, mailingMethod: "first_class" },
  });

  // A3 ─ Team drafting, but the customer said they have evidence and hasn't attached a file yet.
  ah({
    id: "ah-evidence-nudge", ref: "AH-30377", platform: "instacart", status: "paid_pending_letter_review", ageDays: 4, amount: 3500,
    rest: {
      dropbox: connected(3),
      hasEvidenceToUpload: true,
      evidence: evidence("ah-evidence-nudge", now, [
        { title: "Deactivation email", type: "screenshot", notes: "", files: [] },
        { title: "Earnings history", type: "other", notes: "Last 8 weeks", files: [] },
      ]),
      questionnaire: questionnaireDone(3),
      activity: activity("ah-evidence-nudge", [["case_created", subtractDays(now, 4)], ["dropbox_connected", subtractDays(now, 3)], ["questionnaire_submitted", subtractDays(now, 3)], ["claim_type_selected", subtractDays(now, 3)]]),
    },
  });

  // A4 ─ Questionnaire done; our team is preparing the letter.
  ah({
    id: "ah-letter-in-progress", ref: "AH-30366", platform: "grubhub", status: "paid_pending_letter_review", ageDays: 3, amount: 2400,
    rest: {
      hasEvidenceToUpload: false,
      questionnaire: questionnaireDone(2),
      activity: activity("ah-letter-in-progress", [["case_created", subtractDays(now, 3)], ["questionnaire_submitted", subtractDays(now, 2)], ["claim_type_selected", subtractDays(now, 2)]]),
    },
  });

  // A5 ─ Customer asked for changes; team revising.
  ah({
    id: "ah-revision-requested", ref: "AH-30355", platform: "shipt", status: "letter_revision_requested", ageDays: 6, amount: 3100,
    rest: {
      dropbox: connected(5),
      hasEvidenceToUpload: true,
      evidence: evidence("ah-revision-requested", now, [{ title: "Deactivation notice", type: "screenshot", notes: "", files: ["notice.png"] }]),
      questionnaire: questionnaireDone(5),
      letter: letterFor("ah-revision-requested", now, 6),
      revisionRequest: {
        reasons: ["Incorrect dates", "Missing details"],
        details: "The deactivation date was September 2, not September 12 — and please mention my 2,000+ completed deliveries.",
        requestedAt: iso(subtractDays(now, 1)),
      },
      activity: activity("ah-revision-requested", [["case_created", subtractDays(now, 6)], ["questionnaire_submitted", subtractDays(now, 5)], ["letter_sent_for_signature", subtractDays(now, 3)], ["revision_requested", subtractDays(now, 1)]]),
    },
  });

  // A6 ─ Letter ready to review & sign.
  ah({
    id: "ah-awaiting-signature", ref: "AH-30344", platform: "doordash", status: "letter_signature_sent", ageDays: 7, amount: 4200,
    rest: {
      mailingMethod: "certified",
      dropbox: connected(6),
      hasEvidenceToUpload: true,
      evidence: evidence("ah-awaiting-signature", now, [
        { title: "Deactivation email", type: "screenshot", notes: "", files: ["email.png"] },
        { title: "Earnings statements", type: "other", notes: "Last 12 weeks", files: ["earnings.pdf"] },
      ]),
      questionnaire: questionnaireDone(6),
      letter: letterFor("ah-awaiting-signature", now, 7),
      activity: activity("ah-awaiting-signature", [["case_created", subtractDays(now, 7)], ["questionnaire_submitted", subtractDays(now, 6)], ["letter_sent_for_signature", subtractDays(now, 1)]]),
    },
  });

  // A7 ─ Signed; press "Send letter".
  ah({
    id: "ah-ready-to-send", ref: "AH-30333", platform: "taskrabbit", status: "letter_signed", ageDays: 9, amount: 1900,
    rest: {
      hasEvidenceToUpload: false,
      questionnaire: questionnaireDone(8),
      letter: letterFor("ah-ready-to-send", now, 9, { signedDaysAgo: 0 }),
      activity: activity("ah-ready-to-send", [["case_created", subtractDays(now, 9)], ["questionnaire_submitted", subtractDays(now, 8)], ["letter_sent_for_signature", subtractDays(now, 3)], ["letter_signed", now]]),
    },
  });

  // A8 ─ Mailed, plenty of time left.
  ah({
    id: "ah-waiting-window", ref: "AH-30322", platform: "amazon-flex", status: "mailed", ageDays: 14, amount: 3600,
    rest: {
      mailingMethod: "certified",
      dropbox: connected(12),
      hasEvidenceToUpload: false,
      questionnaire: questionnaireDone(13),
      letter: letterFor("ah-waiting-window", now, 14, { signedDaysAgo: 8 }),
      mailing: mailingFor(now, 7, "certified", "AH-30322"),
      reminderEnabled: true,
      activity: activity("ah-waiting-window", [["case_created", subtractDays(now, 14)], ["letter_signed", subtractDays(now, 8)], ["letter_mailed", subtractDays(now, 7)]]),
    },
  });

  // A9 ─ Mailed, window closes in 2 days (urgent styling).
  ah({
    id: "ah-window-urgent", ref: "AH-30311", platform: "ubereats", status: "mailed", ageDays: 26, amount: 2700,
    rest: {
      dropbox: connected(20),
      hasEvidenceToUpload: false,
      questionnaire: questionnaireDone(25),
      letter: letterFor("ah-window-urgent", now, 26, { signedDaysAgo: 21 }),
      mailing: mailingFor(now, 19, "first_class", "AH-30311"),
      activity: activity("ah-window-urgent", [["case_created", subtractDays(now, 26)], ["letter_signed", subtractDays(now, 21)], ["letter_mailed", subtractDays(now, 19)]]),
    },
  });

  // A11–A14 ─ Court filing, each distinct state.
  const court = (id: string, ref: string, platform: string, spec: Parameters<typeof tasksAt>[2], status: ClaimStatus, county: { name: string; state: string }, amount: number, extra: Partial<CaseRecord> = {}) =>
    ah({
      id, ref, platform, status, ageDays: 50, amount,
      rest: {
        county,
        dropbox: connected(45),
        hasEvidenceToUpload: false,
        questionnaire: questionnaireDone(48),
        letter: letterFor(id, now, 50, { signedDaysAgo: 40 }),
        mailing: mailingFor(now, 38, "certified", ref),
        outcome: outcomeNoResponse(now),
        tasks: tasksAt(county, now, spec),
        activity: activity(id, [["case_created", subtractDays(now, 50)], ["letter_mailed", subtractDays(now, 38)], ["phase2_unlocked", subtractDays(now, 9)]]),
        ...extra,
      },
    });
  court("ah-court-just-started", "AH-30270", "uber", ["unlocked"], "phase2_unlocked", { name: "Sacramento County", state: "CA" }, 3300);
  court("ah-court-needs-changes", "AH-30240", "lyft", ["approved", "rejected"], "phase2_in_progress", LA, 2900);
  court("ah-court-in-review", "AH-30210", "grubhub", ["approved", "approved", "submitted"], "phase2_in_progress", { name: "Alameda County", state: "CA" }, 3800);
  court("ah-court-ready-to-close", "AH-30180", "instacart", ["approved", "approved", "approved", "approved", "approved"], "phase2_completed", { name: "San Diego County", state: "CA" }, 4100);

  // A15 ─ Closed: settled before court.
  ah({
    id: "ah-closed-settled", ref: "AH-30150", platform: "shipt", status: "closed", ageDays: 75, amount: 2200,
    rest: {
      dropbox: connected(70),
      hasEvidenceToUpload: false,
      questionnaire: questionnaireDone(73),
      letter: letterFor("ah-closed-settled", now, 75, { signedDaysAgo: 65 }),
      mailing: mailingFor(now, 63, "first_class", "AH-30150"),
      outcome: { type: "settled", resolution: "partial_payment_agreed", issues: [], amountReceivedCents: 150_000, markedAt: iso(subtractDays(now, 48)) },
      activity: activity("ah-closed-settled", [["case_created", subtractDays(now, 75)], ["letter_mailed", subtractDays(now, 63)], ["outcome_settled", subtractDays(now, 48)], ["case_closed", subtractDays(now, 48)]]),
    },
  });

  // A16 ─ Closed after completing every court step.
  ah({
    id: "ah-closed-court", ref: "AH-30120", platform: "doordash", status: "closed", ageDays: 120, amount: 5000,
    rest: {
      county: { name: "Sacramento County", state: "CA" },
      dropbox: connected(110),
      hasEvidenceToUpload: false,
      questionnaire: questionnaireDone(118),
      letter: letterFor("ah-closed-court", now, 120, { signedDaysAgo: 108 }),
      mailing: mailingFor(now, 106, "certified", "AH-30120"),
      outcome: { type: "unsatisfactory", resolution: null, issues: ["Offer too low"], amountReceivedCents: 40_000, markedAt: iso(subtractDays(now, 80)) },
      tasks: tasksAt({ name: "Sacramento County", state: "CA" }, now, ["approved", "approved", "approved", "approved", "approved"]),
      activity: activity("ah-closed-court", [["case_created", subtractDays(now, 120)], ["letter_mailed", subtractDays(now, 106)], ["phase2_unlocked", subtractDays(now, 80)], ["task_approved", subtractDays(now, 20)], ["case_closed", subtractDays(now, 5)]]),
    },
  });

  const scDraftForm = emptyIntakeForm("small_claims", DEMO_PROFILE);
  const ahDraftForm = {
    ...emptyIntakeForm("activation_hero", DEMO_PROFILE),
    platformId: "doordash",
    platformName: "DoorDash, Inc.",
    platformAccountEmail: DEMO_PROFILE.email,
    platformAccountPhone: DEMO_PROFILE.phone,
    countyId: "sacramento-ca",
    countyName: "Sacramento County, CA",
    countyState: "CA",
    claimCategories: ["No reason given"],
    incidentDate: iso(subtractDays(now, 30)).slice(0, 10),
    claimAmount: "3200",
    claimDescription:
      "My Dasher account was deactivated without any explanation. I had a 4.9 rating and completed over 2,000 deliveries. I appealed twice and received only automated replies.",
    hasEvidenceToUpload: false,
    mailingPref: "certified" as const,
  };
  const drafts: DraftApplication[] = [
    {
      id: "draft-sc-1",
      service: "small_claims",
      updatedAt: iso(subtractDays(now, 3)),
      nextStepLabel: INTAKE_STEP_LABELS.defendant_information,
      currentStep: "defendant_information",
      form: scDraftForm,
    },
    {
      id: "draft-ah-1",
      service: "activation_hero",
      updatedAt: iso(subtractDays(now, 9)),
      nextStepLabel: INTAKE_STEP_LABELS.review,
      currentStep: "review",
      form: ahDraftForm,
    },
  ];

  return {
    version: 1,
    seededAt: iso(now),
    profile: DEMO_PROFILE,
    cases: cases.map((c) => (DASHBOARD_CASE_IDS.has(c.id) ? c : { ...c, hiddenFromDashboard: true })),
    drafts,
    autoLinkedCount: 0,
  };
}
