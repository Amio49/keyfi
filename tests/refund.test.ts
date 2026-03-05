import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { SystemProgram } from "@solana/web3.js";
import {
  getProvider,
  getProgram,
  createFundedWallet,
  solToLamports,
} from "./helpers/setup";
import {
  findConfigPda,
  findManifestPda,
  findEscrowPda,
  findVoterPda,
} from "../sdk/src/pda";

describe("keyfi::refund", () => {
  const provider = getProvider();
  const program = getProgram(provider);

  // NOTE: Refund tests require the manifest to be in Expired status,
  // which only happens after the Key-In window closes without reaching
  // the goal, followed by a check_strike crank call.
  //
  // Full refund testing requires clock manipulation (bankrun or warp-slot).

  it("rejects refund on active manifest", async () => {
    const [configPda] = findConfigPda(program.programId);
    const config = await program.account.protocolConfig.fetch(configPda);
    const id = config.manifestCount.toNumber();

    const [manifestPda] = findManifestPda(id, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);

    // Create manifest
    await program.methods
      .createManifest(
        "Refund Test",
        "https://arweave.net/refund",
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

    // Deposit
    const voter = await createFundedWallet(provider, 5);
    const [voterPda] = findVoterPda(
      manifestPda,
      voter.publicKey,
      program.programId
    );

    await program.methods
      .keyIn(solToLamports(1))
      .accounts({
        voter: voter.publicKey,
        manifest: manifestPda,
        escrow: escrowPda,
        voterPosition: voterPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to refund while manifest is still in KeyIn status
    try {
      await program.methods
        .refund()
        .accounts({
          voter: voter.publicKey,
          manifest: manifestPda,
          escrow: escrowPda,
          voterPosition: voterPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown InvalidManifestStatus");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("InvalidManifestStatus");
    }
  });
});
