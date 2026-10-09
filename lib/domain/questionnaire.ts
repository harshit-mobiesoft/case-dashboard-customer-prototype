export interface Question {
  key: string;
  text: string;
  category: string;
}

// Fixture standing in for GET /api/intake/ah-questionnaire (current wording from production).
export const QUESTIONS: Question[] = [
  {
    key: "default_tos_breach",
    category: "General",
    text: "Default: deactivation breaches the platform's anti-retaliation provisions in its own TOS.",
  },
  {
    key: "false_claim",
    category: "General",
    text: "Did the platform deactivate you based on a passenger/customer claim that you believe is false?",
  },
  {
    key: "no_investigation",
    category: "General",
    text: "Did the platform fail to investigate before acting on the claim (default)?",
  },
  {
    key: "reputation_harm",
    category: "General",
    text: "Did the platform repeat or rely on the false claim in a way that has hurt your reputation?",
  },
  {
    key: "retaliation",
    category: "General",
    text: "Were you deactivated shortly after reporting a safety issue, filing a complaint, or organizing other workers?",
  },
];

export function groupByCategory(questions: Question[]): { category: string; questions: Question[] }[] {
  const groups = new Map<string, Question[]>();
  for (const q of questions) groups.set(q.category, [...(groups.get(q.category) ?? []), q]);
  return Array.from(groups, ([category, qs]) => ({ category, questions: qs }));
}
