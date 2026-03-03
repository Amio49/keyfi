import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export function getProvider(): anchor.AnchorProvider {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  return provider;
}

export function getProgram(provider: anchor.AnchorProvider): Program {
  return anchor.workspace.Keyfi as Program;
}

export async function airdropSol(
  provider: anchor.AnchorProvider,
  to: PublicKey,
  amount: number = 10
): Promise<void> {
  const sig = await provider.connection.requestAirdrop(
    to,
    amount * LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(sig, "confirmed");
}

export async function createFundedWallet(
  provider: anchor.AnchorProvider,
  solAmount: number = 10
): Promise<Keypair> {
  const wallet = Keypair.generate();
  await airdropSol(provider, wallet.publicKey, solAmount);
  return wallet;
}

export function solToLamports(sol: number): anchor.BN {
  return new anchor.BN(sol * LAMPORTS_PER_SOL);
}
