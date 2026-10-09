import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { DemoNextStep } from "@/components/demo/demo-next-step";
import { freshStore, renderUi, storedCase } from "./render";

beforeEach(() => freshStore());
const now = () => new Date();

describe("DemoNextStep (prototype shortcut)", () => {
  it("appears when our team has something to do, and does it", async () => {
    const user = userEvent.setup();
    renderUi(<DemoNextStep c={storedCase("ah-letter-in-progress")} now={now()} />);
    expect(screen.getByRole("region", { name: "Prototype shortcut" })).toHaveTextContent(/handled by our team/i);
    await user.click(screen.getByRole("button", { name: /Draft the letter/ }));
    await waitFor(() => expect(storedCase("ah-letter-in-progress").status).toBe("letter_signature_sent"));
  });

  it("offers an alternative when a court step is under review (approve, or send it back)", async () => {
    const user = userEvent.setup();
    renderUi(<DemoNextStep c={storedCase("ah-court-in-review")} now={now()} />);
    expect(screen.getByRole("button", { name: /Approve the submitted step/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Reject the submitted step/ }));
    await waitFor(() => expect(storedCase("ah-court-in-review").tasks.some((t) => t.status === "rejected")).toBe(true));
  });

  it("offers to skip ahead while the 21-day window runs, and closes it", async () => {
    const user = userEvent.setup();
    renderUi(<DemoNextStep c={storedCase("ah-waiting-window")} now={now()} />);
    expect(screen.getByText(/21 days to respond/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Skip ahead 21 days/ }));
    await waitFor(() => expect(new Date(storedCase("ah-waiting-window").mailing!.responseWindowEndsAt).getTime()).toBeLessThan(Date.now()));
  });

  it("renders nothing when the customer is the one who has to act, or the case is closed or the window has closed", () => {
    for (const id of ["ah-awaiting-signature", "ah-ready-to-send", "ah-outcome-needed", "ah-closed-court", "ah-get-organized"]) {
      const { container, unmount } = renderUi(<DemoNextStep c={storedCase(id)} now={now()} />);
      expect(container.querySelector('[aria-label="Prototype shortcut"]'), id).toBeNull();
      unmount();
    }
  });
});
