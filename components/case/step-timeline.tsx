import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CreditCard,
  FileSignature,
  FileText,
  FolderOpen,
  Gavel,
  Loader2,
  Lock,
  Mail,
  Send,
  Star,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { StepIcon, StepState, TimelineStep } from "@/lib/domain/steps";
import { cn } from "@/lib/utils";

const ICONS: Record<StepIcon, LucideIcon> = {
  check: CheckCircle2,
  folder: FolderOpen,
  clipboard: ClipboardList,
  star: Star,
  signature: FileSignature,
  send: Send,
  clock: Clock,
  outcome: ClipboardCheck,
  file: FileText,
  card: CreditCard,
  mail: Mail,
  calendar: Calendar,
  gavel: Gavel,
};

const STATE_TEXT: Record<StepState, string> = {
  complete: "Completed",
  active: "Current step",
  internal: "In progress with our team",
  pending: "Not started yet",
};

function Marker({ state, icon }: { state: StepState; icon: StepIcon }) {
  const Icon = ICONS[icon];
  if (state === "complete") return <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden="true" />;
  if (state === "active")
    return (
      <div className="h-7 w-7 rounded-full border-2 border-brand-600 bg-brand-50 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
      </div>
    );
  if (state === "internal")
    return (
      <div className="h-7 w-7 rounded-full border-2 border-dashed border-gray-400 bg-gray-50 flex items-center justify-center">
        <Star className="h-3.5 w-3.5 text-gray-600" aria-hidden="true" />
      </div>
    );
  return (
    <div className="h-7 w-7 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
      <Lock className="h-3 w-3 text-gray-500" aria-hidden="true" />
    </div>
  );
}

interface Props {
  steps: TimelineStep[];
  /** Runs a `command` action (e.g. send mailing); `pendingCommand` shows a spinner on it. */
  onCommand?: (command: "send_mailing") => void;
  pendingCommand?: boolean;
  /** Extra content rendered under a step (forms, notes). */
  renderExtra?: (step: TimelineStep) => React.ReactNode;
  label: string;
}

export function StepTimeline({ steps, onCommand, pendingCommand, renderExtra, label }: Props) {
  return (
    <ol aria-label={label} className="space-y-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const action = step.action;
        return (
          <li
            key={step.id}
            aria-current={step.state === "active" ? "step" : undefined}
            data-step={step.id}
            data-state={step.state}
            className="relative flex gap-4"
          >
            {!isLast && <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />}
            <div className="mt-0.5 shrink-0 z-10">
              <Marker state={step.state} icon={step.icon} />
            </div>
            <div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-5")}>
              <div className="flex items-start justify-between gap-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.state === "complete" && "text-gray-900",
                    step.state === "active" && "text-brand-800",
                    step.state === "internal" && "text-gray-700",
                    step.state === "pending" && "text-gray-600",
                  )}
                >
                  <span className="sr-only">{STATE_TEXT[step.state]}: </span>
                  {step.label}
                  {step.state === "internal" && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-normal">
                      Our team
                    </span>
                  )}
                </p>
                {action?.kind === "link" && (
                  <Link href={action.href} className="text-xs font-medium text-brand-700 hover:underline shrink-0">
                    {action.label}
                  </Link>
                )}
                {action?.kind === "command" && (
                  <button
                    type="button"
                    onClick={() => onCommand?.(action.command)}
                    disabled={pendingCommand}
                    className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline disabled:opacity-50 shrink-0"
                  >
                    {pendingCommand && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
                    {pendingCommand ? "Sending…" : action.label}
                  </button>
                )}
              </div>
              {step.description && <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>}
              {step.note && (
                <p
                  className={cn(
                    "mt-2 text-xs rounded-lg border px-3 py-2",
                    step.note.tone === "danger"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-gray-50 border-gray-200 text-gray-700",
                  )}
                >
                  <span className="font-semibold">{step.note.tone === "danger" ? "From our team: " : ""}</span>
                  {step.note.text}
                </p>
              )}
              {renderExtra?.(step)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
