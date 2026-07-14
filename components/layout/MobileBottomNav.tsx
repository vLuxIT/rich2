"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "./nav-items";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getMobileLabel(item: (typeof navItems)[number]) {
  return "shortLabel" in item ? item.shortLabel : item.label;
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
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#123DDB] text-[8px] font-black text-white">
        RST
      </span>
    );
  }

  const Icon = icon;

  return (
    <Icon
      size={22}
      className={active ? "text-[#FFC928]" : "text-[#A4AAB7]"}
    />
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#05070B]/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-6 gap-1">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center rounded-xl py-2"
            >
              <RenderIcon icon={item.icon} active={active} />

              <span
                className={[
                  "mt-1 text-[10px] font-medium",
                  active ? "text-[#FFC928]" : "text-[#A4AAB7]",
                ].join(" ")}
              >
                {getMobileLabel(item)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}