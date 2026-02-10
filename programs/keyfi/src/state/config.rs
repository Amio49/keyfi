use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    /// Protocol admin / governance authority
    pub authority: Pubkey,
    /// Auto-incrementing manifest ID counter
    pub manifest_count: u64,
    /// Treasury address for protocol fees (reserved)
    pub treasury: Pubkey,
    /// Emergency pause flag
    pub paused: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl ProtocolConfig {
    pub const SIZE: usize = 8 + 32 + 8 + 32 + 1 + 1;
}
