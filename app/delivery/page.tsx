import Link from "next/link";

// DRAFT for attorney review — not final legal language

const LINK_CLASS = "text-blue-600 underline hover:text-blue-700";

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 sm:px-10 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Delivery Policy</h1>
          <p className="text-sm text-gray-400 mt-2">Last updated: July 19, 2026</p>
        </div>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <p>
            Our services combine digital delivery (your case dashboard and documents) with physical mail fulfillment
            (your demand letter). Here is what to expect after your purchase:
          </p>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Dashboard Access &mdash; Immediately After Payment</h2>
            <p>
              After checkout, you will receive a link to your case dashboard by email. From your dashboard you
              complete a short worksheet that we use to craft your letter and organize your supporting documents.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Letter Preparation &mdash; Within 2&ndash;3 Business Days</h2>
            <p>
              Most letters are generated and pass automated technical quality checks &mdash; confirming your letter
              populated correctly and matches the information you entered &mdash; within 2&ndash;3 business days of
              your completed worksheet. Your draft is delivered to your dashboard for your review. If your case
              cannot be fully handled by our automated service, we will notify you as described in our{" "}
              <Link href="/terms" className={LINK_CLASS}>Terms of Service</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Your Review and E-Signature</h2>
            <p>
              You review your letter and e-sign it from your dashboard. Preparation timelines pause while we wait for
              your signature &mdash; your letter is not finalized or mailed until you sign.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Mailing &mdash; Within 3 Business Days of Your E-Signature</h2>
            <p>
              After you e-sign, we print and dispatch your letter to the recipient you designated using the mailing
              method shown at checkout (for example, USPS First-Class Mail). A mailing confirmation is posted to your
              dashboard.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Response Check-Ins</h2>
            <p>
              Responses from the recipient go directly to you at the contact information in your letter. During the
              period stated at checkout (currently 21 days from mailing), we send you periodic check-in reminders to
              record in your dashboard whether you have received a response, so we can guide your next steps &mdash;
              including unlocking the Court Filing Manager if your matter remains unresolved.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Carrier Delivery Times</h2>
            <p>
              Once your letter is dispatched, delivery is handled by the postal carrier. Carrier transit times are
              estimates and are outside our control; we do not guarantee a specific delivery date. If a letter is
              returned undeliverable, we will notify you and work with you on re-mailing to a corrected address at no
              additional charge.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Business Days</h2>
            <p>Business days are Monday through Friday, excluding U.S. federal holidays.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Questions</h2>
            <p className="mb-2">
              If a timeline above is missed, contact us and we will make it right as described in our{" "}
              <Link href="/refunds" className={LINK_CLASS}>Refund Policy</Link>.
            </p>
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
