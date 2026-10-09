import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IntakeFlow } from "@/components/intake/intake-flow";
import { StepClaim } from "@/components/intake/step-claim";
import { StepClaimant } from "@/components/intake/step-claimant";
import { StepDefendant } from "@/components/intake/step-defendant";
import { StepPayment } from "@/components/intake/step-payment";
import { StepReview } from "@/components/intake/step-review";
import { StepUpgradeMail } from "@/components/intake/step-upgrade-mail";
import { setStrict } from "@/lib/domain/strict";
import { demoStore } from "@/lib/data/store";
import { signIn, signOut } from "@/lib/data/session";
import { emptyIntakeForm, type IntakeFormData } from "@/lib/domain/intake";
import { seed } from "../unit/helpers";
import { freshStore, renderUi } from "./render";

beforeEach(() => {
  freshStore();
  signOut();
  setStrict(true);
  // Most flow tests type every field themselves, so they run in the strict (blank, validating) mode.
  window.history.replaceState(null, "", "/smallclaimshero?validate=1");
});

/** A controlled wrapper so steps that call `update` behave like they do inside IntakeFlow. */
import { useState } from "react";
function Harness({ initial, children }: { initial: IntakeFormData; children: (p: { form: IntakeFormData; update: (patch: Partial<IntakeFormData>) => void }) => React.ReactNode }) {
  const [form, setForm] = useState(initial);
  return <>{children({ form, update: (patch) => setForm((f) => ({ ...f, ...patch })) })}</>;
}

describe("StepClaimant", () => {
  it("is valid with the prefilled profile and calls onNext", async () => {
    const onNext = vi.fn();
    renderUi(
      <Harness initial={emptyIntakeForm("small_claims", seed.profile)}>
        {(p) => <StepClaimant {...p} strict onNext={onNext} />}
      </Harness>,
    );
    expect(screen.getByLabelText("Full legal name")).toHaveValue("Alex Rivera");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onNext).toHaveBeenCalled();
  });

  it("blocks an empty form, lists the problems and clears each error as it's fixed", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderUi(
      <Harness initial={emptyIntakeForm("small_claims")}>{(p) => <StepClaimant {...p} strict onNext={onNext} />}</Harness>,
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText("Full legal name is required.")).toBeInTheDocument();
    expect(screen.getByText("Some required fields need your attention.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Full legal name"), "Jane Smith");
    expect(screen.queryByText("Full legal name is required.")).not.toBeInTheDocument();
  });

  it("offers a fix for a mistyped email domain and accepts it", async () => {
    const user = userEvent.setup();
    renderUi(<Harness initial={emptyIntakeForm("small_claims")}>{(p) => <StepClaimant {...p} onNext={() => {}} />}</Harness>);
    const email = screen.getByLabelText(/best email address/i);
    await user.type(email, "jane@gmial.com");
    await user.tab();
    expect(await screen.findByText("jane@gmail.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yes, use it" }));
    expect(email).toHaveValue("jane@gmail.com");
  });

  it("explains the Activation Hero account step", () => {
    renderUi(<Harness initial={emptyIntakeForm("activation_hero")}>{(p) => <StepClaimant {...p} onNext={() => {}} />}</Harness>);
    expect(screen.getByText(/account that was deactivated/i)).toBeInTheDocument();
    expect(screen.getByText(/gig platform on the next step/i)).toBeInTheDocument();
  });
});

