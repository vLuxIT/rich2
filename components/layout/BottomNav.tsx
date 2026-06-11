"use client";

import Link from "next/link";
import { Repeat2, CreditCard, Banknote, Menu, PersonStanding, Users2, LockIcon } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-[#111318]">
      <div className="grid h-16 grid-cols-4">
        <Link
          href="/"
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-white"
        >
          <Repeat2 size={22} />
          <span>Exchange</span>
        </Link>

        <Link
          href="/buy-usdt"
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-zinc-300"
        >
          <CreditCard size={22} />
          <span>Buy/Sell</span>
        </Link>

        <Link
          href="/sell-usdt"
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-zinc-300"
        >
          <LockIcon size={22} />
          <span>Staking</span>
        </Link>

        <Link
          href="/referral"
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-zinc-300"
        >
          <Users2 size={22} />
          <span>Referral</span>
        </Link>
      </div>
    </nav>
  );
}