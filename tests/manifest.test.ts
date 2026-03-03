import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { SystemProgram, Keypair } from "@solana/web3.js";
import {
  getProvider,
  getProgram,
  airdropSol,
  solToLamports,
} from "./helpers/setup";
import { fetchConfig, fetchManifest } from "./helpers/accounts";
import { findConfigPda, findManifestPda, findEscrowPda } from "../sdk/src/pda";

describe("keyfi::create_manifest", () => {
  const provider = getProvider();
  const program = getProgram(provider);
  const treasury = Keypair.generate().publicKey;

  before(async () => {
    // Initialize protocol
    const [configPda] = findConfigPda(program.programId);
    await program.methods
      .initialize(treasury)
      .accounts({
        authority: provider.wallet.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("creates a Micro tier manifest", async () => {
    const [configPda] = findConfigPda(program.programId);
    const [manifestPda] = findManifestPda(0, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);

    await program.methods
      .createManifest(
        "Neural Forge",
        "https://arweave.net/neural-forge-manifest",
        { micro: {} },
        solToLamports(10)
      )
      .accounts({
        creator: provider.wallet.publicKey,
        config: configPda,
        manifest: manifestPda,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const manifest = await fetchManifest(program, 0);
    expect(manifest.id.toNumber()).to.equal(0);
    expect(manifest.goalLamports.toNumber()).to.equal(10 * 1e9);
    expect(manifest.voterCount).to.equal(0);
    expect(manifest.totalDeposited.toNumber()).to.equal(0);

    const config = await fetchConfig(program);
    expect(config.manifestCount.toNumber()).to.equal(1);
  });

  it("creates a Standard tier manifest", async () => {
    const [configPda] = findConfigPda(program.programId);
    const [manifestPda] = findManifestPda(1, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);

    await program.methods
      .createManifest(
        "Agent Protocol",
        "https://arweave.net/agent-protocol",
        { standard: {} },
        solToLamports(45)
      )
      .accounts({
        creator: provider.wallet.publicKey,
        config: configPda,
        manifest: manifestPda,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const manifest = await fetchManifest(program, 1);
    expect(manifest.id.toNumber()).to.equal(1);
    expect(manifest.goalLamports.toNumber()).to.equal(45 * 1e9);
  });

  it("rejects invalid tier goal", async () => {
    const [configPda] = findConfigPda(program.programId);
    const [manifestPda] = findManifestPda(2, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);

    try {
      await program.methods
        .createManifest(
          "Bad Project",
          "https://arweave.net/bad",
          { micro: {} },
          solToLamports(50) // 50 SOL exceeds Micro max of 15
        )
        .accounts({
          creator: provider.wallet.publicKey,
          config: configPda,
          manifest: manifestPda,
          escrow: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      expect.fail("Should have thrown InvalidTierGoal");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("InvalidTierGoal");
    }
  });
});