describe("StepDefendant", () => {
  it("small claims: an existing business autofills the address, which can be overridden", async () => {
    const user = userEvent.setup();
    renderUi(<Harness initial={emptyIntakeForm("small_claims", seed.profile)}>{(p) => <StepDefendant {...p} onNext={() => {}} onBack={() => {}} />}</Harness>);
    await user.type(screen.getByRole("combobox", { name: /legal name of the business/i }), "bright");
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option").length).toBeGreaterThanOrEqual(2);
    await user.click(within(list).getByRole("option", { name: /Brightside Remodeling/ }));

    expect(screen.getByText("Address on file")).toBeInTheDocument();
    expect(screen.getByText(/902 Industrial Way/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use a different address" }));
    expect(screen.getByLabelText("Street address")).toHaveValue("902 Industrial Way");
  });

  it("supports keyboard selection in the autocomplete (arrows + Enter, Escape closes)", async () => {
    const user = userEvent.setup();
    renderUi(<Harness initial={emptyIntakeForm("small_claims", seed.profile)}>{(p) => <StepDefendant {...p} onNext={() => {}} onBack={() => {}} />}</Harness>);
    const box = screen.getByRole("combobox", { name: /legal name of the business/i });
    await user.type(box, "bright");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByText("Address on file")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Use a different address" }));
    await user.clear(box);
    await user.type(box, "tech");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("toggling Individual/Business keeps each type's name and drops the registered agent", async () => {
    const user = userEvent.setup();
    renderUi(<Harness initial={emptyIntakeForm("small_claims", seed.profile)}>{(p) => <StepDefendant {...p} onNext={() => {}} onBack={() => {}} />}</Harness>);
    await user.type(screen.getByRole("combobox", { name: /legal name of the business/i }), "Zed Corp");
    expect(screen.getByLabelText(/registered agent/i)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /individual/i }));
    expect(screen.queryByLabelText(/registered agent/i)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/full legal name of the person/i), "Zoe Doe");
    await user.click(screen.getByRole("radio", { name: /business/i }));
    expect(screen.getByRole("combobox", { name: /legal name of the business/i })).toHaveValue("Zed Corp");
  });

  it("validates before continuing", async () => {
    const onNext = vi.fn();
    renderUi(<Harness initial={emptyIntakeForm("small_claims", seed.profile)}>{(p) => <StepDefendant {...p} strict onNext={onNext} onBack={() => {}} />}</Harness>);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText("Business legal name is required.")).toBeInTheDocument();
  });

  it("Activation Hero: pick a platform, 'same as contact' copies details, one identifier is enough", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderUi(<Harness initial={emptyIntakeForm("activation_hero", seed.profile)}>{(p) => <StepDefendant {...p} strict onNext={onNext} onBack={() => {}} />}</Harness>);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Please select the platform that deactivated you.")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Platform" }));
    await user.type(screen.getByRole("combobox", { name: "Platform" }), "door");
    await user.click(screen.getByRole("option", { name: /DoorDash/ }));
    await user.click(screen.getByRole("checkbox", { name: /same as my contact information/i }));
    expect(screen.getByLabelText("Account email")).toHaveValue("alex.rivera@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onNext).toHaveBeenCalled();
  });
});

describe("StepClaim", () => {
  const full = () => emptyIntakeForm("small_claims", seed.profile);

  it("small claims is single-select; Activation Hero is multi-select", async () => {
    const user = userEvent.setup();
    const { unmount } = renderUi(<Harness initial={full()}>{(p) => <StepClaim {...p} onNext={() => {}} onBack={() => {}} />}</Harness>);
    await user.click(screen.getByRole("radio", { name: /Money owed/ }));
    await user.click(screen.getByRole("radio", { name: /Broken contract/ }));
    expect(screen.getByRole("radio", { name: /Money owed/ })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: /Broken contract/ })).toHaveAttribute("aria-checked", "true");
    unmount();

    renderUi(<Harness initial={emptyIntakeForm("activation_hero", seed.profile)}>{(p) => <StepClaim {...p} onNext={() => {}} onBack={() => {}} />}</Harness>);
    await user.click(screen.getByRole("checkbox", { name: /Retaliation/ }));
    await user.click(screen.getByRole("checkbox", { name: /No reason given/ }));
    expect(screen.getByRole("checkbox", { name: /Retaliation/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: /No reason given/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText(/estimated lost earnings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of deactivation/i)).toBeInTheDocument();
  });

  it("counts words, warns over 100, and refuses to continue", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderUi(<Harness initial={full()}>{(p) => <StepClaim {...p} strict onNext={onNext} onBack={() => {}} />}</Harness>);
    const box = screen.getByLabelText("Describe your claim", { selector: "textarea" });
    await user.click(box);
    await user.paste(Array.from({ length: 101 }, (_, i) => `w${i}`).join(" "));
    expect(screen.getByText("101 / 100 words")).toBeInTheDocument();
    expect(screen.getByText(/1 word over the limit/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Review my claim" }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/at most 100 words/)).toBeInTheDocument();
  });

  it("only digits and a dot are kept in the amount, the date can't be in the future, certified shows its price", async () => {
    const user = userEvent.setup();
    renderUi(<Harness initial={full()}>{(p) => <StepClaim {...p} onNext={() => {}} onBack={() => {}} />}</Harness>);
    await user.type(screen.getByLabelText(/amount claimed/i), "$1,5a0.50");
    expect(screen.getByLabelText(/amount claimed/i)).toHaveValue("150.50");
    expect(screen.getByLabelText(/date of incident/i)).toHaveAttribute("max");
    expect(screen.getByRole("radio", { name: /Certified mail/ })).toHaveTextContent("+$20.00");
  });

  it("submits a complete claim", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderUi(<Harness initial={full()}>{(p) => <StepClaim {...p} strict onNext={onNext} onBack={() => {}} />}</Harness>);
    await user.click(screen.getByRole("radio", { name: /Property damage/ }));
    await user.type(screen.getByLabelText(/date of incident/i), "2026-01-15");
    await user.type(screen.getByLabelText(/amount claimed/i), "800");
    await user.click(screen.getByLabelText("Describe your claim", { selector: "textarea" }));
    await user.paste("They broke my fence.");
    await user.click(screen.getByRole("radio", { name: /No, not right now/ }));
    await user.click(screen.getByRole("radio", { name: /First class mail/ }));
    await user.click(screen.getByRole("button", { name: "Review my claim" }));
    expect(onNext).toHaveBeenCalled();
  });
});

