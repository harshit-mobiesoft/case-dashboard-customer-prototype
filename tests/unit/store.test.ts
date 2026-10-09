import { setStrict } from "@/lib/domain/strict";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AccountNotFoundError, PaymentDeclinedError, createRepository, NotFoundError, SimulatedNetworkError } from "@/lib/data/repository";
import { emptyIntakeForm } from "@/lib/domain/intake";
import { createDemoStore, isDemoState, STORAGE_KEY, type KeyValueStorage } from "@/lib/data/store";
import { NOW, seed } from "./helpers";

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}

// These files exercise the validation rules, so they run in strict mode (the app default is non-blocking).
beforeEach(() => setStrict(true));

describe("demo store", () => {
  it("is empty until init() (keeps SSR and first client render identical)", () => {
    const store = createDemoStore({ storage: memoryStorage(), now: () => NOW });
    expect(store.getSnapshot()).toBeNull();
    store.init();
    expect(store.getSnapshot()?.cases.length).toBeGreaterThanOrEqual(seed.cases.length);
  });

  it("persists updates and restores them in a new store", () => {
    const storage = memoryStorage();
    const a = createDemoStore({ storage, now: () => NOW });
    a.init();
    a.update((s) => ({ ...s, autoLinkedCount: 7 }));

    const b = createDemoStore({ storage, now: () => NOW });
    b.init();
    expect(b.getSnapshot()?.autoLinkedCount).toBe(7);
  });

  it("ignores (and cleans up) demo state saved under an older seed version", () => {
    const storage = memoryStorage({ "cdcp:state:v2": JSON.stringify({ ...seed, cases: seed.cases.map((c) => ({ ...c, hiddenFromDashboard: true })) }) });
    const store = createDemoStore({ storage, now: () => NOW });
    store.init();
    expect(store.getSnapshot()!.cases.filter((c) => !c.hiddenFromDashboard)).toHaveLength(9);
    expect(storage.getItem("cdcp:state:v2")).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it.each([
    ["not json", "{nope"],
    ["wrong version", JSON.stringify({ ...seed, version: 99 })],
    ["wrong shape", JSON.stringify({ version: 1 })],
  ])("falls back to the seed on corrupt storage (%s)", (_name, raw) => {
    const store = createDemoStore({ storage: memoryStorage({ [STORAGE_KEY]: raw }), now: () => NOW });
    store.init();
    expect(isDemoState(store.getSnapshot())).toBe(true);
    expect(store.getSnapshot()?.seededAt).toBe(NOW.toISOString());
  });

  it("keeps working in memory when storage throws", () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {},
    };
    const store = createDemoStore({ storage: broken, now: () => NOW });
    expect(() => store.init()).not.toThrow();
    store.update((s) => ({ ...s, autoLinkedCount: 3 }));
    expect(store.getSnapshot()?.autoLinkedCount).toBe(3);
  });

  it("notifies subscribers, supports unsubscribe, and reset() restores the seed", () => {
    const store = createDemoStore({ storage: memoryStorage(), now: () => NOW });
    store.init();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.update((s) => ({ ...s, autoLinkedCount: 1 }));
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    store.reset();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()?.autoLinkedCount).toBe(0);
  });

  it("reload() adopts what another tab persisted", () => {
    const storage = memoryStorage();
    const a = createDemoStore({ storage, now: () => NOW });
    const b = createDemoStore({ storage, now: () => NOW });
    a.init();
    b.init();
    a.update((s) => ({ ...s, autoLinkedCount: 5 }));
    b.reload();
    expect(b.getSnapshot()?.autoLinkedCount).toBe(5);
  });
});

