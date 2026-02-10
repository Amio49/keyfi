use anchor_lang::prelude::*;

/// Project-specific escrow account holding SOL deposits.
/// SOL is stored as lamports on this PDA. The struct tracks
/// the associated manifest for validation during transfers.
#[account]
#[derive(InitSpace)]
pub struct ProjectEscrow {
    /// The manifest this escrow belongs to
    pub manifest: Pubkey,
    /// PDA bump seed
    pub bump: u8,
}

impl ProjectEscrow {
    pub const SIZE: usize = 8 + 32 + 1;
}
