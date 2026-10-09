import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap", {
  variants: {
    variant: {
      default: "bg-gray-100 text-gray-700",
      success: "bg-green-100 text-green-800",
      warning: "bg-amber-100 text-amber-800",
      danger: "bg-red-100 text-red-700",
      info: "bg-blue-100 text-blue-800",
      outline: "border border-gray-300 text-gray-700 bg-white",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
