import { setStrict } from "@/lib/domain/strict";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { EvidenceDialog } from "@/components/documents/evidence-dialog";
import { DocumentsView } from "@/components/documents/documents-view";
import { OutcomeView } from "@/components/outcome/outcome-view";
import { QuestionnaireView } from "@/components/questionnaire/questionnaire-view";
import { SettingsView } from "@/components/settings/settings-view";
import { TaskForm } from "@/components/court-filing/task-form";
import { ToastProvider } from "@/components/ui/toast";
import { demoStore } from "@/lib/data/store";
import { seed } from "../unit/helpers";
import { freshStore, push, renderUi, storedCase } from "./render";

beforeEach(() => {
  setStrict(true);
  freshStore();
  push.mockClear();
});

const now = () => new Date();

describe("DashboardView", () => {
  it("groups cases into open / draft / closed", async () => {
    renderUi(<DashboardView />);
    expect(await screen.findByRole("heading", { name: "My cases" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /open cases/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /draft cases/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /closed cases/i })).toBeInTheDocument();

    // "Your turn" cases are sorted ahead of "our turn" / waiting ones.
    const open = screen.getByRole("heading", { name: /open cases/i }).closest("section")!;
    const first = within(open).getAllByRole("link")[0]!;
    expect(first).toHaveAccessibleName(/RideNow|Pinecrest|Delgado|DashGo|PixelCraft|Harbor/);
  });

  it("searches by defendant and shows a no-match state with a way out", async () => {
    const user = userEvent.setup();
    renderUi(<DashboardView />);
    const search = await screen.findByRole("searchbox", { name: "Search cases" });

    await user.type(search, "doordash");
    expect(screen.getAllByRole("link", { name: /open case against/i })).toHaveLength(1);

    await user.clear(search);
    await user.type(search, "zzzz-nothing");
    expect(screen.getByText("No cases match your filters")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("link", { name: /open case against/i })).toHaveLength(9);
  });

  it("filters by service and by view", async () => {
    const user = userEvent.setup();
    renderUi(<DashboardView />);
    await screen.findByRole("heading", { name: "My cases" });

    await user.selectOptions(screen.getByLabelText("Service"), "activation_hero");
    const links = screen.getAllByRole("link", { name: /open case against/i });
    expect(links).toHaveLength(5);

    await user.selectOptions(screen.getByLabelText("Service"), "small_claims");
    expect(screen.getAllByRole("link", { name: /open case against/i })).toHaveLength(4);
    expect(screen.getByRole("heading", { name: /draft cases/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Service"), "all");
    await user.selectOptions(screen.getByLabelText("Show"), "closed");
    expect(screen.getAllByRole("link", { name: /open case against/i })).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: /open cases/i })).not.toBeInTheDocument();
  });

  it("cancels a draft after confirming, and keeps it if you back out", async () => {
    const user = userEvent.setup();
    renderUi(<DashboardView />);
    await screen.findByRole("heading", { name: /draft cases/i });

    await user.click(screen.getByRole("button", { name: "Cancel Small Claims Hero draft" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));
    expect(demoStore.getSnapshot()?.drafts).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Cancel Small Claims Hero draft" }));
    await user.click(screen.getByRole("button", { name: "Yes, cancel it" }));
    await waitFor(() => expect(demoStore.getSnapshot()?.drafts).toHaveLength(1));
  });

  it("shows the empty state when there is nothing at all", async () => {
    demoStore.update((s) => ({ ...s, cases: [], drafts: [] }));
    renderUi(<DashboardView />);
    expect(await screen.findByText("No cases yet")).toBeInTheDocument();
  });
});

describe("OutcomeView", () => {
  it("settled: needs a resolution, then closes the case", async () => {
    const user = userEvent.setup();
    renderUi(<OutcomeView c={storedCase("sc-waiting-window")} now={now()} />);
    await user.click(screen.getByRole("button", { name: /we already settled/i }));
    expect(screen.getByRole("button", { name: "Close my case" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Full payment" }));
    await user.click(screen.getByRole("button", { name: "Close my case" }));
    await waitFor(() => expect(storedCase("sc-waiting-window").status).toBe("closed"));
  });

  it("warns before proceeding while the window is still open; 'Wait' changes nothing", async () => {
    const user = userEvent.setup();
    renderUi(<OutcomeView c={storedCase("sc-waiting-window")} now={now()} />);
    await user.click(screen.getByRole("button", { name: /^no response/i }));
    await user.click(screen.getByRole("button", { name: /proceed to court filing/i }));

    const dialog = await screen.findByRole("dialog", { name: /before the window closes/i });
    expect(dialog).toHaveTextContent(/14 days remaining/);
    await user.click(within(dialog).getByRole("button", { name: "Wait" }));
    expect(storedCase("sc-waiting-window").status).toBe("mailed");
  });

  it("'Proceed anyway' unlocks court filing and navigates to the case", async () => {
    const user = userEvent.setup();
    renderUi(<OutcomeView c={storedCase("sc-waiting-window")} now={now()} />);
    await user.click(screen.getByRole("button", { name: /^no response/i }));
    await user.click(screen.getByRole("button", { name: /proceed to court filing/i }));
    await user.click(await screen.findByRole("button", { name: "Proceed anyway" }));
    await waitFor(() => expect(storedCase("sc-waiting-window").status).toBe("phase2_unlocked"));
    expect(push).toHaveBeenCalledWith("/dashboard/cases/sc-waiting-window");
  });

  it("when the window has closed there is no warning; unsatisfactory needs an issue and a valid amount", async () => {
    const user = userEvent.setup();
    renderUi(<OutcomeView c={storedCase("ah-outcome-needed")} now={now()} />);
    expect(screen.getByText(/response window closed on/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /responded, but unsatisfactorily/i }));
    const proceed = screen.getByRole("button", { name: /proceed to court filing/i });
    expect(proceed).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "Offer too low" }));
    await user.type(screen.getByLabelText(/amount received/i), "abc");
    await user.click(proceed);
    expect(await screen.findByText(/enter an amount like/i)).toBeInTheDocument();
    expect(storedCase("ah-outcome-needed").status).toBe("mailed");

    await user.clear(screen.getByLabelText(/amount received/i));
    await user.type(screen.getByLabelText(/amount received/i), "$250.50");
    await user.click(proceed);
    await waitFor(() => expect(storedCase("ah-outcome-needed").status).toBe("phase2_unlocked"));
    expect(storedCase("ah-outcome-needed").outcome?.amountReceivedCents).toBe(25050);
  });

  it("is unavailable until the letter is mailed, and after an outcome exists", () => {
    const { unmount } = renderUi(<OutcomeView c={storedCase("sc-awaiting-signature")} now={now()} />);
    expect(screen.getByText("Not available yet")).toBeInTheDocument();
    unmount();
    renderUi(<OutcomeView c={storedCase("sc-closed-settled")} now={now()} />);
    expect(screen.getByText("The outcome is already recorded")).toBeInTheDocument();
  });
});

