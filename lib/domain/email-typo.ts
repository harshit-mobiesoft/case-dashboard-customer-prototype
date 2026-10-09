// Catches the common "gmial.com" / "yaho.com" slips on an email address so we
// can ask "Did you mean ...?" before the customer submits. It only suggests; it
// never blocks, since the address may be correct (a real but unusual domain).

// Big consumer providers. A domain one edit away from one of these is almost
// always a typo of it. Short domains (aol.com, msn.com) are left out of the
// fuzzy match because they sit one edit from other real domains (aim.com).
const COMMON_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "comcast.net",
  "verizon.net",
  "sbcglobal.net",
  "protonmail.com",
];

// Typos the one-edit match can't reach, or ones for short domains.
const KNOWN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.om": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "iclod.com": "icloud.com",
  "icloud.con": "icloud.com",
  "aol.con": "aol.com",
  "msn.con": "msn.com",
};

// Edit distance where swapping two neighbouring letters counts as one edit,
// so "gmial" is one step from "gmail".
function editDistance(a: string, b: string): number {
  const w = b.length + 1;
  const d = new Array<number>((a.length + 1) * w).fill(0);
  const at = (i: number, j: number) => d[i * w + j] ?? 0;
  for (let i = 0; i <= a.length; i++) d[i * w] = i;
  for (let j = 0; j <= b.length; j++) d[j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, at(i - 2, j - 2) + 1);
      }
      d[i * w + j] = best;
    }
  }
  return at(a.length, b.length);
}

/** The corrected address ("jane@gmail.com") when the domain looks mistyped, else null. */
export function suggestEmailCorrection(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  if (COMMON_DOMAINS.includes(domain)) return null;

  const fixed =
    KNOWN_TYPOS[domain] ?? COMMON_DOMAINS.find((known) => editDistance(domain, known) === 1);
  return fixed ? `${local}@${fixed}` : null;
}
