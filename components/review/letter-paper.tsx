import type { LetterContent } from "@/lib/domain/letter";

/** Renders structured letter content as React nodes — no HTML strings, no XSS surface. */
export function LetterPaper({ letter, signaturePending }: { letter: LetterContent; signaturePending: boolean }) {
  return (
    <article
      aria-label={`Demand letter, version ${letter.versionNumber}`}
      className="letter-paper p-6 sm:p-8 text-sm sm:text-[15px] leading-relaxed text-gray-800"
    >
      <p className="mb-6">{letter.dateLine}</p>

      <address className="not-italic mb-6">
        {letter.sender.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </address>

      <address className="not-italic mb-6">
        {letter.recipient.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </address>

      <p className="font-bold mb-5">Re: {letter.subject}</p>

      {letter.paragraphs.map((p, i) => (
        <p key={i} className="mb-4">
          {p}
        </p>
      ))}

      <p className="mt-6 mb-2">{letter.closing}</p>

      {letter.signedName ? (
        <div>
          <p className="text-3xl italic text-brand-800" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>
            {letter.signedName}
          </p>
          <p className="text-xs text-gray-600 mt-1">Electronically signed on {letter.signedOn}</p>
        </div>
      ) : (
        <div
          className={
            signaturePending
              ? "inline-block rounded border-2 border-dashed border-brand-400 bg-brand-50 px-6 py-3 text-sm font-sans text-brand-800"
              : "inline-block text-sm font-sans text-gray-500"
          }
        >
          {signaturePending ? "✍ You'll sign here" : "[signature pending]"}
        </div>
      )}
    </article>
  );
}
