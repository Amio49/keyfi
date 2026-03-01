import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { PROGRAM_ID } from "./constants";
import {
  findConfigPda,
  findManifestPda,
  findEscrowPda,
  findVoterPda,
  findMintPda,
  findMintAuthorityPda,
  findVaultPda,
} from "./pda";
import type { Manifest, ProtocolConfig, VoterPosition } from "./types";
import { Tier } from "./types";

export class KeyfiClient {
  readonly program: Program;
  readonly provider: AnchorProvider;
  readonly programId: PublicKey;

  constructor(provider: AnchorProvider, programId: PublicKey = PROGRAM_ID) {
    this.provider = provider;
    this.programId = programId;
    // Program is loaded from IDL — in production, import the generated IDL
    this.program = new Program(require("../target/idl/keyfi.json"), provider);
  }

  // ─── Instructions ──────────────────────────────────────────────

  async initialize(treasury: PublicKey): Promise<string> {
    const [config] = findConfigPda(this.programId);

    return this.program.methods
      .initialize(treasury)
      .accounts({
        authority: this.provider.wallet.publicKey,
        config,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async createManifest(
    name: string,
    uri: string,
    tier: Tier,
    goalLamports: BN
  ): Promise<{ tx: string; manifestId: number }> {
    const config = await this.getConfig();
    const manifestId = config.manifestCount.toNumber();
    const [manifestPda] = findManifestPda(manifestId, this.programId);
    const [escrowPda] = findEscrowPda(manifestPda, this.programId);
    const [configPda] = findConfigPda(this.programId);

    const tierArg = { [Tier[tier].toLowerCase()]: {} };

    const tx = await this.program.methods
      .createManifest(name, uri, tierArg, goalLamports)
      .accounts({
        creator: this.provider.wallet.publicKey,
        config: configPda,
        manifest: manifestPda,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, manifestId };
  }

  async keyIn(manifestId: number, amount: BN): Promise<string> {
    const [manifestPda] = findManifestPda(manifestId, this.programId);
    const [escrowPda] = findEscrowPda(manifestPda, this.programId);
    const [voterPda] = findVoterPda(
      manifestPda,
      this.provider.wallet.publicKey,
      this.programId
    );

    return this.program.methods
      .keyIn(amount)
      .accounts({
        voter: this.provider.wallet.publicKey,
        manifest: manifestPda,
        escrow: escrowPda,
        voterPosition: voterPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async checkStrike(manifestId: number): Promise<string> {
    const [manifestPda] = findManifestPda(manifestId, this.programId);

    return this.program.methods
      .checkStrike()
      .accounts({
        caller: this.provider.wallet.publicKey,
        manifest: manifestPda,
      })
      .rpc();
  }

  async mintAndInject(manifestId: number): Promise<string> {
    const [manifestPda] = findManifestPda(manifestId, this.programId);
    const [mintPda] = findMintPda(manifestPda, this.programId);
    const [mintAuthority] = findMintAuthorityPda(manifestPda, this.programId);
    const [vaultPda] = findVaultPda(manifestPda, this.programId);

    return this.program.methods
      .mintAndInject()
      .accounts({
        creator: this.provider.wallet.publicKey,
        manifest: manifestPda,
        tokenMint: mintPda,
        mintAuthority,
        airdropVault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
  }

  async claimAirdrop(manifestId: number): Promise<string> {
    const [manifestPda] = findManifestPda(manifestId, this.programId);
    const [mintPda] = findMintPda(manifestPda, this.programId);
    const [mintAuthority] = findMintAuthorityPda(manifestPda, this.programId);
    const [vaultPda] = findVaultPda(manifestPda, this.programId);
    const [voterPda] = findVoterPda(
      manifestPda,
      this.provider.wallet.publicKey,
      this.programId
    );

    const voterAta = await PublicKey.findProgramAddressSync(
      [
        this.provider.wallet.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintPda.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];

    return this.program.methods
      .claimAirdrop()
      .accounts({
        voter: this.provider.wallet.publicKey,
        manifest: manifestPda,
        voterPosition: voterPda,
        mintAuthority,
        airdropVault: vaultPda,
        voterTokenAccount: voterAta,
        tokenMint: mintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async refund(manifestId: number): Promise<string> {
    const [manifestPda] = findManifestPda(manifestId, this.programId);
    const [escrowPda] = findEscrowPda(manifestPda, this.programId);
    const [voterPda] = findVoterPda(
      manifestPda,
      this.provider.wallet.publicKey,
      this.programId
    );

    return this.program.methods
      .refund()
      .accounts({
        voter: this.provider.wallet.publicKey,
        manifest: manifestPda,
        escrow: escrowPda,
        voterPosition: voterPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async closeManifest(manifestId: number): Promise<string> {
    const [manifestPda] = findManifestPda(manifestId, this.programId);
    const [escrowPda] = findEscrowPda(manifestPda, this.programId);

    return this.program.methods
      .closeManifest()
      .accounts({
        creator: this.provider.wallet.publicKey,
        manifest: manifestPda,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // ─── Fetch ─────────────────────────────────────────────────────

  async getConfig(): Promise<ProtocolConfig> {
    const [configPda] = findConfigPda(this.programId);
    return this.program.account.protocolConfig.fetch(
      configPda
    ) as Promise<ProtocolConfig>;
  }

  async getManifest(manifestId: number): Promise<Manifest> {
    const [manifestPda] = findManifestPda(manifestId, this.programId);
    return this.program.account.manifest.fetch(
      manifestPda
    ) as Promise<Manifest>;
  }

  async getVoterPosition(
    manifestId: number,
    voter: PublicKey
  ): Promise<VoterPosition> {
    const [manifestPda] = findManifestPda(manifestId, this.programId);
    const [voterPda] = findVoterPda(manifestPda, voter, this.programId);
    return this.program.account.voterPosition.fetch(
      voterPda
    ) as Promise<VoterPosition>;
  }

  async getAllManifests(): Promise<Manifest[]> {
    const accounts = await this.program.account.manifest.all();
    return accounts.map((a) => a.account as unknown as Manifest);
  }
}
