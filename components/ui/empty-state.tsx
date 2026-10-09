import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  children,
  as: Heading = "h2",
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  /** Use "h1" when the empty state is the whole page's content. */
  as?: "h1" | "h2";
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-10 sm:p-12 text-center">
      <Icon className="h-8 w-8 text-gray-400 mx-auto mb-3" aria-hidden="true" />
      <Heading className="font-semibold text-gray-800 mb-1">{title}</Heading>
      {children && <div className="text-sm text-gray-600">{children}</div>}
    </div>
  );
}
