import Link from "next/link";

// DRAFT for attorney review — not final legal language

const LINK_CLASS = "text-blue-600 underline hover:text-blue-700";

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 sm:px-10 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Refund Policy</h1>
          <p className="text-sm text-gray-400 mt-2">Last updated: July 19, 2026</p>
        </div>

        <div className="bg-[#ecf4fb] border border-[#cadff0] rounded-xl p-5 text-sm text-gray-700 leading-relaxed mb-8">
          <strong>The short version:</strong> full refund any time <strong>before you e-sign your demand letter</strong>.
          Once you e-sign, your letter enters production and mailing, and the purchase is non-refundable.
        </div>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Before You E-Sign: Full Refund</h2>
            <p>
              You may cancel and receive a 100% refund at any time before you electronically sign your demand letter
              &mdash; including while you are completing your worksheet and while your draft is being prepared or
              reviewed. To request a refund, email{" "}
              <a href="mailto:support@smallclaimshero.com" className={LINK_CLASS}>support@smallclaimshero.com</a> from
              the email address on your account with the subject &ldquo;Refund Request.&rdquo;
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">After You E-Sign: Non-Refundable</h2>
            <p>
              Your electronic signature is your instruction to finalize and mail your letter. Once you e-sign,
              printing and mailing begin, and your purchase becomes non-refundable &mdash; including if the recipient
              does not respond, disputes your claim, or the matter is not resolved in your favor. We do not guarantee
              any outcome.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">What Refunds Cover</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Refunds cover the fee you paid to us at checkout, returned to your original payment method.</li>
              <li>
                The <strong>Court Filing Manager</strong> is a 100% free bonus feature included with every purchase.
                It has no separate cash or refund value, and its availability or use does not affect refund
                eligibility.
              </li>
              <li>Coupon discounts have no cash value; refunds are limited to the amount actually paid.</li>
              <li>
                Court filing fees or other amounts paid to third parties (such as courts) are not collected by us and
                are not covered by this policy.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Processing Time</h2>
            <p>
              Approved refunds are issued to your original payment method within 5&ndash;10 business days. Your bank
              or card issuer may take additional time to post the credit.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Errors on Our Part</h2>
            <p>
              If we make a material error &mdash; for example, your letter is not mailed as described in our{" "}
              <Link href="/delivery" className={LINK_CLASS}>Delivery Policy</Link> &mdash; contact us and we will
              correct the error or refund your purchase, at your choice.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Questions and Disputes</h2>
            <p>
              If you believe a charge is incorrect, please contact us at{" "}
              <a href="mailto:support@smallclaimshero.com" className={LINK_CLASS}>support@smallclaimshero.com</a>{" "}
              before disputing the charge with your card issuer &mdash; most issues can be resolved within one
              business day.
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
