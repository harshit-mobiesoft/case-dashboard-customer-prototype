import type { Metadata } from "next";
import { SignupPage } from "@/components/signup/signup-page";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return <SignupPage />;
}
