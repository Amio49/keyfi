use anchor_lang::prelude::*;

use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum ManifestStatus {
    /// Shadow period — project submitted, awaiting community audit
    Shadow,
    /// Key-In — voting window open, SOL deposits accepted
    KeyIn,
    /// Strike — goal reached, token minting in progress
    Strike,
    /// Unlock — tokens minted and distributed, airdrop claimable
    Unlock,
    /// Expired — goal not met within window, refunds available
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Tier {
    /// 5–15 SOL — simple AI wrappers, bots, experimental agents
    Micro,
    /// 25–60 SOL — fine-tuned LLMs, autonomous agents, AI tooling
    Standard,
    /// 100+ SOL — GPU infrastructure, DePIN agents, large-scale models
    Premium,
}

#[account]
pub struct Manifest {
    /// Unique manifest identifier
    pub id: u64,
    /// Creator / project submitter
    pub creator: Pubkey,
    /// Project name (fixed-size, right-padded with zeros)
    pub name: [u8; MAX_NAME_LEN],
    /// Metadata URI pointing to full manifest (IPFS / Arweave)
    pub uri: [u8; MAX_URI_LEN],
    /// Economic tier determining goal bounds
    pub tier: Tier,
    /// Strike goal in lamports
    pub goal_lamports: u64,
    /// Running total of deposited lamports
    pub total_deposited: u64,
    /// Number of unique voters
    pub voter_count: u32,
    /// Current lifecycle status
    pub status: ManifestStatus,
    /// Timestamp when Key-In voting window opened
    pub keyin_start_ts: i64,
    /// Timestamp when Key-In voting window closes
    pub keyin_end_ts: i64,
    /// SPL token mint address (populated at Strike)
    pub token_mint: Pubkey,
    /// Total token supply allocated for voter airdrop
    pub airdrop_supply: u64,
    /// Deadline for claiming refunds after expiry
    pub refund_deadline: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl Manifest {
    // 8 (discriminator) + 8 + 32 + 32 + 200 + 1 + 8 + 8 + 4 + 1 + 8 + 8 + 32 + 8 + 8 + 1 = 367
    pub const SIZE: usize = 8 + 8 + 32 + MAX_NAME_LEN + MAX_URI_LEN + 1 + 8 + 8 + 4 + 1 + 8 + 8 + 32 + 8 + 8 + 1;

    /// Validates that the goal amount falls within the tier's bounds
    pub fn validate_tier_goal(tier: &Tier, goal_lamports: u64) -> bool {
        match tier {
            Tier::Micro => {
                goal_lamports >= MICRO_MIN_LAMPORTS && goal_lamports <= MICRO_MAX_LAMPORTS
            }
            Tier::Standard => {
                goal_lamports >= STANDARD_MIN_LAMPORTS && goal_lamports <= STANDARD_MAX_LAMPORTS
            }
            Tier::Premium => goal_lamports >= PREMIUM_MIN_LAMPORTS,
        }
    }
}
