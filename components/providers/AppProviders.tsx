"use client";

import "@rainbow-me/rainbowkit/styles.css";

import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";

import {
  
  trustWallet,
  bitgetWallet,
  okxWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";

import {
  WagmiProvider,
  createConfig,
  http,
  useAccount,
  useChainId,
  useSwitchChain,
} from "wagmi";

import { bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "971ac7b17c3f4e0e3867c2dc84bc2ea7";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        trustWallet,
        walletConnectWallet,
        bitgetWallet,
        okxWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: "RichCoin Dex",
    projectId,
  }
);

const config = createConfig({
  connectors,
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

function AutoSwitchToBsc() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (!isConnected) return;
    if (chainId === bsc.id) return;

    switchChain({
      chainId: bsc.id,
    });
  }, [isConnected, chainId, switchChain]);

  return null;
}

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={bsc}>
          <AutoSwitchToBsc />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}