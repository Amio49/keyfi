import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "KeyF1xVrgr9mTFSMk9r7v26CjRz2bqRNTaoc5ALnfNm"
);

/** Minimum SOL commitment per vote (0.05 SOL in lamports) */
export const MIN_VOTE_LAMPORTS = 50_000_000;

/** Key-In voting window duration (7 days in seconds) */
export const KEYIN_DURATION = 7 * 24 * 60 * 60;

/** Refund window after expiry (72 hours in seconds) */
export const REFUND_WINDOW = 72 * 60 * 60;

/** Micro tier bounds (in lamports) */
export const MICRO_MIN_LAMPORTS = 5_000_000_000;
export const MICRO_MAX_LAMPORTS = 15_000_000_000;

/** Standard tier bounds (in lamports) */
export const STANDARD_MIN_LAMPORTS = 25_000_000_000;
export const STANDARD_MAX_LAMPORTS = 60_000_000_000;

/** Premium tier minimum (in lamports) */
export const PREMIUM_MIN_LAMPORTS = 100_000_000_000;

/** Airdrop share: 80% of supply goes to voters */
export const AIRDROP_SHARE_BPS = 8_000;

/** Liquidity share: 20% of supply for pool injection */
export const LIQUIDITY_SHARE_BPS = 2_000;

/** Basis points denominator */
export const BPS_DENOMINATOR = 10_000;

/** Token decimals for minted project tokens */
export const TOKEN_DECIMALS = 6;

/** Default token supply (1 billion, pre-decimal) */
export const DEFAULT_SUPPLY = 1_000_000_000;

/** PDA seed constants */
export const SEEDS = {
  CONFIG: Buffer.from("config"),
  MANIFEST: Buffer.from("manifest"),
  ESCROW: Buffer.from("escrow"),
  VOTER: Buffer.from("voter"),
  MINT: Buffer.from("mint"),
  MINT_AUTHORITY: Buffer.from("authority"),
  VAULT: Buffer.from("vault"),
} as const;
