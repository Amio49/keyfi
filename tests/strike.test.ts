import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { SystemProgram } from "@solana/web3.js";
import {
  getProvider,
  getProgram,
  createFundedWallet,
  solToLamports,
} from "./helpers/setup";
import { fetchManifest } from "./helpers/accounts";
import {
  findConfigPda,
  findManifestPda,
  findEscrowPda,
  findVoterPda,
} from "../sdk/src/pda";

describe("keyfi::check_strike", () => {
  const provider = getProvider();
  const program = getProgram(provider);

  it("rejects crank before key-in window ends", async () => {
    const [configPda] = findConfigPda(program.programId);
    const config = await program.account.protocolConfig.fetch(configPda);
    const id = config.manifestCount.toNumber();

    const [manifestPda] = findManifestPda(id, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);

    // Create manifest
    await program.methods
      .createManifest(
        "Crank Test",
        "https://arweave.net/crank",
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

    // Try to crank immediately (window hasn't expired)
    try {
      await program.methods
        .checkStrike()
        .accounts({
          caller: provider.wallet.publicKey,
          manifest: manifestPda,
        })
        .rpc();

      expect.fail("Should have thrown KeyInNotExpired");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("KeyInNotExpired");
    }
  });

  // NOTE: Full strike/expiry tests require clock manipulation
  // which is available via bankrun or solana-test-validator --warp-slot.
  // These integration tests are designed for use with the Anchor
  // localnet validator where time advancement is possible.
});
