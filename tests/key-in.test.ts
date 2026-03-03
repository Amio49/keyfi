import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getProvider,
  getProgram,
  createFundedWallet,
  solToLamports,
} from "./helpers/setup";
import {
  fetchManifest,
  fetchVoterPosition,
  getEscrowBalance,
} from "./helpers/accounts";
import {
  findConfigPda,
  findManifestPda,
  findEscrowPda,
  findVoterPda,
} from "../sdk/src/pda";

describe("keyfi::key_in", () => {
  const provider = getProvider();
  const program = getProgram(provider);
  let manifestId: number;

  before(async () => {
    // Assumes protocol already initialized from manifest tests
    const [configPda] = findConfigPda(program.programId);
    const config = await program.account.protocolConfig.fetch(configPda);
    manifestId = config.manifestCount.toNumber();

    // Create a fresh manifest for key-in tests
    const [manifestPda] = findManifestPda(manifestId, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);

    await program.methods
      .createManifest(
        "Infer",
        "https://arweave.net/infer",
        { micro: {} },
        solToLamports(8)
      )
      .accounts({
        creator: provider.wallet.publicKey,
        config: configPda,
        manifest: manifestPda,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("accepts a valid key-in vote", async () => {
    const voter = await createFundedWallet(provider, 5);
    const [manifestPda] = findManifestPda(manifestId, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);
    const [voterPda] = findVoterPda(
      manifestPda,
      voter.publicKey,
      program.programId
    );

    const voteAmount = solToLamports(1);

    await program.methods
      .keyIn(voteAmount)
      .accounts({
        voter: voter.publicKey,
        manifest: manifestPda,
        escrow: escrowPda,
        voterPosition: voterPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    const manifest = await fetchManifest(program, manifestId);
    expect(manifest.totalDeposited.toNumber()).to.equal(1 * LAMPORTS_PER_SOL);
    expect(manifest.voterCount).to.equal(1);

    const position = await fetchVoterPosition(
      program,
      manifestPda,
      voter.publicKey
    );
    expect(position.depositedLamports.toNumber()).to.equal(
      1 * LAMPORTS_PER_SOL
    );
    expect(position.claimed).to.equal(false);
    expect(position.refunded).to.equal(false);
  });

  it("rejects votes below minimum", async () => {
    const voter = await createFundedWallet(provider, 1);
    const [manifestPda] = findManifestPda(manifestId, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);
    const [voterPda] = findVoterPda(
      manifestPda,
      voter.publicKey,
      program.programId
    );

    try {
      await program.methods
        .keyIn(new anchor.BN(10_000_000)) // 0.01 SOL — below 0.05 minimum
        .accounts({
          voter: voter.publicKey,
          manifest: manifestPda,
          escrow: escrowPda,
          voterPosition: voterPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown BelowMinimumVote");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("BelowMinimumVote");
    }
  });

  it("auto-triggers strike when goal is met", async () => {
    // Create a small manifest (5 SOL goal)
    const [configPda] = findConfigPda(program.programId);
    const config = await program.account.protocolConfig.fetch(configPda);
    const id = config.manifestCount.toNumber();

    const [manifestPda] = findManifestPda(id, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);

    await program.methods
      .createManifest(
        "Test Strike",
        "https://arweave.net/test",
        { micro: {} },
        solToLamports(5)
      )
      .accounts({
        creator: provider.wallet.publicKey,
        config: configPda,
        manifest: manifestPda,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Single large vote to meet the goal
    const whale = await createFundedWallet(provider, 20);
    const [voterPda] = findVoterPda(
      manifestPda,
      whale.publicKey,
      program.programId
    );

    await program.methods
      .keyIn(solToLamports(5))
      .accounts({
        voter: whale.publicKey,
        manifest: manifestPda,
        escrow: escrowPda,
        voterPosition: voterPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([whale])
      .rpc();

    const manifest = await fetchManifest(program, id);
    // Status 2 = Strike
    expect(Object.keys(manifest.status)[0]).to.equal("strike");
  });
});
