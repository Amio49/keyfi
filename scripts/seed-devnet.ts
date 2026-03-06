import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Seeds sample manifests on devnet for testing the frontend.
 *
 * Usage:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/seed-devnet.ts
 */

interface SeedManifest {
  name: string;
  uri: string;
  tier: object;
  goalSol: number;
}

const MANIFESTS: SeedManifest[] = [
  {
    name: "Neural Forge",
    uri: "https://arweave.net/keyfi/neural-forge",
    tier: { micro: {} },
    goalSol: 12,
  },
  {
    name: "Agent Protocol",
    uri: "https://arweave.net/keyfi/agent-protocol",
    tier: { standard: {} },
    goalSol: 45,
  },
  {
    name: "Infer",
    uri: "https://arweave.net/keyfi/infer",
    tier: { micro: {} },
    goalSol: 8,
  },
  {
    name: "Prompt Chain",
    uri: "https://arweave.net/keyfi/prompt-chain",
    tier: { standard: {} },
    goalSol: 30,
  },
  {
    name: "Model Hub",
    uri: "https://arweave.net/keyfi/model-hub",
    tier: { standard: {} },
    goalSol: 55,
  },
  {
    name: "Vault Mind",
    uri: "https://arweave.net/keyfi/vault-mind",
    tier: { premium: {} },
    goalSol: 120,
  },
];

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Keyfi;

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Seeding devnet with sample manifests...\n");

  for (const m of MANIFESTS) {
    const config = await program.account.protocolConfig.fetch(configPda);
    const id = config.manifestCount.toNumber();

    const [manifestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("manifest"), new anchor.BN(id).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), manifestPda.toBuffer()],
      program.programId
    );

    const goalLamports = new anchor.BN(m.goalSol * LAMPORTS_PER_SOL);

    const tx = await program.methods
      .createManifest(m.name, m.uri, m.tier, goalLamports)
      .accounts({
        creator: provider.wallet.publicKey,
        config: configPda,
        manifest: manifestPda,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`  [${id}] ${m.name} (${m.goalSol} SOL) — ${tx.slice(0, 16)}...`);
  }

  console.log("\nDone. Seeded", MANIFESTS.length, "manifests.");
}

main().catch(console.error);
