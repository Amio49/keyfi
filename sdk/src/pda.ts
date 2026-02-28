import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, SEEDS } from "./constants";
import BN from "bn.js";

/**
 * Derive the ProtocolConfig PDA.
 */
export function findConfigPda(
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.CONFIG], programId);
}

/**
 * Derive a Manifest PDA from its numeric ID.
 */
export function findManifestPda(
  manifestId: number | BN,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  const id = new BN(manifestId);
  return PublicKey.findProgramAddressSync(
    [SEEDS.MANIFEST, id.toArrayLike(Buffer, "le", 8)],
    programId
  );
}

/**
 * Derive the ProjectEscrow PDA for a given manifest.
 */
export function findEscrowPda(
  manifestKey: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ESCROW, manifestKey.toBuffer()],
    programId
  );
}

/**
 * Derive a VoterPosition PDA for a given manifest + voter wallet.
 */
export function findVoterPda(
  manifestKey: PublicKey,
  voter: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.VOTER, manifestKey.toBuffer(), voter.toBuffer()],
    programId
  );
}

/**
 * Derive the token Mint PDA for a given manifest.
 */
export function findMintPda(
  manifestKey: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.MINT, manifestKey.toBuffer()],
    programId
  );
}

/**
 * Derive the mint authority PDA for a given manifest.
 */
export function findMintAuthorityPda(
  manifestKey: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.MINT, SEEDS.MINT_AUTHORITY, manifestKey.toBuffer()],
    programId
  );
}

/**
 * Derive the airdrop vault PDA for a given manifest.
 */
export function findVaultPda(
  manifestKey: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.VAULT, manifestKey.toBuffer()],
    programId
  );
}
