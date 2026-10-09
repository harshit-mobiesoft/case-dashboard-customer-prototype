// The only thing UI code talks to. Async + latency + failure injection make loading,
// disabled and error states real in the prototype, and swapping this module for the real
// API client later doesn't touch a single component.

import * as t from "../domain/transitions";
import type { TeamAction } from "../domain/transitions";
import { isStrict } from "../domain/strict";
import { TEST_CARD_DECLINED } from "../domain/card";
import { countyForZip, searchCounties as searchCountyList, type County } from "../domain/counties";
import { INTAKE_STEP_LABELS, keyForStep, type IntakeFormData } from "../domain/intake";
import { buildCaseFromIntake } from "../domain/intake-case";
import type {
  CaseRecord,
  DemoState,
  DraftApplication,
  Profile,
  RevisionReason,
  SettlementResolution,
} from "../domain/types";
import { demoStore, type DemoStore } from "./store";

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = "NotFoundError";
  }
}

export class SimulatedNetworkError extends Error {
  constructor() {
    super("Something went wrong on our end. Please try again.");
    this.name = "SimulatedNetworkError";
  }
}

export class AccountNotFoundError extends Error {
  constructor() {
    super("No account found for that email. Use the pre-filled demo email, or start a new claim to get started.");
    this.name = "AccountNotFoundError";
  }
}

export class PaymentDeclinedError extends Error {
  constructor() {
    super("Your card was declined. Try the test card 4242 4242 4242 4242.");
    this.name = "PaymentDeclinedError";
  }
}

export function getConfiguredLatency(): number {
  const raw = process.env.NEXT_PUBLIC_MOCK_LATENCY_MS;
  const parsed = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 350;
}

export interface Repository {
  // customer actions
  connectDropbox(caseId: string): Promise<CaseRecord>;
  disconnectDropbox(caseId: string): Promise<CaseRecord>;
  setNoEvidence(caseId: string, noEvidence: boolean): Promise<CaseRecord>;
  addEvidence(caseId: string, input: t.EvidenceInput): Promise<CaseRecord>;
  updateEvidence(caseId: string, itemId: string, input: Parameters<typeof t.updateEvidence>[2]): Promise<CaseRecord>;
  removeEvidenceFile(caseId: string, itemId: string, fileId: string): Promise<CaseRecord>;
  removeEvidence(caseId: string, itemId: string): Promise<CaseRecord>;
  submitQuestionnaire(caseId: string, answers: Record<string, boolean>): Promise<CaseRecord>;
  signLetter(caseId: string, typedName: string): Promise<CaseRecord>;
  requestRevision(caseId: string, input: { reasons: RevisionReason[]; details: string }): Promise<CaseRecord>;
  sendMailing(caseId: string): Promise<CaseRecord>;
  setReminder(caseId: string, enabled: boolean): Promise<CaseRecord>;
  markSettled(caseId: string, resolution: SettlementResolution): Promise<CaseRecord>;
  proceedToCourt(caseId: string, input: Parameters<typeof t.proceedToCourt>[1]): Promise<CaseRecord>;
  submitTask(caseId: string, taskId: string, fields: Record<string, string>): Promise<CaseRecord>;
  closeCase(caseId: string): Promise<CaseRecord>;
  updateProfile(profile: Profile): Promise<Profile>;
  // auth (prototype: the only account is the demo customer)
  requestSignIn(email: string): Promise<void>;
  // intake
  saveDraft(input: { draftId: string | null; form: IntakeFormData; step: number }): Promise<DraftApplication>;
  submitIntake(input: { form: IntakeFormData; draftId: string | null; cardNumber: string }): Promise<CaseRecord>;
  suggestCounties(claimantZip: string, defendantZip: string | null): Promise<{ claimant: County | null; defendant: County | null }>;
  searchCounties(query: string): Promise<County[]>;
  cancelDraft(draftId: string): Promise<DraftApplication[]>;
  // demo controls
  simulateTeamAction(caseId: string, action: TeamAction): Promise<CaseRecord>;
  fastForwardResponseWindow(caseId: string): Promise<CaseRecord>;
  resetDemo(): Promise<void>;
  failNextRequest(): void;
}

