// Court-filing (phase 3) step catalogue and the form each step type asks the customer to fill in.
// Lives in the domain so the UI form and the transition validator can never disagree.

import type { County, CourtTask, TaskType } from "./types";

export type TaskFieldKind = "text" | "textarea" | "date" | "time" | "checkbox";

export interface TaskField {
  name: string;
  label: string;
  kind: TaskFieldKind;
  required: boolean;
  placeholder?: string;
  hint?: string;
}

export const TASK_FORMS: Record<TaskType, TaskField[]> = {
  form_online: [
    {
      name: "confirmationNumber",
      label: "Court confirmation number",
      kind: "text",
      required: true,
      placeholder: "e.g. SC-2026-004417",
      hint: "Shown on the court's confirmation page after you file.",
    },
    {
      name: "attest",
      label: "I filed the Statement of Claim on the court's website",
      kind: "checkbox",
      required: true,
    },
  ],
  fee_online: [
    {
      name: "amountPaid",
      label: "Amount paid (USD)",
      kind: "text",
      required: true,
      placeholder: "75.00",
    },
    {
      name: "receiptNumber",
      label: "Receipt number",
      kind: "text",
      required: true,
      placeholder: "e.g. R-99231",
    },
  ],
  serve_mail: [
    {
      name: "trackingNumber",
      label: "Certified mail tracking number",
      kind: "text",
      required: true,
      placeholder: "e.g. 9407 1000 0000 0000 0000 00",
    },
    { name: "mailedOn", label: "Date mailed", kind: "date", required: true },
  ],
  court_date: [
    { name: "courtDate", label: "Hearing date", kind: "date", required: true },
    { name: "courtTime", label: "Hearing time", kind: "time", required: true },
    {
      name: "courtroom",
      label: "Courtroom / department",
      kind: "text",
      required: false,
      placeholder: "Optional",
    },
  ],
  hearing: [
    {
      name: "prepared",
      label: "I've gathered my evidence and reviewed the hearing checklist",
      kind: "checkbox",
      required: true,
    },
    {
      name: "notes",
      label: "Anything you want us to know before the hearing?",
      kind: "textarea",
      required: false,
      placeholder: "Optional",
    },
  ],
};

export function validateTaskFields(
  type: TaskType,
  fields: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of TASK_FORMS[type]) {
    const value = (fields[field.name] ?? "").trim();
    if (field.required && (value === "" || (field.kind === "checkbox" && value !== "true"))) {
      errors[field.name] =
        field.kind === "checkbox" ? "Please confirm to continue." : `${field.label} is required.`;
      continue;
    }
    if (field.name === "amountPaid" && value !== "" && !/^\d+(\.\d{1,2})?$/.test(value)) {
      errors[field.name] = "Enter an amount like 75 or 75.00.";
    }
  }
  return errors;
}

export function createCourtTasks(county: County): CourtTask[] {
  const base: Omit<CourtTask, "id" | "order" | "status">[] = [
    {
      title: "File your Statement of Claim online",
      type: "form_online",
      instructions: `Complete the small claims form on the ${county.name}, ${county.state} court website, then enter the confirmation number here.`,
      externalUrl: "https://example.com/court/e-file",
      submission: null,
      reviewNote: null,
      approvedAt: null,
    },
    {
      title: "Pay the court filing fee",
      type: "fee_online",
      instructions: "Pay the filing fee online and enter the receipt details so we can verify it.",
      externalUrl: "https://example.com/court/pay",
      submission: null,
      reviewNote: null,
      approvedAt: null,
    },
    {
      title: "Serve the defendant by certified mail",
      type: "serve_mail",
      instructions:
        "Mail the stamped court papers to the defendant by certified mail and enter the tracking number.",
      externalUrl: null,
      submission: null,
      reviewNote: null,
      approvedAt: null,
    },
    {
      title: "Enter your court date",
      type: "court_date",
      instructions: "The court will send you a hearing date. Enter it here so we can keep track of it.",
      externalUrl: null,
      submission: null,
      reviewNote: null,
      approvedAt: null,
    },
    {
      title: "Prepare for your hearing",
      type: "hearing",
      instructions:
        "Bring your evidence, a copy of your demand letter and photo ID. Confirm when you're ready.",
      externalUrl: null,
      submission: null,
      reviewNote: null,
      approvedAt: null,
    },
  ];

  return base.map((task, index) => ({
    ...task,
    id: `task-${index + 1}`,
    order: index + 1,
    status: index === 0 ? "unlocked" : "locked",
  }));
}
