import BN from "bn.js";
import {
  MICRO_MIN_LAMPORTS,
  MICRO_MAX_LAMPORTS,
  STANDARD_MIN_LAMPORTS,
  STANDARD_MAX_LAMPORTS,
  PREMIUM_MIN_LAMPORTS,
} from "./constants";
import { Tier } from "./types";

/**
 * Calculate a voter's pro-rata airdrop allocation.
 *
 * Formula: tokens = (userLamports / totalLamports) * airdropSupply
 */
export function calculateAirdrop(
  userLamports: BN,
  totalLamports: BN,
  airdropSupply: BN
): BN {
  if (totalLamports.isZero()) {
    return new BN(0);
  }
  return userLamports.mul(airdropSupply).div(totalLamports);
}

/**
 * Determine the tier for a given goal amount in lamports.
 * Returns null if the goal doesn't fit any tier.
 */
export function getTierForGoal(goalLamports: number): Tier | null {
  if (goalLamports >= MICRO_MIN_LAMPORTS && goalLamports <= MICRO_MAX_LAMPORTS) {
    return Tier.Micro;
  }
  if (
    goalLamports >= STANDARD_MIN_LAMPORTS &&
    goalLamports <= STANDARD_MAX_LAMPORTS
  ) {
    return Tier.Standard;
  }
  if (goalLamports >= PREMIUM_MIN_LAMPORTS) {
    return Tier.Premium;
  }
  return null;
}

/**
 * Check whether the refund window is currently open for a manifest.
 */
export function isRefundWindowOpen(
  status: number,
  refundDeadline: BN,
  currentTimestamp: number
): boolean {
  // Status 4 = Expired
  if (status !== 4) return false;
  return new BN(currentTimestamp).lte(refundDeadline);
}

/**
 * Calculate the funding progress as a percentage (0-100).
 */
export function fundingProgress(
  totalDeposited: BN,
  goalLamports: BN
): number {
  if (goalLamports.isZero()) return 100;
  return Math.min(
    100,
    totalDeposited.mul(new BN(100)).div(goalLamports).toNumber()
  );
}

/**
 * Convert lamports to SOL with specified decimal places.
 */
export function lamportsToSol(lamports: BN | number, decimals = 2): string {
  const val = typeof lamports === "number" ? lamports : lamports.toNumber();
  return (val / 1_000_000_000).toFixed(decimals);
}
