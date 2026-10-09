"use client";

import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>) {
  return (
    <RadixSwitch.Root
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full bg-gray-300 transition-colors data-[state=checked]:bg-brand-600 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
    </RadixSwitch.Root>
  );
}
