import Link from "next/link";
import WalletButton from "../wallet/WalletButton";

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-[#111318]">
      <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
       <div className="flex items-center gap-2">
  <img
    src="/rc.png"
    alt="RichCoin"
    className="h-8 w-8 rounded-full"
  />

  <span className="text-xl font-bold text-white">
    RichCoin
  </span>
</div>

        <nav className="hidden md:flex items-center gap-6 text-white">
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