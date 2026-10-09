import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskForm } from "@/components/court-filing/task-form";
import { EvidenceDialog } from "@/components/documents/evidence-dialog";
import { OutcomeView } from "@/components/outcome/outcome-view";
import { QuestionnaireView } from "@/components/questionnaire/questionnaire-view";
import { RevisionForm } from "@/components/review/revision-form";
import { SignDialog } from "@/components/review/sign-dialog";
import { SettingsView } from "@/components/settings/settings-view";
import { demoStore } from "@/lib/data/store";
import { freshStore, push, renderUi, storedCase } from "./render";

// Default mode: no form blocks a walkthrough; the app fills in sensible defaults.
beforeEach(() => {
  freshStore();
  push.mockClear();
});
const now = () => new Date();

describe("nothing blocks the way forward (default mode)", () => {
  it("sign dialog: pre-filled, and signs even if you clear everything", async () => {
    const user = userEvent.setup();
    const onSign = vi.fn();
    renderUi(<SignDialog open onOpenChange={() => {}} legalName="Alex Rivera" pending={false} error={null} onSign={onSign} />);
    await user.clear(screen.getByLabelText(/full legal name/i));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Sign letter" }));
    expect(onSign).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("edit request: submit is enabled with nothing filled in, and the hint says 'optional'", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderUi(<RevisionForm pending={false} error={null} onSubmit={onSubmit} onCancel={() => {}} />);
    expect(screen.getByText("(optional)")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Submit edit request" });
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({ reasons: [], details: "" });
  });

  it("questionnaire: submit is enabled with zero answers, and works even before 'getting organized'", async () => {
    const user = userEvent.setup();
    renderUi(<QuestionnaireView c={storedCase("ah-get-organized")} />);
    expect(screen.queryByText("Get organized first")).not.toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Submit answers" });
    expect(submit).toBeEnabled();
    await user.click(submit);
    await waitFor(() => expect(storedCase("ah-get-organized").status).toBe("paid_pending_letter_review"));
    expect(push).toHaveBeenCalledWith("/dashboard/cases/ah-get-organized");
  });

  it("outcome: 'Close my case' and 'Proceed to court filing' work with nothing selected, with no early-warning step", async () => {
    const user = userEvent.setup();
    const { unmount } = renderUi(<OutcomeView c={storedCase("ah-waiting-window")} now={now()} />);
    await user.click(screen.getByRole("button", { name: /responded, but unsatisfactorily/i }));
    await user.type(screen.getByLabelText(/amount received/i), "not money");
    const proceed = screen.getByRole("button", { name: /proceed to court filing/i });
    expect(proceed).toBeEnabled();
    await user.click(proceed);
    await waitFor(() => expect(storedCase("ah-waiting-window").status).toBe("phase2_unlocked"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount();

    renderUi(<OutcomeView c={storedCase("ah-window-urgent")} now={now()} />);
    await user.click(screen.getByRole("button", { name: /we already settled/i }));
    const close = screen.getByRole("button", { name: "Close my case" });
    expect(close).toBeEnabled();
    await user.click(close);
    await waitFor(() => expect(storedCase("ah-window-urgent").status).toBe("closed"));
  });

  it("court step: submits with an empty form", async () => {
    const user = userEvent.setup();
    const c = storedCase("ah-court-just-started");
    renderUi(<TaskForm caseId={c.id} task={c.tasks[0]!} />);
    await user.click(screen.getByRole("button", { name: /submit for review/i }));
    await waitFor(() => expect(storedCase(c.id).tasks[0]!.status).toBe("submitted"));
    expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
  });

  it("evidence dialog: no title needed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderUi(
      <EvidenceDialog open onOpenChange={() => {}} initial={null} editing={false} dropboxConnected pending={false} error={null} onSubmit={onSubmit} />,
    );
    await user.click(screen.getByRole("button", { name: "Add evidence" }));
    expect(onSubmit).toHaveBeenCalled();
    expect(screen.queryByText("Give this evidence a short title.")).not.toBeInTheDocument();
  });

  it("settings: saves even with an empty name or bad ZIP", async () => {
    const user = userEvent.setup();
    renderUi(<SettingsView />);
    const first = await screen.findByLabelText(/first name/i);
    await user.clear(first);
    await user.clear(screen.getByLabelText(/^zip/i));
    await user.type(screen.getByLabelText(/^zip/i), "1");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(demoStore.getSnapshot()?.profile.address.zip).toBe("1"));
    expect(screen.queryByText("First name is required.")).not.toBeInTheDocument();
  });
});
