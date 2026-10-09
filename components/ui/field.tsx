import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldShellProps {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Label + control + hint/error wiring (aria-describedby, aria-invalid) in one place. */
export function FieldShell({ label, error, hint, required, children, className }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-800">
        {label}
        {required && (
          <span className="text-red-600 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const controlClass = (invalid: boolean) =>
  cn(
    "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500",
    invalid ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
  );

interface BaseProps {
  label: string;
  error?: string | null;
  hint?: string;
  fieldClassName?: string;
}

export const TextField = forwardRef<
  HTMLInputElement,
  BaseProps & InputHTMLAttributes<HTMLInputElement> & { /** Short text inside the box before the value, e.g. "$". */ prefix?: string }
>(({ label, error, hint, fieldClassName, className, required, prefix, ...props }, ref) => (
  <FieldShell label={label} error={error} hint={hint} required={required} className={fieldClassName}>
    {({ id, describedBy, invalid }) => (
      <div className="relative">
        {prefix && (
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-600">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlClass(invalid), prefix && "pl-7", className)}
          {...props}
        />
      </div>
    )}
  </FieldShell>
));
TextField.displayName = "TextField";

export const TextAreaField = forwardRef<HTMLTextAreaElement, BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ label, error, hint, fieldClassName, className, required, ...props }, ref) => (
    <FieldShell label={label} error={error} hint={hint} required={required} className={fieldClassName}>
      {({ id, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlClass(invalid), "resize-y", className)}
          {...props}
        />
      )}
    </FieldShell>
  ),
);
TextAreaField.displayName = "TextAreaField";

export interface SelectOption {
  value: string;
  label: string;
}

export const SelectField = forwardRef<
  HTMLSelectElement,
  BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }
>(({ label, error, hint, fieldClassName, className, required, options, ...props }, ref) => (
  <FieldShell label={label} error={error} hint={hint} required={required} className={fieldClassName}>
    {({ id, describedBy, invalid }) => (
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlClass(invalid), "appearance-none pr-8", className)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    )}
  </FieldShell>
));
SelectField.displayName = "SelectField";

/** A checkbox with its label wired up and a large tap target. */
export function CheckboxField({
  label,
  error,
  className,
  ...props
}: { label: ReactNode; error?: string | null } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const id = useId();
  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          aria-invalid={!!error || undefined}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600"
          {...props}
        />
        <label htmlFor={id} className="text-sm text-gray-800">
          {label}
        </label>
      </div>
      {error && (
        <p className="text-xs text-red-700 mt-1 ml-6" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
