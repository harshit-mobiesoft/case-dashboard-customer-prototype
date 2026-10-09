import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { DemoPanel } from "@/components/demo/demo-panel";
import { PrototypeBanner } from "@/components/layout/prototype-banner";
import { SiteNav } from "@/components/layout/site-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Case Dashboard", template: "%s · Case Dashboard" },
  description: "Customer dashboard prototype — track your small claims case from demand letter to court filing.",
  icons: { icon: "/heroshield.svg", shortcut: "/heroshield.svg", apple: "/heroshield.svg" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#005fa4" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>
        <AppProviders>
          <div className="min-h-screen flex flex-col">
            <PrototypeBanner />
            <SiteNav />
            <div className="flex-1">{children}</div>
          </div>
          <DemoPanel />
        </AppProviders>
      </body>
    </html>
  );
}
