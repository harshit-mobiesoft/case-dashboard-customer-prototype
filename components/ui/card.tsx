import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-white border border-gray-200 rounded-xl", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4 border-b border-gray-100", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
