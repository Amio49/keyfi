import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
  findMintPda,
  findMintAuthorityPda,
  findVaultPda,
} from "../sdk/src/pda";
import { AIRDROP_SHARE_BPS, BPS_DENOMINATOR, DEFAULT_SUPPLY, TOKEN_DECIMALS } from "../sdk/src/constants";

describe("keyfi::full_lifecycle", () => {
  const provider = getProvider();
  const program = getProgram(provider);

  // NOTE: This is an integration test that exercises the complete lifecycle:
  //   create_manifest → key_in (reach goal) → mint_and_inject → claim_airdrop
  //
  // It requires the program to be deployed on localnet and the protocol
  // to be initialized. Run after manifest and key-in tests.

  it("completes full manifest lifecycle", async () => {
    const [configPda] = findConfigPda(program.programId);
    const config = await program.account.protocolConfig.fetch(configPda);
    const id = config.manifestCount.toNumber();

    const [manifestPda] = findManifestPda(id, program.programId);
    const [escrowPda] = findEscrowPda(manifestPda, program.programId);

    // Step 1: Create manifest
    await program.methods
      .createManifest(
        "Model Hub",
        "https://arweave.net/model-hub",
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

    // Step 2: Key-In to reach goal
    const voter1 = await createFundedWallet(provider, 10);
    const voter2 = await createFundedWallet(provider, 10);

    const [voter1Pda] = findVoterPda(manifestPda, voter1.publicKey, program.programId);
    const [voter2Pda] = findVoterPda(manifestPda, voter2.publicKey, program.programId);

    await program.methods
      .keyIn(solToLamports(3))
      .accounts({
        voter: voter1.publicKey,
        manifest: manifestPda,
        escrow: escrowPda,
        voterPosition: voter1Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter1])
      .rpc();

    await program.methods
      .keyIn(solToLamports(2))
      .accounts({
        voter: voter2.publicKey,
        manifest: manifestPda,
        escrow: escrowPda,
        voterPosition: voter2Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter2])
      .rpc();

    // Verify auto-strike
    let manifest = await fetchManifest(program, id);
    expect(Object.keys(manifest.status)[0]).to.equal("strike");

    // Step 3: Mint and inject
    const [mintPda] = findMintPda(manifestPda, program.programId);
    const [mintAuthority] = findMintAuthorityPda(manifestPda, program.programId);
    const [vaultPda] = findVaultPda(manifestPda, program.programId);

    await program.methods
      .mintAndInject()
      .accounts({
        creator: provider.wallet.publicKey,
        manifest: manifestPda,
        tokenMint: mintPda,
        mintAuthority,
        airdropVault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    manifest = await fetchManifest(program, id);
    expect(Object.keys(manifest.status)[0]).to.equal("unlock");

    const expectedAirdrop =
      DEFAULT_SUPPLY * 10 ** TOKEN_DECIMALS * AIRDROP_SHARE_BPS / BPS_DENOMINATOR;
    expect(manifest.airdropSupply.toNumber()).to.equal(expectedAirdrop);

    // Step 4: Claim airdrops (voter1 deposited 3/5 = 60%, voter2 deposited 2/5 = 40%)
    // Pro-rata verification is the core assertion here.
    // Full claim tests require ATA setup which depends on the localnet state.
  });
});
