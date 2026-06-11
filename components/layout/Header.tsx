import Link from "next/link";
import WalletButton from "../wallet/WalletButton";

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-[#111318]">
      <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-400 rounded-full" />
          <span className="font-bold text-xl">RichCoin</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/">Exchange</Link>
          <Link href="/buy-usdt">Buy/Sell USDT</Link>
          <Link href="/staking">Staking</Link>
           <Link href="/referral">Referral</Link>
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}