import { FlaskConical } from "lucide-react";

export function PrototypeBanner() {
  return (
    <div className="bg-gray-900 text-gray-100 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2">
        <FlaskConical className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
        <p>
          <strong className="font-semibold">Prototype</strong>
          <span className="hidden sm:inline"> — sample data for walkthroughs.</span>{" "}
          <span className="sm:hidden">·</span> Nothing is mailed, charged or sent to a server.
        </p>
      </div>
    </div>
  );
}
