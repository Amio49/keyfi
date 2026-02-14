use anchor_lang::prelude::*;

use crate::constants::CONFIG_SEED;
use crate::state::ProtocolConfig;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = ProtocolConfig::SIZE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, ProtocolConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, treasury: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.manifest_count = 0;
    config.treasury = treasury;
    config.paused = false;
    config.bump = ctx.bumps.config;

    msg!("KeyFi protocol initialized");
    Ok(())
}
