import type { ReactNode } from "react";

export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1180px] overflow-hidden px-5 pb-28 pt-3 lg:px-5 lg:pb-5 lg:pt-4">
      {children}
    </main>
  );
}