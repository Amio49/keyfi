import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

/**
 * One-time protocol initialization script.
 * Run after deployment to set up the ProtocolConfig account.
 *
 * Usage:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/init-protocol.ts [treasury_pubkey]
 */
async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Keyfi;

  const treasury = process.argv[2]
    ? new PublicKey(process.argv[2])
    : provider.wallet.publicKey;

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("─────────────────────────────────────");
  console.log("  KeyFi Protocol Initialization");
  console.log("─────────────────────────────────────");
  console.log("  Network:    ", provider.connection.rpcEndpoint);
  console.log("  Authority:  ", provider.wallet.publicKey.toBase58());
  console.log("  Treasury:   ", treasury.toBase58());
  console.log("  Config PDA: ", configPda.toBase58());
  console.log("  Program ID: ", program.programId.toBase58());
  console.log("");

  const tx = await program.methods
    .initialize(treasury)
    .accounts({
      authority: provider.wallet.publicKey,
      config: configPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("  ✓ Protocol initialized");
  console.log("  Tx:", tx);
  console.log("─────────────────────────────────────");
}

main().catch(console.error);