const completeForm = (patch: Partial<IntakeFormData> = {}): IntakeFormData => ({
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
  claimDescription: "They took my money.",
  hasEvidenceToUpload: false,
  mailingPref: "certified",
  ...patch,
});

describe("StepReview & StepUpgradeMail", () => {
  it("summarises every section, prices the order, and edit buttons jump to the right step", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onSubmit = vi.fn();
    renderUi(<StepReview form={completeForm()} onBack={() => {}} onSubmit={onSubmit} onEditStep={onEdit} />);
    expect(screen.getByText("Acme LLC")).toBeInTheDocument();
    expect(screen.getByText("Sacramento County, CA")).toBeInTheDocument();
    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
    const order = screen.getByRole("region", { name: "Order preview" });
    expect(within(order).getByText("$89.00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Your information" }));
    await user.click(screen.getByRole("button", { name: "Edit Defendant" }));
    await user.click(screen.getByRole("button", { name: "Edit Claim details" }));
    expect(onEdit.mock.calls.map((c) => c[0])).toEqual([1, 2, 4]);

    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("first class is $69 and shows 'Included'; Activation Hero shows the platform", () => {
    const { unmount } = renderUi(<StepReview form={completeForm({ mailingPref: "first_class" })} onBack={() => {}} onSubmit={() => {}} onEditStep={() => {}} />);
    const order = screen.getByRole("region", { name: "Order preview" });
    expect(within(order).getByText("Included")).toBeInTheDocument();
    expect(within(order).getAllByText("$69.00").length).toBeGreaterThan(0);
    unmount();
    renderUi(<StepReview form={{ ...completeForm(), service: "activation_hero", platformName: "DoorDash, Inc.", platformAccountEmail: "a@b.co" }} onBack={() => {}} onSubmit={() => {}} onEditStep={() => {}} />);
    expect(screen.getByText("DoorDash, Inc.")).toBeInTheDocument();
    expect(screen.getByText("Account email")).toBeInTheDocument();
  });

  it("upgrade step offers certified (+$20) or keeping first class", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onSkip = vi.fn();
    renderUi(<StepUpgradeMail onAdd={onAdd} onSkip={onSkip} />);
    expect(screen.getByText("+$20.00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add certified mail" }));
    await user.click(screen.getByRole("button", { name: "Keep first class" }));
    expect(onAdd).toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalled();
  });
});

