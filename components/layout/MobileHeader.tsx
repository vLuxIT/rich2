import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";

import WalletButton from "@/components/wallet/WalletButton";

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#05070B] px-5 py-4 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden">
            <Image
              src="/rc.png"
              alt="Richlance"
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>

          <div className="leading-none">
            <p className="text-xl font-black tracking-wide text-white">
              RICHLANCE
            </p>
            <p className="text-lg font-black tracking-wide text-[#FFC928]">
              DEX
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <WalletButton />

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#10131A] text-white"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}