describe("TaskForm", () => {
  it("shows inline errors, then submits to the repository", async () => {
    const user = userEvent.setup();
    const c = storedCase("sc-court-needs-changes");
    const task = c.tasks.find((t) => t.status === "rejected")!;
    renderUi(<TaskForm caseId={c.id} task={task} />);

    await user.clear(screen.getByLabelText(/amount paid/i));
    await user.click(screen.getByRole("button", { name: /resubmit for review/i }));
    expect(screen.getByText(/amount paid \(usd\) is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/amount paid/i), "75.00");
    await user.click(screen.getByRole("button", { name: /resubmit for review/i }));
    await waitFor(() => expect(storedCase(c.id).tasks.find((t) => t.id === task.id)?.status).toBe("submitted"));
  });
});

describe("EvidenceDialog", () => {
  it("requires a title and only allows files once Dropbox is connected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi_fn();
    renderUi(
      <EvidenceDialog open onOpenChange={() => {}} initial={null} editing={false} dropboxConnected={false} pending={false} error={null} onSubmit={onSubmit} />,
    );
    expect(screen.getByLabelText("Choose files")).toBeDisabled();
    expect(screen.getByText(/connect your dropbox first/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add evidence" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Give this evidence a short title.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/title/i), "Receipt");
    await user.click(screen.getByRole("button", { name: "Add evidence" }));
    expect(onSubmit).toHaveBeenCalledWith({ title: "Receipt", type: "other", notes: "", files: [] });
  });

  it("prefills from a suggestion and lets you attach files when connected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi_fn();
    renderUi(
      <EvidenceDialog open onOpenChange={() => {}} initial={{ title: "Lease", type: "contract", notes: "" }} editing={false} dropboxConnected pending={false} error={null} onSubmit={onSubmit} />,
    );
    expect(screen.getByLabelText(/title/i)).toHaveValue("Lease");
    const input = document.getElementById("evidence-files") as HTMLInputElement;
    await user.upload(input, new File(["abc"], "lease.pdf", { type: "application/pdf" }));
    expect(screen.getByText(/lease\.pdf/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add evidence" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ files: [{ name: "lease.pdf", sizeBytes: 3 }] }));
  });
});

describe("DocumentsView", () => {
  it("connects Dropbox, adds evidence, then won't allow 'no evidence'", async () => {
    const user = userEvent.setup();
    const c = storedCase("sc-letter-in-progress");
    const { rerender } = renderUi(<DocumentsView c={c} profile={demoStore.getSnapshot()!.profile} now={now()} />);

    await user.click(screen.getByRole("button", { name: "Connect Dropbox" }));
    await waitFor(() => expect(storedCase(c.id).dropbox.connected).toBe(true));

    await user.click(screen.getByRole("button", { name: /^add evidence$/i }));
    await user.type(screen.getByLabelText(/title/i), "Contract");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add evidence" }));
    await waitFor(() => expect(storedCase(c.id).evidence).toHaveLength(1));

    rerender(
      <ToastProvider>
        <DocumentsView c={storedCase(c.id)} profile={demoStore.getSnapshot()!.profile} now={now()} />
      </ToastProvider>,
    );
    expect(screen.getByRole("checkbox", { name: /don't have any evidence/i })).toBeDisabled();
  });

  it("lists only the documents that exist so far, with a download button for each", () => {
    const c = storedCase("sc-ready-to-send");
    renderUi(<DocumentsView c={c} profile={demoStore.getSnapshot()!.profile} now={now()} />);
    expect(screen.getByRole("button", { name: "Download Intake summary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download Signed demand letter" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /certificate of mailing/i })).not.toBeInTheDocument();
  });

  it("is read-only once the case is closed", () => {
    renderUi(<DocumentsView c={storedCase("sc-closed-settled")} profile={demoStore.getSnapshot()!.profile} now={now()} />);
    expect(screen.queryByRole("button", { name: /^add evidence$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download Case summary" })).toBeInTheDocument();
  });
});

describe("QuestionnaireView", () => {
  it("is gated until the customer is organized", () => {
    renderUi(<QuestionnaireView c={storedCase("ah-get-organized")} />);
    expect(screen.getByText("Get organized first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get organized" })).toHaveAttribute("href", "/dashboard/cases/ah-get-organized/documents");
  });

  it("submits answered questions only (skips are omitted) and moves the case on", async () => {
    const user = userEvent.setup();
    demoStore.update((s) => ({
      ...s,
      cases: s.cases.map((c) => (c.id === "ah-get-organized" ? { ...c, hasEvidenceToUpload: false } : c)),
    }));
    renderUi(<QuestionnaireView c={storedCase("ah-get-organized")} />);
    const submit = screen.getByRole("button", { name: "Submit answers" });
    expect(submit).toBeDisabled();

    const q1 = screen.getByRole("group", { name: /passenger\/customer claim/i });
    await user.click(within(q1).getByRole("radio", { name: "No" }));
    const q2 = screen.getByRole("group", { name: /fail to investigate/i });
    await user.click(within(q2).getByRole("radio", { name: "Skip" }));
    expect(screen.getByText(/you skipped 1 question/i)).toBeInTheDocument();

    await user.click(submit);
    await waitFor(() => expect(storedCase("ah-get-organized").status).toBe("paid_pending_letter_review"));
    expect(storedCase("ah-get-organized").questionnaire?.answers).toEqual({ false_claim: false });
    expect(push).toHaveBeenCalledWith("/dashboard/cases/ah-get-organized");
  });

  it("says so when the questionnaire doesn't apply", () => {
    renderUi(<QuestionnaireView c={storedCase("sc-awaiting-signature")} />);
    expect(screen.getByText("No questionnaire for this case")).toBeInTheDocument();
  });
});

describe("SettingsView", () => {
  it("validates, enables Save only when dirty, and persists a valid change", async () => {
    const user = userEvent.setup();
    renderUi(<SettingsView />);
    const save = await screen.findByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    expect(screen.getByLabelText(/^phone/i)).toHaveValue("(555) 555-0142");

    const first = screen.getByLabelText(/first name/i);
    await user.clear(first);
    await user.click(save);
    expect(await screen.findByText("First name is required.")).toBeInTheDocument();
    expect(screen.getByText("Please fix the highlighted fields.")).toBeInTheDocument();

    await user.type(first, "Alexandra");
    await user.clear(screen.getByLabelText(/zip/i));
    await user.type(screen.getByLabelText(/zip/i), "123");
    await user.click(save);
    expect(await screen.findByText("Enter a 5-digit ZIP code.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/zip/i));
    await user.type(screen.getByLabelText(/zip/i), "95814");
    await user.click(save);
    await waitFor(() => expect(demoStore.getSnapshot()?.profile.firstName).toBe("Alexandra"));
  });

  it("keeps the login email read-only", async () => {
    renderUi(<SettingsView />);
    expect(await screen.findByRole("textbox", { name: /^email/i })).toBeDisabled();
  });
});

import { vi } from "vitest";
function vi_fn() {
  return vi.fn();
}
