
export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 sm:px-10 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Customer Support
          </h1>
          <p className="text-sm text-gray-400 mt-2">Small Claims Hero by LegalRocket LLC</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Hours</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Available Monday–Friday, 9AM–5PM USA Pacific Time.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Help Center</h2>
            <a
              href="https://hero.freshdesk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:underline break-words"
            >
              https://hero.freshdesk.com
            </a>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Email</h2>
            <a
              href="mailto:support@smallclaimshero.com"
              className="text-sm text-brand-600 hover:underline"
            >
              support@smallclaimshero.com
            </a>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
