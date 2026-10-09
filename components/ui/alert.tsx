import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  error: { cls: "bg-red-50 border-red-200 text-red-800", Icon: AlertCircle, role: "alert" as const },
  info: { cls: "bg-blue-50 border-blue-200 text-blue-900", Icon: Info, role: "status" as const },
  success: { cls: "bg-green-50 border-green-200 text-green-900", Icon: CheckCircle2, role: "status" as const },
  warning: { cls: "bg-amber-50 border-amber-200 text-amber-900", Icon: AlertCircle, role: "status" as const },
};

export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
}) {
  const { cls, Icon, role } = TONES[tone];
  return (
    <div role={role} className={cn("flex items-start gap-2.5 rounded-xl border p-3.5 text-sm", cls, className)}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
