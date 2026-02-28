import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export enum ManifestStatus {
  Shadow = 0,
  KeyIn = 1,
  Strike = 2,
  Unlock = 3,
  Expired = 4,
}

export enum Tier {
  Micro = 0,
  Standard = 1,
  Premium = 2,
}

export interface ProtocolConfig {
  authority: PublicKey;
  manifestCount: BN;
  treasury: PublicKey;
  paused: boolean;
  bump: number;
}

export interface Manifest {
  id: BN;
  creator: PublicKey;
  name: number[];
  uri: number[];
  tier: Tier;
  goalLamports: BN;
  totalDeposited: BN;
  voterCount: number;
  status: ManifestStatus;
  keyinStartTs: BN;
  keyinEndTs: BN;
  tokenMint: PublicKey;
  airdropSupply: BN;
  refundDeadline: BN;
  bump: number;
}

export interface ProjectEscrow {
  manifest: PublicKey;
  bump: number;
}

export interface VoterPosition {
  voter: PublicKey;
  manifest: PublicKey;
  depositedLamports: BN;
  claimed: boolean;
  refunded: boolean;
  depositTs: BN;
  bump: number;
}

/**
 * Decode a fixed-size byte array into a trimmed UTF-8 string.
 */
export function decodeFixedString(bytes: number[]): string {
  const end = bytes.indexOf(0);
  const slice = end === -1 ? bytes : bytes.slice(0, end);
  return Buffer.from(slice).toString("utf-8");
}
