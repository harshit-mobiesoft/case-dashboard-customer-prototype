import Link from "next/link";

// DRAFT for attorney review — not final legal language

const LINK_CLASS = "text-blue-600 underline hover:text-blue-700";

export default function LegalDisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 sm:px-10 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Legal Disclaimer</h1>
          <p className="text-sm text-gray-400 mt-2">Last updated: July 19, 2026</p>
        </div>

        <div className="bg-[#ecf4fb] border border-[#cadff0] rounded-xl p-5 text-sm text-gray-700 leading-relaxed mb-8">
          <strong>
            Small Claims Hero and Activation Hero, operated by LegalRocket LLC, are not a law firm and do not provide
            legal services or legal advice.
          </strong>{" "}
          We are a private document preparation service. No attorney-client relationship is created by your use of
          our services. We exercise no legal judgment: we do not assess or comment on the merits of your case, do
          not apply the facts of your case to the law, and do not review your evidence.
        </div>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">What We Do</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Prepare a demand letter based on the information you provide, and mail it on your instruction.</li>
              <li>Provide a case dashboard to organize your case and supporting documents.</li>
              <li>
                Send periodic check-in reminders during the period stated at checkout so you can record any response
                in your dashboard and move your case forward.
              </li>
              <li>
                Provide self-help informational resources and, as a free bonus, the Court Filing Manager &mdash; a
                guided task-management tool for organizing the steps of a small claims filing.
              </li>
              <li>Provide limited email support for using our services.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">What We Do Not Do</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>We do not provide legal advice, legal opinions, or case evaluations.</li>
              <li>We do not represent you in court or in negotiations.</li>
              <li>We do not file lawsuits or court documents on your behalf.</li>
              <li>
                We do not communicate with the opposing party on your behalf beyond mailing your letter. Responses
                from the recipient go directly to you; we do not receive or monitor them on your behalf.
              </li>
              <li>We do not guarantee any response, settlement, payment, or other outcome.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Referral to Independent Legal Professionals</h2>
            <p>
              If your case cannot be fully handled by our automated service, or if our platform identifies that an
              additional review may be beneficial, your case details and contact information may &mdash; with the
              consent you give at checkout &mdash; be shared with participating independent legal professionals
              (including attorneys and paralegals) for potential review or an offer of representation. Sharing does
              not guarantee a review and does not create an attorney-client relationship. Any services offered by
              such professionals are provided under their own engagement terms and billed separately by them. We
              receive no compensation from these professionals and pay them nothing to participate. See our{" "}
              <Link href="/privacy" className={LINK_CLASS}>Privacy Policy</Link> for details and opt-out instructions.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Deadlines Matter</h2>
            <p>
              Legal claims are subject to strict filing deadlines, called statutes of limitation, which vary by claim
              and by state. Missing a deadline can permanently eliminate your right to recover. Using our services
              does not pause or extend any deadline, and we do not track deadlines for you. If you believe a deadline
              may be approaching, consult a licensed attorney immediately.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Court Filing Manager</h2>
            <p>
              The Court Filing Manager is a complimentary self-help tool included free with your purchase. It
              provides guided task management to help you organize a small claims filing if your matter remains
              unresolved. It has no cash or refund value, does not file anything on your behalf, and is not legal
              advice.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Completion of Services</h2>
            <p>
              Our document preparation service is complete when your demand letter has been mailed. During the
              check-in period stated at checkout we send you reminders to record any response in your dashboard. Your
              dashboard and the Court Filing Manager remain available as self-help resources thereafter.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Refunds</h2>
            <p>
              Refund eligibility is governed by our <Link href="/refunds" className={LINK_CLASS}>Refund Policy</Link>:
              a full refund is available before you e-sign your letter; after e-signature, the purchase is
              non-refundable.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Get Legal Advice When You Need It</h2>
            <p>
              For advice about your specific situation &mdash; including whether your claim has merit, what you can
              recover, and how to proceed in court &mdash; consult a licensed attorney in your state. Many state bar
              associations offer free or low-cost lawyer referral services.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              LegalRocket LLC
              <br />
              30 N Gould St Ste R
              <br />
              Sheridan, WY 82801 USA
              <br />
              <a href="mailto:support@smallclaimshero.com" className={LINK_CLASS}>support@smallclaimshero.com</a>
            </p>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
