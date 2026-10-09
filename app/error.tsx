"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="max-w-xl mx-auto px-4 py-16">
      <EmptyState as="h1" icon={AlertCircle} title="Something went wrong">
        <p className="mb-4">An unexpected error occurred. Your demo data is safe.</p>
        <Button onClick={reset}>Try again</Button>
      </EmptyState>
    </main>
  );
}
