export default function StakingPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[440px] flex-col items-center justify-center text-center">
      <div className="rounded-[28px] border border-zinc-800 bg-[#10141d] p-6">
        <img
          src="/rc.png"
          alt="RichCoin"
          className="mx-auto h-20 w-20 rounded-full"
        />

        <h1 className="mt-6 bg-gradient-to-r from-[#FFF4B0] via-[#FFD700] to-[#D4AF37] bg-clip-text text-4xl font-semibold text-transparent">
          Staking
        </h1>

        <p className="mt-3 text-sm text-zinc-400">
          RichCoin staking is coming soon.
        </p>

        <div className="mt-6 rounded-[18px] border border-yellow-700/40 bg-gradient-to-br from-[#1c1708] via-[#15110a] to-[#0f0f0f] p-4">
          <p className="text-base font-medium text-zinc-300">
            Coming Soon
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Stake RIC and earn rewards when the staking pool launches.
          </p>
        </div>
      </div>
    </div>
  );
}