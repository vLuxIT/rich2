"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { navItems } from "./nav-items";
import { imageAssets } from "@/lib/assets";
function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function RenderIcon({
  icon,
  active,
}: {
  icon: (typeof navItems)[number]["icon"];
  active: boolean;
}) {
  if (icon === "RST") {
    return (
      <span
        className={[
          "grid h-5 w-5 place-items-center rounded-full text-[8px] font-black",
          active ? "bg-[#05070B] text-[#FFC928]" : "bg-[#122EBD] text-white",
        ].join(" ")}
      >
        RST
      </span>
    );
  }

  const Icon = icon;

  return (
    <Icon
      size={18}
      className={active ? "text-[#FFC928]" : "text-[#A4AAB7]"}
    />
  );
}

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[220px] border-r border-white/10 bg-[#05070B] lg:block">
      <div className="flex h-full flex-col">
        <Link href="/" className="flex items-center gap-3 px-5 py-5">
         <div className="relative h-12 w-[160px] overflow-hidden">
  <Image
    src={imageAssets.logo}
    alt="Richlance DEX"
    fill
    sizes="160px"
    className="object-contain object-left"
  />
</div>

          <div className="leading-none">
            <p className="text-xl font-black tracking-wide text-white">RICHLANCE</p>
            <p className="text-lg font-black tracking-wide text-[#FFC928]">DEX</p>
          </div>
        </Link>

        <nav className="mt-3 space-y-1 px-4">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex min-h-[46px] items-center gap-3 rounded-xl border-l-2 px-3 text-sm font-medium transition",
                  active
                    ? "border-[#FFC928] bg-[#FFC928]/10 text-[#FFC928] shadow-[inset_0_0_28px_rgba(255,201,40,0.08)]"
                    : "border-transparent text-[#B7BBC6] hover:bg-white/[0.04] hover:text-white",
                ].join(" ")}
              >
                <RenderIcon icon={item.icon} active={active} />
                <span className="leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 mt-auto rounded-xl border border-white/10 bg-[#0C0F16] p-4">
          <p className="text-base font-bold leading-tight text-white">
            Trade. Stake. Earn. Grow Together.
          </p>
          <p className="mt-2 text-[11px] leading-4 text-[#A4AAB7]">
            All in one secure platform built on Binance Smart Chain.
          </p>

          <div className="relative mx-auto mt-4 h-28 w-28 rounded-full bg-[#FFC928]/10">
            <div className="absolute inset-0 rounded-full bg-[#FFC928]/20 blur-2xl" />
            <Image src="/rc.png" alt="Richlance coin" fill sizes="112px" className="relative object-contain" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 px-4 py-5">
          {[X, Send, MessageCircle].map((Icon, index) => (
            <button
              key={index}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0C0F16] text-[#A4AAB7]"
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-[10px] text-[#7E8494]">
          © 2025 Richlance DEX.
        </div>
      </div>
    </aside>
  );
}