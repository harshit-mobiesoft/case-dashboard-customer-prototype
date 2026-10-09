import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white hover:bg-brand-700",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        ghost: "text-gray-600 hover:bg-gray-100",
        danger: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-green-700 text-white hover:bg-green-800",
      },
      size: {
        sm: "text-sm px-3 py-1.5",
        md: "text-sm px-4 py-2",
        lg: "text-base px-6 py-3",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