export function createRepository(options: {
  store: DemoStore;
  latencyMs: number;
  now?: () => Date;
}): Repository {
  const { store, latencyMs } = options;
  const now = options.now ?? (() => new Date());
  let failNext = false;

  async function simulateNetwork() {
    if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs));
    if (failNext) {
      failNext = false;
      throw new SimulatedNetworkError();
    }
  }

  async function mutateCase(
    caseId: string,
    fn: (c: CaseRecord, at: Date, state: DemoState) => CaseRecord,
  ): Promise<CaseRecord> {
    await simulateNetwork();
    const at = now();
    let result: CaseRecord | null = null;
    store.update((state) => {
      const existing = state.cases.find((c) => c.id === caseId);
      if (!existing) throw new NotFoundError("Case");
      const updated = fn(existing, at, state);
      result = updated;
      return { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) };
    });
    if (!result) throw new NotFoundError("Case");
    return result;
  }

  return {
    connectDropbox: (id) => mutateCase(id, (c, at) => t.connectDropbox(c, at)),
    disconnectDropbox: (id) => mutateCase(id, (c, at) => t.disconnectDropbox(c, at)),
    setNoEvidence: (id, v) => mutateCase(id, (c) => t.setNoEvidence(c, v)),
    addEvidence: (id, input) => mutateCase(id, (c, at) => t.addEvidence(c, input, at)),
    updateEvidence: (id, itemId, input) => mutateCase(id, (c, at) => t.updateEvidence(c, itemId, input, at)),
    removeEvidenceFile: (id, itemId, fileId) =>
      mutateCase(id, (c, at) => t.removeEvidenceFile(c, itemId, fileId, at)),
    removeEvidence: (id, itemId) => mutateCase(id, (c, at) => t.removeEvidence(c, itemId, at)),
    submitQuestionnaire: (id, answers) => mutateCase(id, (c, at) => t.submitQuestionnaire(c, answers, at)),
    signLetter: (id, typedName) =>
      mutateCase(id, (c, at, s) =>
        t.signLetter(c, { typedName, legalName: `${s.profile.firstName} ${s.profile.lastName}` }, at),
      ),
    requestRevision: (id, input) => mutateCase(id, (c, at) => t.requestRevision(c, input, at)),
    sendMailing: (id) => mutateCase(id, (c, at) => t.sendMailing(c, at)),
    setReminder: (id, enabled) => mutateCase(id, (c, at) => t.setReminder(c, enabled, at)),
    markSettled: (id, resolution) => mutateCase(id, (c, at) => t.markSettled(c, resolution, at)),
    proceedToCourt: (id, input) => mutateCase(id, (c, at) => t.proceedToCourt(c, input, at)),
    submitTask: (id, taskId, fields) => mutateCase(id, (c, at) => t.submitTask(c, taskId, fields, at)),
    closeCase: (id) => mutateCase(id, (c, at) => t.closeCase(c, at)),

    async updateProfile(profile) {
      await simulateNetwork();
      store.update((s) => ({ ...s, profile }));
      return profile;
    },

    async requestSignIn(email) {
      await simulateNetwork();
      const known = store.getSnapshot()?.profile.email.toLowerCase();
      // Prototype: any email opens the demo customer's dashboard (strict mode keeps the real check).
      if (isStrict() && (!known || email.trim().toLowerCase() !== known)) throw new AccountNotFoundError();
    },

    async saveDraft({ draftId, form, step }) {
      await simulateNetwork();
      const at = now().toISOString();
      let saved!: DraftApplication;
      store.update((state) => {
        const id =
          draftId ??
          `draft-${form.service === "activation_hero" ? "ah" : "sc"}-${Date.parse(at).toString(36)}`;
        const key = keyForStep(step);
        saved = { id, service: form.service, updatedAt: at, form, currentStep: key, nextStepLabel: INTAKE_STEP_LABELS[key] };
        const exists = state.drafts.some((d) => d.id === id);
        return {
          ...state,
          drafts: exists ? state.drafts.map((d) => (d.id === id ? saved : d)) : [saved, ...state.drafts],
        };
      });
      return saved;
    },

    async submitIntake({ form, draftId, cardNumber }) {
      await simulateNetwork();
      if (cardNumber.replace(/\D/g, "") === TEST_CARD_DECLINED) throw new PaymentDeclinedError();
      let created!: CaseRecord;
      store.update((state) => {
        created = buildCaseFromIntake(form, { existingRefs: state.cases.map((c) => c.referenceCode), now: now() });
        return {
          ...state,
          cases: [created, ...state.cases],
          drafts: draftId ? state.drafts.filter((d) => d.id !== draftId) : state.drafts,
        };
      });
      return created;
    },

    async suggestCounties(claimantZip, defendantZip) {
      await simulateNetwork();
      return {
        claimant: countyForZip(claimantZip),
        defendant: defendantZip ? countyForZip(defendantZip) : null,
      };
    },

    async searchCounties(query) {
      await simulateNetwork();
      return searchCountyList(query);
    },

    async cancelDraft(draftId) {
      await simulateNetwork();
      const next = store.update((s) => ({ ...s, drafts: s.drafts.filter((d) => d.id !== draftId) }));
      return next.drafts;
    },

    // Demo controls skip simulated latency/failure: they're the presenter's tools.
    async simulateTeamAction(caseId, action) {
      let result: CaseRecord | null = null;
      store.update((state) => {
        const existing = state.cases.find((c) => c.id === caseId);
        if (!existing) throw new NotFoundError("Case");
        const updated = t.simulateTeamAction(existing, action, now());
        result = updated;
        return { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) };
      });
      if (!result) throw new NotFoundError("Case");
      return result;
    },

    async fastForwardResponseWindow(caseId) {
      let result: CaseRecord | null = null;
      store.update((state) => {
        const existing = state.cases.find((c) => c.id === caseId);
        if (!existing) throw new NotFoundError("Case");
        const updated = t.fastForwardResponseWindow(existing, now());
        result = updated;
        return { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) };
      });
      if (!result) throw new NotFoundError("Case");
      return result;
    },

    async resetDemo() {
      store.reset();
    },

    failNextRequest() {
      failNext = true;
    },
  };
}

export const repository: Repository = createRepository({
  store: demoStore,
  latencyMs: getConfiguredLatency(),
});

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
