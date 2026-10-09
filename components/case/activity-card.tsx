import { History } from "lucide-react";
import { ACTIVITY_LABELS } from "@/lib/domain/labels";
import type { ActivityEntry } from "@/lib/domain/types";
import { formatRelative } from "@/lib/format";

export function ActivityCard({ activity, now, limit = 6 }: { activity: ActivityEntry[]; now: Date; limit?: number }) {
  const recent = [...activity]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime() || b.id.localeCompare(a.id, undefined, { numeric: true }))
    .slice(0, limit);
  if (recent.length === 0) return null;

  return (
    <section aria-labelledby="activity-heading" className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <History className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
        <h2 id="activity-heading" className="text-sm font-semibold text-gray-800">
          Recent activity
        </h2>
      </div>
      <ul className="space-y-3">
        {recent.map((entry) => (
          <li key={entry.id} className="text-xs">
            <p className="text-gray-800">{ACTIVITY_LABELS[entry.type]}</p>
            <p className="text-gray-600 mt-0.5">{formatRelative(entry.at, now)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
