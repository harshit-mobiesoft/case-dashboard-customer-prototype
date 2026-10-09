import { setStrict } from "@/lib/domain/strict";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RevisionForm } from "@/components/review/revision-form";
import { SignDialog } from "@/components/review/sign-dialog";
import { renderUi } from "./render";

// These tests cover the validation rules, so they run in strict mode (the app default never blocks).
beforeEach(() => setStrict(true));

describe("SignDialog", () => {
  function setup(overrides: Partial<React.ComponentProps<typeof SignDialog>> = {}) {
    const onSign = vi.fn();
    renderUi(
      <SignDialog open onOpenChange={() => {}} legalName="Alex Rivera" pending={false} error={null} onSign={onSign} {...overrides} />,
    );
    return { onSign, user: userEvent.setup() };
  }

  it("is an accessible, labelled dialog", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Sign your demand letter" })).toBeInTheDocument();
  });

  it("is pre-filled and pre-agreed, so one click signs", async () => {
    const { onSign, user } = setup();
    expect(screen.getByLabelText(/full legal name/i)).toHaveValue("Alex Rivera");
    expect(screen.getByRole("checkbox")).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Sign letter" }));
    expect(onSign).toHaveBeenCalledWith("Alex Rivera");
  });

  it("blocks signing if the name is changed to something else or consent is removed", async () => {
    const { onSign, user } = setup();
    await user.clear(screen.getByLabelText(/full legal name/i));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Sign letter" }));
    expect(onSign).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(2);

    await user.type(screen.getByLabelText(/full legal name/i), "Alex Riviera");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Sign letter" }));
    expect(onSign).not.toHaveBeenCalled();
  });

  it("signs with the typed name (case/space tolerant)", async () => {
    const { onSign, user } = setup();
    await user.clear(screen.getByLabelText(/full legal name/i));
    await user.type(screen.getByLabelText(/full legal name/i), "alex  rivera");
    await user.click(screen.getByRole("button", { name: "Sign letter" }));
    expect(onSign).toHaveBeenCalledWith("alex  rivera");
  });

  it("shows server errors and a busy state", () => {
    setup({ error: "Network down", pending: true });
    expect(screen.getByText("Network down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /signing/i })).toBeDisabled();
  });
});

describe("RevisionForm", () => {
  function setup() {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderUi(<RevisionForm pending={false} error={null} onSubmit={onSubmit} onCancel={onCancel} />);
    return { onSubmit, onCancel, user: userEvent.setup() };
  }

  it("keeps submit disabled until there is a reason and 10+ characters of detail", async () => {
    const { onSubmit, user } = setup();
    const submit = screen.getByRole("button", { name: "Submit edit request" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Wrong amount" }));
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/tell us more/i), "too short");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/tell us more/i), "!!");
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({ reasons: ["Wrong amount"], details: "too short!!" });
  });

  it("toggles reason chips with aria-pressed", async () => {
    const { user } = setup();
    const chip = screen.getByRole("button", { name: "Wrong amount" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("counts characters toward the minimum and can be closed", async () => {
    const { onCancel, user } = setup();
    await user.type(screen.getByLabelText(/tell us more/i), "hello");
    expect(screen.getByText("5 / 10 min characters")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close edit request" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows server errors", () => {
    renderUi(<RevisionForm pending={false} error="Network down" onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Network down");
  });
});
