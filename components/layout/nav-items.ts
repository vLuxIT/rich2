import {
  ArrowLeftRight,
  Droplets,
  Home,
  LockKeyhole,
  Share2,
  Users,
} from "lucide-react";

export const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Exchange",
    href: "/exchange",
    icon: ArrowLeftRight,
  },
  {
    label: "Staking",
    href: "/staking",
    icon: LockKeyhole,
  },
  {
    label: "Revenue Share Token (RST)",
    shortLabel: "RST",
    href: "/rsttt",
    icon: "RST",
  },
  {
    label: "Liquidity Providers",
    shortLabel: "Liquidity",
    href: "/liquidity-providers",
    icon: Droplets,
  },
  {
    label: "Referral",
    href: "/referral",
    icon: Users,
  },
] as const;