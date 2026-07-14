import "./globals.css";

import { Suspense } from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";

import AppShell from "@/components/layout/AppShell";
import AppProviders from "@/components/providers/AppProviders";
import ReferralTracker from "@/components/referral/ReferralTracker";

export const metadata: Metadata = {
  title: "RichCoin Dex",
  description: "Swap, stake, and earn with RichCoin.",
  icons: {
    icon: "/rc.png",
    shortcut: "/rc.png",
    apple: "/rc.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#080A10] text-white">
        <AppProviders>
          <Suspense fallback={null}>
            <ReferralTracker />
          </Suspense>

          <AppShell>{children}</AppShell>
        </AppProviders>

        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}