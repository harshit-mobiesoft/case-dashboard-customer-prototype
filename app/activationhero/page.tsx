import type { Metadata } from "next";
import { IntakeFlow } from "@/components/intake/intake-flow";

export const metadata: Metadata = { title: "Activation Hero — Start your claim" };

export default function Page() {
  return <IntakeFlow service="activation_hero" />;
}
