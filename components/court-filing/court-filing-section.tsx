import { StepTimeline } from "@/components/case/step-timeline";
import { getCourtSteps } from "@/lib/domain/steps";
import type { CaseRecord } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { TaskForm } from "./task-form";

export function CourtFilingSection({ c }: { c: CaseRecord }) {
  const steps = getCourtSteps(c);
  return (
    <StepTimeline
      label="Court filing steps"
      steps={steps}
      renderExtra={(step) => {
        const task = c.tasks.find((t) => t.id === step.id);
        if (!task) return null;
        if (task.status === "unlocked" || task.status === "rejected") {
          return <TaskForm key={`${task.id}-${task.status}`} caseId={c.id} task={task} />;
        }
        if (task.status === "submitted" && task.submission) {
          return (
            <p className="mt-1.5 text-xs text-gray-600">Submitted {formatDate(task.submission.submittedAt)}.</p>
          );
        }
        return null;
      }}
    />
  );
}
