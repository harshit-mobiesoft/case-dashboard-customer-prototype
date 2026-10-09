import { RequireAuth } from "@/components/layout/require-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
