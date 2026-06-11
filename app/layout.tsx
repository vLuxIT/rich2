import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import AppProviders from "@/components/providers/AppProviders";
import ReferralTracker from "@/components/referral/ReferralTracker";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0F1117] text-white">
        <AppProviders>
          <ReferralTracker />

          <div className="flex min-h-screen flex-col">
            <Header />

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 md:pb-6">
              {children}
            </main>

            <div className="md:hidden">
              <BottomNav />
            </div>

            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}