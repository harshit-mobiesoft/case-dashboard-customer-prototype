import Link from "next/link";

// DRAFT for attorney review — not final legal language

const LINK_CLASS = "text-blue-600 underline hover:text-blue-700";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 sm:px-10 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-sm text-gray-400 mt-2">Last updated: July 19, 2026</p>
        </div>

        <div className="bg-[#ecf4fb] border border-[#cadff0] rounded-xl p-5 text-sm text-gray-700 leading-relaxed mb-8">
          <strong>Plain-English summary (not a substitute for the full terms):</strong> We are a document preparation
          service, not a law firm. You pay a one-time flat fee; we help you prepare, e-sign, and mail a demand letter,
          and we give you a case dashboard with self-help tools. We do not give legal advice, represent you, or
          guarantee any outcome. If your case needs more than our automated service can provide, we may &mdash; with
          the consent you give at checkout &mdash; share your case details with independent legal professionals.
          Disputes with us are resolved by individual arbitration in Wyoming.
        </div>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Agreement to These Terms</h2>
            <p className="mb-2">
              These Terms of Service (&ldquo;Terms&rdquo;) are a legal agreement between you and LegalRocket LLC, a
              Wyoming limited liability company (&ldquo;LegalRocket,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;), operator of Small Claims Hero, Activation Hero, and CaseDashboard.com (together, the
              &ldquo;Services&rdquo;). By accessing or using the Services, creating an account, or completing a
              purchase, you agree to these Terms and to our <Link href="/privacy" className={LINK_CLASS}>Privacy Policy</Link>,{" "}
              <Link href="/refunds" className={LINK_CLASS}>Refund Policy</Link>, and{" "}
              <Link href="/delivery" className={LINK_CLASS}>Delivery Policy</Link>, which are incorporated by
              reference. If you do not agree, do not use the Services.
            </p>
            <p>
              You must be at least 18 years old and located in the United States to use the Services. You represent
              that all information you provide to us is accurate and truthful.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. We Are Not a Law Firm</h2>
            <p className="mb-2">
              <strong>
                Small Claims Hero and Activation Hero are private document preparation services. We are not a law
                firm, we are not your attorney, and we do not provide legal advice, legal representation, or legal
                opinions.
              </strong>{" "}
              No attorney-client relationship is created by your use of the Services, by our preparation of documents,
              or by any communication with our support team. Our documents and informational resources are prepared
              using court-approved procedures and are provided for self-help purposes only. For legal advice about
              your specific situation, consult a licensed attorney in your state.
            </p>
            <p>
              We do not select your claims, evaluate the merits of your case, apply the facts of your case to the
              law, review your evidence, or advise you on strategy. We exercise no legal judgment. You are
              responsible for your own decisions, including whether to send a demand letter, what to claim, and
              whether to pursue court action.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. The Services</h2>
            <p className="mb-2">Depending on the package you purchase, the Services may include:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Demand letter preparation.</strong> You complete a guided questionnaire (&ldquo;worksheet&rdquo;);
                we use your answers to generate a demand letter for your review.
              </li>
              <li><strong>Electronic signature.</strong> You review and e-sign your letter from your case dashboard.</li>
              <li>
                <strong>Mail dispatch.</strong> After you e-sign, we print and mail your letter to the recipient you
                designate via the mailing method shown at checkout.
              </li>
              <li>
                <strong>Response check-ins.</strong> Responses from the recipient go directly to you. For the period
                stated at checkout (currently 21 days from mailing), we send you periodic reminders to record in your
                dashboard whether you have received a response, so the Services can guide your next steps. We do not
                receive, intercept, or monitor responses on your behalf.
              </li>
              <li>
                <strong>Case dashboard.</strong> An online dashboard to organize your case, upload supporting
                documents, and track status.
              </li>
              <li>
                <strong>Court Filing Manager (free bonus).</strong> A complimentary guided task-management tool that
                helps you organize the steps for filing in small claims court if your matter remains unresolved. The
                Court Filing Manager is a <strong>100% free bonus feature</strong>: it is always included at no
                additional cost, has no cash or refund value, is not a paid product or legal service, and may be
                modified or discontinued at any time. It provides self-help task guidance only &mdash; it does not
                file anything for you and does not constitute legal advice.
              </li>
            </ul>
            <p className="mt-2">
              We may improve, modify, or discontinue features of the Services at any time. We grant you a limited,
              non-exclusive, non-transferable, revocable license to use the Services for your own personal,
              non-commercial use.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Your Responsibilities</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Provide complete, accurate, and truthful information in your worksheet and account.</li>
              <li>Review your letter carefully before e-signing it. You are solely responsible for its contents.</li>
              <li>Do not use the Services to make false, exaggerated, harassing, or fraudulent claims.</li>
              <li>
                <strong>Deadlines are your responsibility.</strong> Legal claims are subject to strict filing
                deadlines (statutes of limitation) that vary by state and by claim. We do not track deadlines for you,
                and using the Services does not pause or extend any deadline. If you may be near a deadline, consult a
                licensed attorney immediately.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Fees and Payment</h2>
            <p className="mb-2">
              The fee for the Services is the one-time flat price displayed at checkout. Prices are confirmed by our
              server at checkout; the amount shown on the payment page is the amount you will be charged. We do not
              enroll you in a subscription and we do not bill you automatically after your purchase.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Court costs are separate.</strong> Court filing fees, service-of-process fees, and any other
                third-party costs are not included in our fee and are paid by you directly to the court or provider if
                you choose to pursue filing.
              </li>
              <li>
                <strong>Coupons.</strong> Coupon codes apply only at the time of purchase, have no cash value, and
                cannot be combined unless stated otherwise.
              </li>
              <li>
                <strong>Chargebacks.</strong> If you believe a charge is incorrect, please contact us first at{" "}
                <a href="mailto:support@smallclaimshero.com" className={LINK_CLASS}>support@smallclaimshero.com</a> so
                we can resolve it. We reserve the right to dispute chargebacks that are inconsistent with these Terms
                and our Refund Policy.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Refunds</h2>
            <p>
              Our refund terms are stated in full in our <Link href="/refunds" className={LINK_CLASS}>Refund Policy</Link>.
              In summary: you may request a full refund at any time <strong>before you e-sign your demand letter</strong>.
              Once you e-sign, your letter enters production and mailing and your purchase becomes non-refundable. The
              Court Filing Manager is a free bonus feature and carries no separate cash or refund value.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Delivery and Timelines</h2>
            <p>
              Our fulfillment timelines are stated in full in our <Link href="/delivery" className={LINK_CLASS}>Delivery Policy</Link>.
              In summary: your case dashboard is available promptly after purchase; most letters are prepared and
              pass automated technical quality checks within 2&ndash;3 business days of your completed worksheet;
              and letters are mailed within 3 business days of your e-signature. Postal delivery times are
              controlled by the carrier and are not guaranteed by us.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Referral to Independent Legal Professionals</h2>
            <p className="mb-2">
              Most cases are fully handled through our automated service. If your case cannot be fully handled by the
              automated service, or if our platform identifies that an additional review may be beneficial, your case
              details and contact information may be shared with participating independent legal professionals
              (including attorneys and paralegals) for potential review or an offer of representation, as described in
              our <Link href="/privacy" className={LINK_CLASS}>Privacy Policy</Link> and consented to by you at
              checkout.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sharing your information does <strong>not</strong> guarantee that any professional will review your case.</li>
              <li>
                Sharing your information does <strong>not</strong> create an attorney-client relationship with us or
                with any participating professional.
              </li>
              <li>
                Participating professionals are independent. Any services they offer are subject to their own terms
                and engagement agreements, and <strong>any further services would be billed separately by that
                professional</strong>, not by us.
              </li>
              <li>
                We are not responsible for the acts, omissions, availability, or work product of any independent
                professional.
              </li>
            </ul>
            <p className="mt-2">
              <strong>No referral fees.</strong> We receive no compensation from participating legal professionals,
              and we pay them nothing to participate. Any services they provide are contracted and paid directly
              between you and that professional. We do not endorse, vet, or recommend any particular professional.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Electronic Communications and Signatures</h2>
            <p>
              By using the Services you consent to receive communications from us electronically (email, SMS where
              you opt in, and dashboard notifications) and you agree that your electronic signature on documents has
              the same legal effect as a handwritten signature, consistent with the federal ESIGN Act and applicable
              state law. You may withdraw consent to electronic communications by contacting us, but doing so may
              prevent us from providing the Services. Transactional messages about your case are part of the
              Services; marketing messages include an opt-out.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Your Content and Our Intellectual Property</h2>
            <p>
              You retain ownership of the content you create through the Services, including your worksheet answers
              and your finished letters. You grant us a limited license to use your content solely to provide the
              Services (for example, to generate, review, print, and mail your letter and to operate your dashboard).
              The Services themselves &mdash; including our software, templates, questionnaires, designs, and
              trademarks &mdash; are owned by LegalRocket LLC and are protected by law. You may not copy, resell,
              scrape, or create derivative works from the Services.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">11. Acceptable Use</h2>
            <p>
              You agree not to: (a) use the Services for any unlawful purpose; (b) submit false or misleading
              information or pursue claims you know to be unfounded; (c) attempt to probe, disable, or circumvent any
              security feature; (d) use bots, scrapers, or automated tools to access the Services; (e) impersonate any
              person or misrepresent your affiliation; or (f) interfere with any other user&rsquo;s use of the
              Services. We may suspend or terminate access for violations.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">12. No Guarantee of Outcome</h2>
            <p>
              We make no promises about results. A demand letter may or may not produce a response, settlement, or
              payment, and small claims outcomes depend on facts and law outside our control. Statements on our
              website about typical experiences are illustrative and are not a prediction or guarantee for your case.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">13. Disclaimer of Warranties</h2>
            <p className="uppercase">
              The Services are provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any
              kind, express or implied, including implied warranties of merchantability, fitness for a particular
              purpose, and non-infringement. We do not warrant that the Services will be uninterrupted, error-free, or
              secure, or that documents generated will meet the requirements of any particular court.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">14. Limitation of Liability</h2>
            <p className="uppercase mb-2">
              To the maximum extent permitted by law, LegalRocket LLC and its owners, employees, and agents will not
              be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost
              profits, lost claims, or missed deadlines, arising out of or related to the Services. Our total
              liability for any claim arising out of these Terms or the Services will not exceed the amount you paid
              to us for the Services in the twelve (12) months before the event giving rise to the claim.
            </p>
            <p>Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">15. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless LegalRocket LLC from claims, damages, and expenses (including
              reasonable attorneys&rsquo; fees) arising from your content, your misuse of the Services, or your
              violation of these Terms or of any law or third-party right.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">16. Termination</h2>
            <p>
              You may stop using the Services at any time. We may suspend or terminate your access if you violate
              these Terms or misuse the Services. Sections that by their nature should survive termination (including
              Sections 10 and 13&ndash;18) survive.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">17. Dispute Resolution; Arbitration; Class Action Waiver</h2>
            <p className="mb-2"><strong>Please read this section carefully &mdash; it affects your rights.</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Informal resolution first.</strong> Before filing a claim, you agree to contact us at{" "}
                <a href="mailto:support@smallclaimshero.com" className={LINK_CLASS}>support@smallclaimshero.com</a> and
                give us 30 days to try to resolve the dispute informally.
              </li>
              <li>
                <strong>Binding arbitration.</strong> Any dispute arising out of these Terms or the Services that is
                not resolved informally will be resolved by binding individual arbitration administered by the
                American Arbitration Association under its Consumer Arbitration Rules. The arbitration will be
                conducted in Wyoming or, at your election, by video conference or telephone.
              </li>
              <li>
                <strong>Small claims exception.</strong> Either party may instead bring an individual claim in small
                claims court.
              </li>
              <li>
                <strong>Class action waiver.</strong>{" "}
                <span className="uppercase">
                  You and LegalRocket each waive the right to a jury trial and the right to participate in a class
                  action, class arbitration, or representative proceeding.
                </span>
              </li>
              <li>
                <strong>Opt-out.</strong> You may opt out of this arbitration agreement by emailing{" "}
                <a href="mailto:support@smallclaimshero.com" className={LINK_CLASS}>support@smallclaimshero.com</a>{" "}
                with the subject &ldquo;Arbitration Opt-Out&rdquo; within 30 days of first accepting these Terms.
              </li>
              <li>
                <strong>Time limit.</strong> Any claim must be brought within one (1) year after it accrues, or it is
                permanently barred, to the extent permitted by law.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">18. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Wyoming, without regard to conflict-of-law rules,
              except where the law of your state of residence necessarily applies to consumer protections.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">19. Force Majeure</h2>
            <p>
              We are not liable for delays or failures caused by events beyond our reasonable control, including
              postal service disruptions, carrier delays, utility or internet outages, labor disputes, natural
              disasters, or acts of government.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">20. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date above reflects the
              current version. Material changes will be posted on this page, and your continued use of the Services
              after changes take effect constitutes acceptance. Changes do not apply retroactively to purchases
              already completed.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">21. Miscellaneous</h2>
            <p>
              If any provision of these Terms is found unenforceable, the remainder stays in effect. These Terms,
              together with the policies incorporated by reference, are the entire agreement between you and us
              regarding the Services. You may not assign these Terms; we may assign them in connection with a merger,
              acquisition, or sale of assets. Our failure to enforce a provision is not a waiver.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">22. Contact</h2>
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
