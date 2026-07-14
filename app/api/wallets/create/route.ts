import { NextResponse } from "next/server";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptPrivateKey } from "@/lib/walletCrypto";

export const runtime = "nodejs";

export async function POST() {
  try {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const encrypted = encryptPrivateKey(privateKey);

    const { data, error } = await supabaseAdmin
      .from("generated_wallets")
      .insert({
        address: account.address,
        chain: "bsc",
        encrypted_private_key: encrypted.encryptedPrivateKey,
        encryption_iv: encrypted.encryptionIv,
        encryption_tag: encrypted.encryptionTag,
      })
      .select("id,address,chain,created_at")
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      wallet: {
        id: data.id,
        address: data.address,
        chain: data.chain,
        createdAt: data.created_at,
      },
      privateKey,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create wallet";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}