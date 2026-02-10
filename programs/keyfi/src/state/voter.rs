use anchor_lang::prelude::*;

/// Tracks an individual voter's position for a specific manifest.
/// One VoterPosition per (manifest, wallet) pair — no multiple deposits.
#[account]
#[derive(InitSpace)]
pub struct VoterPosition {
    /// The voter's wallet address
    pub voter: Pubkey,
    /// The manifest being voted on
    pub manifest: Pubkey,
    /// Total lamports deposited into escrow
    pub deposited_lamports: u64,
    /// Whether the airdrop has been claimed
    pub claimed: bool,
    /// Whether a refund has been processed
    pub refunded: bool,
    /// Timestamp of the initial deposit
    pub deposit_ts: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl VoterPosition {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 1 + 1 + 8 + 1;
}
