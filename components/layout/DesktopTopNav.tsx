import { Bell, Settings } from "lucide-react";

import WalletButton from "@/components/wallet/WalletButton";
import RicTopPricePill from "@/components/market/RicTopPricePill";

function PricePill({
  icon,
  label,
  value,
  change,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="flex items-center gap-2 border-r border-white/10 px-4 last:border-r-0">
      {icon}
      <span className="text-xs text-[#A4AAB7]">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="text-xs font-semibold text-[#19C46B]">{change} ↗</span>
    </div>
  );
}

export default function DesktopTopNav() {
  return (
    <header className="sticky top-0 z-30 hidden h-[60px] border-b border-white/10 bg-[#05070B]/95 backdrop-blur-xl lg:block">
      <div className="flex h-full items-center justify-between px-5">
        <div className="flex h-full items-center rounded-full">
          <RicTopPricePill />

          <PricePill
            label="RST Price"
            value="$1.00"
            change="+1.35%"
            icon={
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0B44D9] text-[9px] font-black text-white">
                RST
              </span>
            }
          />
        </div>

        <div className="flex items-center gap-3">
          <WalletButton />

          <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#10131A] text-white">
            <Bell size={18} />
          </button>

          <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#10131A] text-white">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}