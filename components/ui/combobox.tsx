"use client";

import { Search, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ComboOption {
  id: string;
  label: string;
  hint?: string;
}

interface Props {
  label: string;
  /** Text shown in the input (the query while typing, the chosen label otherwise). */
  value: string;
  onInputChange: (text: string) => void;
  options: ComboOption[];
  onSelect: (option: ComboOption) => void;
  placeholder?: string;
  error?: string | null;
  hint?: string;
  selected?: boolean;
  emptyText?: string;
  required?: boolean;
}

/** Accessible autocomplete (WAI-ARIA combobox, list popup): arrows, Enter, Escape. */
export function Combobox({
  label,
  value,
  onInputChange,
  options,
  onSelect,
  placeholder,
  error,
  hint,
  selected,
  emptyText = "No results.",
  required,
}: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const choose = (o: ComboOption) => {
    onSelect(o);
    setOpen(false);
  };

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      choose(options[active]!);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="text-red-600 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500 pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-opt-${options[active]!.id}` : undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            onInputChange(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          className={cn(
            "w-full pl-10 pr-10 py-3 border rounded-lg text-sm text-gray-900 placeholder:text-gray-500",
            error
              ? "border-red-400 bg-red-50"
              : selected && !open
                ? "border-brand-500 bg-brand-50"
                : "border-gray-300 bg-white",
          )}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onInputChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {options.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500">{emptyText}</li>
            ) : (
              options.map((o, i) => (
                <li
                  key={o.id}
                  id={`${id}-opt-${o.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "px-4 py-2.5 text-sm cursor-pointer",
                    i === active ? "bg-brand-50 text-brand-800" : "text-gray-800",
                  )}
                >
                  <span className="block font-medium">{o.label}</span>
                  {o.hint && <span className="block text-xs text-gray-500">{o.hint}</span>}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