describe("repository", () => {
  function setup() {
    const store = createDemoStore({ storage: memoryStorage(), now: () => NOW });
    store.init();
    const repo = createRepository({ store, latencyMs: 0, now: () => NOW });
    return { store, repo };
  }

  it("applies a transition and persists it to the store", async () => {
    const { store, repo } = setup();
    const updated = await repo.signLetter("sc-awaiting-signature", "alex rivera");
    expect(updated.status).toBe("letter_signed");
    expect(store.getSnapshot()?.cases.find((c) => c.id === "sc-awaiting-signature")?.status).toBe("letter_signed");
  });

  it("surfaces domain errors without changing state", async () => {
    const { store, repo } = setup();
    const before = JSON.stringify(store.getSnapshot());
    await expect(repo.signLetter("sc-awaiting-signature", "Wrong Name")).rejects.toThrow(/legal name/i);
    expect(JSON.stringify(store.getSnapshot())).toBe(before);
  });

  it("throws NotFoundError for unknown cases", async () => {
    const { repo } = setup();
    await expect(repo.sendMailing("nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("failNextRequest fails exactly one call and leaves state untouched", async () => {
    const { repo } = setup();
    repo.failNextRequest();
    await expect(repo.sendMailing("sc-ready-to-send")).rejects.toBeInstanceOf(SimulatedNetworkError);
    await expect(repo.sendMailing("sc-ready-to-send")).resolves.toMatchObject({ status: "mailed" });
  });

  it("cancels drafts, updates the profile and resets", async () => {
    const { store, repo } = setup();
    expect(await repo.cancelDraft("draft-sc-1")).toHaveLength(1);
    await repo.updateProfile({ ...seed.profile, firstName: "Alexandra" });
    expect(store.getSnapshot()?.profile.firstName).toBe("Alexandra");
    await repo.resetDemo();
    expect(store.getSnapshot()?.profile.firstName).toBe("Alex");
    expect(store.getSnapshot()?.drafts).toHaveLength(2);
  });

  it("demo controls drive the same transitions", async () => {
    const { repo } = setup();
    expect((await repo.simulateTeamAction("sc-letter-in-progress", "advance")).status).toBe("letter_signature_sent");
    expect((await repo.fastForwardResponseWindow("sc-waiting-window")).mailing?.responseWindowEndsAt).toBeDefined();
  });
});

describe("repository: intake & auth", () => {
  function setup() {
    const store = createDemoStore({ storage: memoryStorage(), now: () => NOW });
    store.init();
    return { store, repo: createRepository({ store, latencyMs: 0, now: () => NOW }) };
  }
  const form = () => ({
    ...emptyIntakeForm("small_claims", seed.profile),
    defendantLegalName: "Acme LLC",
    defendantAddress: "1 Main St",
    defendantCity: "Sacramento",
    defendantState: "CA",
    defendantZip: "95814",
    countyId: "sacramento-ca",
    countyName: "Sacramento County, CA",
    countyState: "CA",
    claimCategories: ["Broken contract"],
    incidentDate: "2026-09-01",
    claimAmount: "1500",
    claimDescription: "Took my money.",
    hasEvidenceToUpload: false,
    mailingPref: "first_class" as const,
  });

  it("signs in only the demo customer's email (case-insensitive)", async () => {
    const { repo } = setup();
    await expect(repo.requestSignIn("  ALEX.RIVERA@example.com ")).resolves.toBeUndefined();
    await expect(repo.requestSignIn("someone@else.com")).rejects.toBeInstanceOf(AccountNotFoundError);
  });

  it("creates a draft on first save and updates the same one afterwards", async () => {
    const { store, repo } = setup();
    const first = await repo.saveDraft({ draftId: null, form: form(), step: 2 });
    expect(first.currentStep).toBe("defendant_information");
    expect(first.nextStepLabel).toBe("Defendant information");
    expect(store.getSnapshot()!.drafts[0]!.id).toBe(first.id);
    expect(store.getSnapshot()!.drafts).toHaveLength(3);

    const second = await repo.saveDraft({ draftId: first.id, form: form(), step: 5 });
    expect(second.id).toBe(first.id);
    expect(second.currentStep).toBe("review");
    expect(store.getSnapshot()!.drafts).toHaveLength(3);
  });

  it("submitting an intake creates the case at the top of the list and removes its draft", async () => {
    const { store, repo } = setup();
    const draft = await repo.saveDraft({ draftId: null, form: form(), step: 5 });
    const created = await repo.submitIntake({ form: form(), draftId: draft.id, cardNumber: "4242 4242 4242 4242" });
    const state = store.getSnapshot()!;
    expect(state.cases[0]!.id).toBe(created.id);
    expect(state.cases).toHaveLength(seed.cases.length + 1);
    expect(state.drafts.some((d) => d.id === draft.id)).toBe(false);
  });

  it("a declined card creates nothing; two intakes never share a reference", async () => {
    const { store, repo } = setup();
    await expect(repo.submitIntake({ form: form(), draftId: null, cardNumber: "4000 0000 0000 0002" })).rejects.toBeInstanceOf(PaymentDeclinedError);
    expect(store.getSnapshot()!.cases).toHaveLength(seed.cases.length);

    const a = await repo.submitIntake({ form: form(), draftId: null, cardNumber: "4242424242424242" });
    const b = await repo.submitIntake({ form: form(), draftId: null, cardNumber: "4242424242424242" });
    expect(a.referenceCode).not.toBe(b.referenceCode);
    expect(a.id).not.toBe(b.id);
  });

  it("looks up and searches counties through the same latency/failure path", async () => {
    const { repo } = setup();
    expect((await repo.suggestCounties("95814", "90010")).defendant?.id).toBe("los-angeles-ca");
    expect((await repo.searchCounties("king")).map((c) => c.id)).toEqual(["king-wa"]);
    repo.failNextRequest();
    await expect(repo.searchCounties("king")).rejects.toBeInstanceOf(SimulatedNetworkError);
  });
});
