"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageSkeleton } from "@/components/layout/case-gate";
import { consumeDeliberateSignOut, useSession } from "@/lib/data/session";

/** Dashboard routes need a signed-in customer; otherwise go to the home page and come back after. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session !== "signed_out") return;
    router.replace(consumeDeliberateSignOut() ? "/" : `/?next=${encodeURIComponent(pathname)}`);
  }, [session, router, pathname]);

  if (session !== "signed_in") return <PageSkeleton label="Checking your session" />;
  return <>{children}</>;
}