describe("StepPayment", () => {
  async function fillValidCard(user: ReturnType<typeof userEvent.setup>, which: "ok" | "declined" = "ok") {
    await user.click(screen.getByRole("button", { name: which === "ok" ? "4242 4242 4242 4242" : "4000 0000 0000 0002" }));
    await user.type(screen.getByLabelText("Expiry"), "1230");
    await user.type(screen.getByLabelText("CVC"), "123");
    await user.click(screen.getByRole("checkbox", { name: /I agree to the/ }));
  }

  it("requires valid card details and agreement to the terms", async () => {
    const user = userEvent.setup();
    renderUi(<StepPayment strict form={completeForm()} draftId={null} onBack={() => {}} />);
    await user.click(screen.getByRole("button", { name: /pay \$89\.00/i }));
    expect(screen.getByText("Enter a valid card number.")).toBeInTheDocument();
    expect(screen.getByText("Please agree to the terms to continue.")).toBeInTheDocument();
    expect(demoStore.getSnapshot()!.cases).toHaveLength(seed.cases.length);
  });

  it("applies a coupon (and rejects a bad one), changing the Pay button total", async () => {
    const user = userEvent.setup();
    renderUi(<StepPayment strict form={completeForm()} draftId={null} onBack={() => {}} />);
    await user.type(screen.getByLabelText("Coupon code"), "nope");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("alert")).toHaveTextContent("isn't valid");

    await user.clear(screen.getByLabelText("Coupon code"));
    await user.type(screen.getByLabelText("Coupon code"), "hero10{Enter}");
    expect(screen.getByText(/HERO10 applied/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pay \$80\.10/i })).toBeInTheDocument();
  });

  it("a declined card shows the error and creates no case", async () => {
    const user = userEvent.setup();
    renderUi(<StepPayment strict form={completeForm()} draftId={null} onBack={() => {}} />);
    await fillValidCard(user, "declined");
    await user.click(screen.getByRole("button", { name: /pay \$89\.00/i }));
    expect(await screen.findByText(/card was declined/i)).toBeInTheDocument();
    expect(demoStore.getSnapshot()!.cases).toHaveLength(seed.cases.length);
  });

  it("success creates the case; signed-in customers go to it, signed-out ones to signup", async () => {
    const user = userEvent.setup();
    signIn();
    const { unmount } = renderUi(<StepPayment strict form={completeForm()} draftId="draft-sc-1" onBack={() => {}} />);
    await fillValidCard(user);
    await user.click(screen.getByRole("button", { name: /pay \$89\.00/i }));
    expect(await screen.findByRole("heading", { name: "Payment received" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to my case" })).toHaveAttribute("href", "/dashboard/cases/case-sc-20932");
    expect(demoStore.getSnapshot()!.drafts.some((d) => d.id === "draft-sc-1")).toBe(false);
    unmount();

    signOut();
    renderUi(<StepPayment strict form={completeForm()} draftId={null} onBack={() => {}} />);
    await fillValidCard(user);
    await user.click(screen.getByRole("button", { name: /pay \$89\.00/i }));
    const link = await screen.findByRole("link", { name: "Set up my account" });
    expect(link.getAttribute("href")).toContain("/signup?email=alex.rivera%40example.com&paid=1");
  });
});

describe("IntakeFlow — end to end in the component layer", () => {
  it("walks Small Claims from 'Your information' to a created case, saving a draft along the way", async () => {
    const user = userEvent.setup();
    signIn();
    renderUi(<IntakeFlow service="small_claims" />);

    // 1 — prefilled
    expect(await screen.findByRole("heading", { name: "Your information" })).toBeInTheDocument();
    expect(screen.getByLabelText("Full legal name")).toHaveValue("Alex Rivera");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // 2 — defendant (existing business, in Elk Grove)
    expect(await screen.findByRole("heading", { name: "Defendant information" })).toBeInTheDocument();
    expect(demoStore.getSnapshot()!.drafts.some((d) => d.currentStep === "defendant_information" && d.form?.claimantName === "Alex Rivera")).toBe(true);
    await user.type(screen.getByRole("combobox", { name: /legal name of the business/i }), "brightside");
    await user.click(screen.getByRole("option", { name: /Brightside/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // 3 — filing court: both ZIPs are in Sacramento County
    expect(await screen.findByRole("heading", { name: "Filing court" })).toBeInTheDocument();
    const card = await screen.findByRole("radio", { name: /Same county for both addresses/ });
    await user.click(card);
    expect(screen.getByText("Selected: Sacramento County, CA")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // 4 — claim
    expect(await screen.findByRole("heading", { name: "Your claim" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Broken contract/ }));
    await user.type(screen.getByLabelText(/date of incident/i), "2026-08-01");
    await user.type(screen.getByLabelText(/amount claimed/i), "1850");
    await user.click(screen.getByLabelText("Describe your claim", { selector: "textarea" }));
    await user.paste("Paid a deposit, no work done.");
    await user.click(screen.getByRole("radio", { name: /No, not right now/ }));
    await user.click(screen.getByRole("radio", { name: /First class mail/ }));
    await user.click(screen.getByRole("button", { name: "Review my claim" }));

    // 5 — review, then edit step 1 and come back via Continue
    expect(await screen.findByRole("heading", { name: "Review your claim" })).toBeInTheDocument();
    expect(screen.getByText("Brightside Remodeling LLC")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // 6 — first class → upgrade offer; keep it
    expect(await screen.findByRole("heading", { name: "Upgrade to certified mail?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep first class" }));

    // 7 — pay
    expect(await screen.findByRole("heading", { name: "Payment" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "4242 4242 4242 4242" }));
    await user.type(screen.getByLabelText("Expiry"), "1230");
    await user.type(screen.getByLabelText("CVC"), "123");
    await user.click(screen.getByRole("checkbox", { name: /I agree to the/ }));
    await user.click(screen.getByRole("button", { name: /pay \$69\.00/i }));
    expect(await screen.findByRole("heading", { name: "Payment received" })).toBeInTheDocument();

    const state = demoStore.getSnapshot()!;
    expect(state.cases[0]).toMatchObject({ referenceCode: "SC-20932", status: "paid_pending_letter_review", amountCents: 185_000 });
    expect(state.cases[0]!.defendant.name).toBe("Brightside Remodeling LLC");
    expect(state.drafts.filter((d) => d.form?.defendantLegalName === "Brightside Remodeling LLC")).toHaveLength(0);
  });

  it("the stepper shows progress, lets you go back to completed steps, and Back keeps your answers", async () => {
    const user = userEvent.setup();
    signIn();
    renderUi(<IntakeFlow service="small_claims" />);
    await screen.findByRole("heading", { name: "Your information" });
    const nav = screen.getByRole("navigation", { name: "Application progress" });
    expect(within(nav).getAllByRole("listitem")).toHaveLength(6);
    expect(within(nav).getAllByRole("button")[0]).toBeDisabled();

    await user.clear(screen.getByLabelText("Full legal name"));
    await user.type(screen.getByLabelText("Full legal name"), "Alexandra Rivera");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "Defendant information" });
    expect(within(nav).getAllByRole("listitem")[1]).toHaveAttribute("aria-current", "step");

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByLabelText("Full legal name")).toHaveValue("Alexandra Rivera");
  });

  it("Activation Hero skips Filing court when the county can be detected", async () => {
    const user = userEvent.setup();
    signIn();
    renderUi(<IntakeFlow service="activation_hero" />);
    await screen.findByRole("heading", { name: "Your information" });
    expect(within(screen.getByRole("navigation", { name: "Application progress" })).getAllByRole("listitem")).toHaveLength(5);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.type(await screen.findByRole("combobox", { name: "Platform" }), "uber");
    await user.click(screen.getByRole("option", { name: /^Uber Technologies, Inc\.$/ }));
    await user.click(screen.getByRole("checkbox", { name: /same as my contact information/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Your claim" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /filing court/i })).not.toBeInTheDocument();
  });

  it("Activation Hero falls back to a county search when the ZIP isn't recognised", async () => {
    const user = userEvent.setup();
    renderUi(<IntakeFlow service="activation_hero" />);
    await screen.findByRole("heading", { name: "Your information" });
    await user.type(screen.getByLabelText("Full legal name"), "Pat Doe");
    await user.type(screen.getByLabelText(/best email/i), "pat@example.com");
    await user.type(screen.getByLabelText(/best phone/i), "5555550100");
    await user.type(screen.getByLabelText("Street address"), "1 Nowhere Rd");
    await user.type(screen.getByLabelText("City"), "Smalltown");
    await user.selectOptions(screen.getByLabelText("State"), "MT");
    await user.type(screen.getByLabelText("ZIP code"), "59001");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.type(await screen.findByRole("combobox", { name: "Platform" }), "lyft");
    await user.click(screen.getByRole("option", { name: /Lyft/ }));
    await user.type(screen.getByLabelText("Account email"), "pat@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Help us locate your county courthouse" })).toBeInTheDocument();
    const search = screen.getByRole("textbox", { name: /search by county/i });
    await user.clear(search);
    await user.type(search, "sacra");
    await user.click(await screen.findByRole("button", { name: "Sacramento County, CA" }));
    expect(screen.getByText("Selected: Sacramento County, CA")).toBeInTheDocument();
  });

  it("resumes a saved draft at the step it stopped on, with its answers", async () => {
    window.history.replaceState(null, "", "/activationhero?resume=draft-ah-1");
    signIn();
    renderUi(<IntakeFlow service="activation_hero" />);
    expect(await screen.findByRole("heading", { name: "Review your claim" })).toBeInTheDocument();
    expect(screen.getByText("DoorDash, Inc.")).toBeInTheDocument();
    expect(screen.getByText("Sacramento County, CA")).toBeInTheDocument();
    window.history.replaceState(null, "", "/");
  });

  it("surfaces a failed save with Retry / Continue anyway", async () => {
    const { repository } = await import("@/lib/data/repository");
    const user = userEvent.setup();
    signIn();
    renderUi(<IntakeFlow service="small_claims" />);
    await screen.findByRole("heading", { name: "Your information" });
    repository.failNextRequest();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/something went wrong/i);

    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("heading", { name: "Defendant information" })).toBeInTheDocument();
  });
});

describe("IntakeFlow — default (autofilled, non-blocking) mode", () => {
  beforeEach(() => {
    setStrict(false);
    window.history.replaceState(null, "", "/smallclaimshero?new=1");
  });

  it("every step is pre-populated, so Continue all the way through creates a case", async () => {
    const user = userEvent.setup();
    renderUi(<IntakeFlow service="small_claims" />);

    expect(await screen.findByLabelText("Full legal name")).toHaveValue("Alex Rivera");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Defendant information" })).toBeInTheDocument();
    expect(screen.getByText("Address on file")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Filing court" })).toBeInTheDocument();
    expect(await screen.findByText("Selected: Sacramento County, CA")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Your claim" })).toBeInTheDocument();
    expect(screen.getByLabelText(/amount claimed/i)).toHaveValue("1850");
    await user.click(screen.getByRole("button", { name: "Review my claim" }));

    expect(await screen.findByRole("heading", { name: "Review your claim" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await user.click(await screen.findByRole("button", { name: "Keep first class" }));

    expect(await screen.findByLabelText("Card number")).toHaveValue("4242 4242 4242 4242");
    expect(screen.getByRole("checkbox", { name: /I agree to the/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: /pay \$69\.00/i }));
    expect(await screen.findByRole("heading", { name: "Payment received" })).toBeInTheDocument();
    expect(demoStore.getSnapshot()!.cases[0]).toMatchObject({ referenceCode: "SC-20932", amountCents: 185_000 });
  });

  it("does not block on empty or invalid fields", async () => {
    const user = userEvent.setup();
    renderUi(<IntakeFlow service="small_claims" />);
    const name = await screen.findByLabelText("Full legal name");
    await user.clear(name);
    await user.clear(screen.getByLabelText(/best email/i));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "Defendant information" })).toBeInTheDocument();
    expect(screen.queryByText("Full legal name is required.")).not.toBeInTheDocument();
  });

  it("Activation Hero is autofilled too and skips Filing court", async () => {
    window.history.replaceState(null, "", "/activationhero?new=1");
    const user = userEvent.setup();
    renderUi(<IntakeFlow service="activation_hero" />);
    await screen.findByRole("heading", { name: "Your information" });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("combobox", { name: "Platform" })).toHaveValue("Uber Technologies, Inc.");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "Your claim" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /No reason given/ })).toHaveAttribute("aria-checked", "true");
  });

  it("an empty case still becomes a valid case (no crash on blank fields)", async () => {
    const { buildCaseFromIntake } = await import("@/lib/domain/intake-case");
    const c = buildCaseFromIntake(emptyIntakeForm("small_claims"), { existingRefs: [], now: new Date("2026-10-09T12:00:00Z") });
    expect(c.defendant.name).toBe("Unnamed defendant");
    expect(c.incidentDate).toBe("2026-10-09T12:00:00.000Z");
    expect(c.amountCents).toBe(0);
  });
});
