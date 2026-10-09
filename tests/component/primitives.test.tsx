import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StatusBanner } from "@/components/case/status-banner";
import { StepTimeline } from "@/components/case/step-timeline";
import { ResponseWindowCard } from "@/components/case/response-window-card";
import { CaseCard } from "@/components/dashboard/case-card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getLetterSteps } from "@/lib/domain/steps";
import { resolveDropboxBar, resolveStatusBar } from "@/lib/domain/status";
import { NOW, seedCase } from "../unit/helpers";

describe("Button", () => {
  it("is disabled and aria-busy while loading", () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});

describe("TextField", () => {
  it("wires label, error and hint for assistive tech", () => {
    render(<TextField label="Name" error="Required" hint="Your name" />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/Required/);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });
});

describe("StatusBanner", () => {
  it("shows the whose-turn title and a CTA link to the right sub-route", () => {
    const c = seedCase("sc-awaiting-signature");
    render(<StatusBanner caseId={c.id} info={resolveStatusBar(c, NOW)} />);
    expect(screen.getByText(/review and sign your letter/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review and sign/i })).toHaveAttribute("href", `/dashboard/cases/${c.id}/review`);
    expect(screen.getByRole("region", { name: "Case status" })).toHaveAttribute("data-bucket", "waiting_on_client");
  });

  it("renders no link when there is nothing for the customer to click", () => {
    const c = seedCase("sc-waiting-window");
    render(<StatusBanner caseId={c.id} info={resolveStatusBar(c, NOW)} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the secondary Dropbox strip", () => {
    const c = seedCase("sc-letter-in-progress");
    const info = resolveDropboxBar(c, resolveStatusBar(c, NOW))!;
    render(<StatusBanner caseId={c.id} info={info} secondary />);
    expect(screen.getByRole("link", { name: /connect dropbox/i })).toHaveAttribute("href", `/dashboard/cases/${c.id}/documents`);
  });
});

describe("StepTimeline", () => {
  const steps = getLetterSteps(seedCase("sc-ready-to-send"), (iso) => iso.slice(0, 10));

  it("exposes state to screen readers and marks the current step", () => {
    render(<StepTimeline label="Demand letter steps" steps={steps} />);
    const list = screen.getByRole("list", { name: "Demand letter steps" });
    expect(list).toBeInTheDocument();
    const current = list.querySelector('[aria-current="step"]');
    expect(current).toHaveAttribute("data-step", "sent");
    expect(screen.getAllByText(/Completed:/).length).toBeGreaterThan(0);
  });

  it("fires the command action and shows progress while pending", async () => {
    const onCommand = vi.fn();
    const { rerender } = render(<StepTimeline label="x" steps={steps} onCommand={onCommand} />);
    await userEvent.click(screen.getByRole("button", { name: /send letter/i }));
    expect(onCommand).toHaveBeenCalledWith("send_mailing");

    rerender(<StepTimeline label="x" steps={steps} onCommand={onCommand} pendingCommand />);
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });

  it("renders extra content and reviewer notes", () => {
    render(
      <StepTimeline
        label="x"
        steps={[{ id: "a", label: "A", icon: "file", state: "active", note: { tone: "danger", text: "Fix the receipt" } }]}
        renderExtra={() => <p>extra!</p>}
      />,
    );
    expect(screen.getByText("Fix the receipt")).toBeInTheDocument();
    expect(screen.getByText("extra!")).toBeInTheDocument();
  });
});

describe("CaseCard", () => {
  it("shows the production status badge, reference and a single link to the case", () => {
    const c = seedCase("sc-awaiting-signature");
    render(<CaseCard c={c} now={NOW} emphasized />);
    const link = screen.getByRole("link", { name: /open case against pinecrest/i });
    expect(link).toHaveAttribute("href", `/dashboard/cases/${c.id}`);
    expect(screen.getByText("Awaiting Signature")).toBeInTheDocument();
    expect(screen.getByText("Case #SC-20702")).toBeInTheDocument();
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("View case")).toBeInTheDocument();
  });

  it("flags Activation Hero cases and shows Phase 2 once mailed", () => {
    render(<CaseCard c={seedCase("ah-outcome-needed")} now={NOW} emphasized />);
    expect(screen.getByRole("img", { name: "Activation Hero case" })).toBeInTheDocument();
    expect(screen.getByText("Mailed")).toBeInTheDocument();
    expect(screen.getByText("Phase 2")).toBeInTheDocument();
  });

  it("is de-emphasised for closed cases", () => {
    render(<CaseCard c={seedCase("sc-closed-settled")} now={NOW} />);
    expect(screen.queryByText("View case")).not.toBeInTheDocument();
    expect(screen.getAllByText("Closed").length).toBeGreaterThan(0);
  });
});

describe("ResponseWindowCard", () => {
  it("shows days passed (matching the filling bar) and the deadline while open", () => {
    render(<ResponseWindowCard c={seedCase("sc-waiting-window")} now={NOW} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("/ 21 days passed")).toBeInTheDocument();
    expect(screen.queryByText(/days left/)).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Response window elapsed" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /mark outcome/i })).not.toBeInTheDocument();
  });

  it("goes urgent in the last 3 days and offers an early outcome link", () => {
    render(<ResponseWindowCard c={seedCase("ah-window-urgent")} now={NOW} />);
    expect(screen.getByRole("region", { name: "Response window" })).toHaveAttribute("data-urgent", "true");
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mark outcome early/i })).toBeInTheDocument();
  });

  it("switches to a mark-outcome action once closed, and hides for non-mailed cases", () => {
    const { unmount } = render(<ResponseWindowCard c={seedCase("ah-outcome-needed")} now={NOW} />);
    expect(screen.getByRole("region", { name: "Response window" })).toHaveAttribute("data-expired", "true");
    expect(screen.getByRole("link", { name: /mark outcome/i })).toHaveAttribute("href", "/dashboard/cases/ah-outcome-needed/outcome");
    unmount();
    const { container } = render(<ResponseWindowCard c={seedCase("sc-awaiting-signature")} now={NOW} />);
    expect(container).toBeEmptyDOMElement();
  });
});
