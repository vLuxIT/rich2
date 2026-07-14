import type { ReactNode } from "react";

import DesktopSidebar from "./DesktopSidebar";
import DesktopTopNav from "./DesktopTopNav";
import MobileBottomNav from "./MobileBottomNav";
import MobileHeader from "./MobileHeader";
import PageContainer from "./PageContainer";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070B] text-white">
      <DesktopSidebar />

      <div className="min-h-screen lg:pl-[220px]">
        <DesktopTopNav />
        <MobileHeader />

        <PageContainer>{children}</PageContainer>
      </div>

      <MobileBottomNav />
    </div>
  );
}