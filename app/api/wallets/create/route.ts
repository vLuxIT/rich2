import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptPrivateKey } from "@/lib/walletCrypto";

export const runtime = "nodejs";

type CreateWalletBody = {
  ownerWallet?: string;
  purpose?: string;
  includePrivateKey?: boolean;
};

type GeneratedWalletRow = {
  id: string;
  address: string;
  chain: string;
  owner_wallet: string | null;
  purpose: string | null;
  created_at: string;
};

const DEFAULT_CHAIN = "bsc";
const DEFAULT_PURPOSE = "general";
const ALLOWED_PURPOSES = new Set(["general", "health_rewards"]);

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function normalizePurpose(value?: string | null) {
  const purpose = (value || DEFAULT_PURPOSE).trim().toLowerCase();

  if (!ALLOWED_PURPOSES.has(purpose)) {
    throw new Error(
      `Invalid purpose. Allowed values: ${Array.from(ALLOWED_PURPOSES).join(", ")}`
    );
  }

  return purpose;
}

function normalizeOwnerWallet(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();

  if (!isAddress(trimmed)) {
    throw new Error("Invalid ownerWallet");
  }

  return trimmed.toLowerCase();
}

function publicWalletResponse(wallet: GeneratedWalletRow, created: boolean) {
  return {
    ok: true,
    exists: true,
    created,
    walletId: wallet.id,
    address: wallet.address,
    chain: wallet.chain,
    ownerWallet: wallet.owner_wallet,
    purpose: wallet.purpose,
    createdAt: wallet.created_at,
  };
}

async function findExistingWallet(ownerWallet: string, purpose: string) {
  const { data, error } = await supabaseAdmin
    .from("generated_wallets")
    .select("id,address,chain,owner_wallet,purpose,created_at")
    .eq("chain", DEFAULT_CHAIN)
    .eq("owner_wallet", ownerWallet)
    .eq("purpose", purpose)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as GeneratedWalletRow | null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const ownerWallet = normalizeOwnerWallet(searchParams.get("ownerWallet"));
    const purpose = normalizePurpose(searchParams.get("purpose"));

    if (!ownerWallet) {
      return json(400, {
        ok: false,
        error: "ownerWallet is required",
      });
    }

    const existing = await findExistingWallet(ownerWallet, purpose);

    if (!existing) {
      return NextResponse.json({
        ok: true,
        exists: false,
        wallet: null,
      });
    }

    return NextResponse.json(publicWalletResponse(existing, false));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load wallet";

    return json(400, {
      ok: false,
      error: message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreateWalletBody;

    const ownerWallet = normalizeOwnerWallet(body.ownerWallet);
    const purpose = normalizePurpose(body.purpose);

    if (ownerWallet && purpose !== DEFAULT_PURPOSE) {
      const existing = await findExistingWallet(ownerWallet, purpose);

      if (existing) {
        return NextResponse.json(publicWalletResponse(existing, false));
      }
    }

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const encrypted = encryptPrivateKey(privateKey);

    const { data, error } = await supabaseAdmin
      .from("generated_wallets")
      .insert({
        address: account.address,
        chain: DEFAULT_CHAIN,
        encrypted_private_key: encrypted.encryptedPrivateKey,
        encryption_iv: encrypted.encryptionIv,
        encryption_tag: encrypted.encryptionTag,
        owner_wallet: ownerWallet,
        purpose,
      })
      .select("id,address,chain,owner_wallet,purpose,created_at")
      .single();

    if (error) {
      if (ownerWallet && purpose !== DEFAULT_PURPOSE) {
        const existing = await findExistingWallet(ownerWallet, purpose);

        if (existing) {
          return NextResponse.json(publicWalletResponse(existing, false));
        }
      }

      return json(500, {
        ok: false,
        error: error.message,
      });
    }

    const response: Record<string, unknown> = publicWalletResponse(
      data as GeneratedWalletRow,
      true
    );

    /**
     * Keep false for user-facing UI.
     * Only use this for controlled internal testing.
     */
    if (body.includePrivateKey === true) {
      response.privateKey = privateKey;
      response.warning =
        "Private key was included because includePrivateKey=true. Do not expose this response to users.";
    }

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create wallet";

    return json(400, {
      ok: false,
      error: message,
    });
  }
}
