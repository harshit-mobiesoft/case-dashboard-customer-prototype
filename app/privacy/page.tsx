import Link from "next/link";

// DRAFT for attorney review — not final legal language

const LINK_CLASS = "text-blue-600 underline hover:text-blue-700";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 sm:px-10 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mt-2">Last updated: July 19, 2026</p>
        </div>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <p>
            This Privacy Policy explains how LegalRocket LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) &mdash; operator of
            Small Claims Hero, Activation Hero, and CaseDashboard.com (the &ldquo;Services&rdquo;) &mdash; collects, uses,
            shares, and protects your personal information. By using the Services you agree to this Policy.
          </p>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Identity and contact information:</strong> name, mailing address, email address, phone number.</li>
              <li>
                <strong>Case information:</strong> the details you provide about your claim, including your description
                of the dispute, the defendant&rsquo;s identity and address, claim category, filing county, supporting
                documents you upload, and the contents of your demand letter.
              </li>
              <li>
                <strong>Payment information:</strong> payments are processed by our third-party payment processor. We
                receive confirmation of payment and limited billing details (such as the card brand and last four
                digits); we do not store full card numbers.
              </li>
              <li>
                <strong>Usage and device information:</strong> IP address, browser type, pages visited, and similar
                analytics data collected through cookies and similar technologies.
              </li>
              <li>
                <strong>Communications:</strong> messages you exchange with our support team and the case status
                updates you record in your dashboard (for example, whether you received a response to your letter).
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                To provide the Services: generate your documents, operate your case dashboard, mail your letter, send
                case check-in reminders, and provide support.
              </li>
              <li>To process payments and prevent fraud.</li>
              <li>
                To communicate with you about your case (transactional messages) and, with opt-out available, about our
                services (marketing messages).
              </li>
              <li>To improve the Services, including analytics and quality review of generated documents.</li>
              <li>
                To comply with law and enforce our <Link href="/terms" className={LINK_CLASS}>Terms of Service</Link>.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. How We Share Your Information</h2>
            <p className="mb-2">
              We do not sell your personal information for money. We share personal information only as described
              below:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Service providers.</strong> Vendors who help us operate the Services &mdash; such as website
                hosting, document generation, e-signature, print-and-mail fulfillment, payment processing, email
                delivery, and analytics &mdash; under agreements that limit their use of your information to providing
                services to us.
              </li>
              <li>
                <strong>Participating legal professionals.</strong> If your case cannot be fully handled by our
                automated service, or if our platform identifies that an additional review may be beneficial, we may
                share your case details and contact information with participating independent legal professionals
                (including attorneys and paralegals) for potential review or an offer of representation. You consent
                to this sharing at checkout. Sharing does not guarantee a review and does not create an
                attorney-client relationship; any services those professionals offer are contracted and billed
                separately by them. <strong>You may opt out of this sharing at any time</strong> as described in
                Section 5, though opting out may limit our ability to elevate your case beyond the automated service.
              </li>
              <li>
                <strong>Legal compliance and protection.</strong> When required by law, subpoena, or court order, or
                to protect the rights, safety, or property of our users, the public, or LegalRocket.
              </li>
              <li>
                <strong>Business transfers.</strong> In connection with a merger, acquisition, or sale of assets, in
                which case this Policy will continue to apply to your information.
              </li>
            </ul>
            <p className="mt-2">
              We may use and share aggregated or de-identified information that cannot reasonably identify you.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Cookies and Analytics</h2>
            <p>
              We use cookies and similar technologies for sign-in, site functionality, and analytics. You can control
              cookies through your browser settings; disabling them may affect site functionality. We honor Global
              Privacy Control (GPC) signals where required by law.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Your Privacy Rights (Including California)</h2>
            <p className="mb-2">Depending on your state of residence, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Know / access</strong> the personal information we have collected about you;</li>
              <li><strong>Correct</strong> inaccurate personal information;</li>
              <li><strong>Delete</strong> personal information, subject to legal exceptions;</li>
              <li><strong>Receive a portable copy</strong> of your personal information;</li>
              <li>
                <strong>Opt out of &ldquo;sales&rdquo; or &ldquo;sharing&rdquo;</strong> of personal information as
                those terms are defined by applicable law. Our disclosure of case details to participating legal
                professionals (Section 3) may be considered a &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; under some
                state laws. To opt out, email{" "}
                <a href="mailto:support@smallclaimshero.com" className={LINK_CLASS}>support@smallclaimshero.com</a>{" "}
                with the subject <strong>&ldquo;Do Not Sell or Share My Personal Information&rdquo;</strong>, or use
                the opt-out controls in your case dashboard where available;
              </li>
              <li>
                <strong>Non-discrimination</strong> &mdash; we will not deny you services or charge you a different
                price for exercising your rights.
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:support@smallclaimshero.com" className={LINK_CLASS}>support@smallclaimshero.com</a>. We
              will verify your request using the email address and account information on file and respond within the
              time required by law. You may use an authorized agent where permitted.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active and as needed to provide the Services,
              including maintaining a record of your prepared documents and mailing history. We retain information
              longer where required by law, to resolve disputes, to document consent, or for fraud prevention. When
              information is no longer needed, we delete or de-identify it.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Security</h2>
            <p>
              We use administrative, technical, and physical safeguards designed to protect your information,
              including encrypted connections (HTTPS), access controls limiting data access to authorized personnel,
              and vendor security requirements. No method of transmission or storage is 100% secure; if we learn of a
              security breach affecting your personal information, we will notify you as required by applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Children</h2>
            <p>
              The Services are for adults 18 and older. We do not knowingly collect personal information from anyone
              under 18. If you believe a minor has provided us information, contact us and we will delete it.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Marketing Communications</h2>
            <p>
              You can opt out of marketing emails at any time using the unsubscribe link in each message or by
              contacting us. We will still send transactional messages about your case and purchases.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this Policy from time to time. The &ldquo;Last updated&rdquo; date above reflects the
              current version. If we make material changes to how we share your information &mdash; including changes
              to sharing with legal professionals &mdash; we will provide notice through the Services or by email
              before the change takes effect.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">11. Contact Us</h2>
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
