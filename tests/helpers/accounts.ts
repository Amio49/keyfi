import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  findConfigPda,
  findManifestPda,
  findEscrowPda,
  findVoterPda,
} from "../../sdk/src/pda";

export async function fetchConfig(program: Program) {
  const [configPda] = findConfigPda(program.programId);
  return program.account.protocolConfig.fetch(configPda);
}

export async function fetchManifest(program: Program, manifestId: number) {
  const [manifestPda] = findManifestPda(manifestId, program.programId);
  return program.account.manifest.fetch(manifestPda);
}

export async function fetchEscrow(program: Program, manifestKey: PublicKey) {
  const [escrowPda] = findEscrowPda(manifestKey, program.programId);
  return program.account.projectEscrow.fetch(escrowPda);
}

export async function fetchVoterPosition(
  program: Program,
  manifestKey: PublicKey,
  voter: PublicKey
) {
  const [voterPda] = findVoterPda(manifestKey, voter, program.programId);
  return program.account.voterPosition.fetch(voterPda);
}

export async function getEscrowBalance(
  program: Program,
  manifestKey: PublicKey
): Promise<number> {
  const [escrowPda] = findEscrowPda(manifestKey, program.programId);
  const info = await program.provider.connection.getAccountInfo(escrowPda);
  return info?.lamports ?? 0;
}
