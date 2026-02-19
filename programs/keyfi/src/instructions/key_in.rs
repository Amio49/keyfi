use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::constants::*;
use crate::errors::KeyfiError;
use crate::state::*;

#[derive(Accounts)]
pub struct KeyIn<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [MANIFEST_SEED, manifest.id.to_le_bytes().as_ref()],
        bump = manifest.bump,
        constraint = manifest.status == ManifestStatus::KeyIn @ KeyfiError::ManifestNotInKeyIn,
    )]
    pub manifest: Account<'info, Manifest>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, manifest.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, ProjectEscrow>,

    #[account(
        init,
        payer = voter,
        space = VoterPosition::SIZE,
        seeds = [VOTER_SEED, manifest.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub voter_position: Account<'info, VoterPosition>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<KeyIn>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let manifest = &mut ctx.accounts.manifest;

    // Validate timing and amount
    require!(
        clock.unix_timestamp < manifest.keyin_end_ts,
        KeyfiError::KeyInExpired
    );
    require!(amount >= MIN_VOTE_LAMPORTS, KeyfiError::BelowMinimumVote);

    // Transfer SOL from voter to escrow PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.voter.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        ),
        amount,
    )?;

    // Initialize voter position
    let position = &mut ctx.accounts.voter_position;
    position.voter = ctx.accounts.voter.key();
    position.manifest = manifest.key();
    position.deposited_lamports = amount;
    position.claimed = false;
    position.refunded = false;
    position.deposit_ts = clock.unix_timestamp;
    position.bump = ctx.bumps.voter_position;

    // Update manifest tallies
    manifest.total_deposited = manifest
        .total_deposited
        .checked_add(amount)
        .ok_or(KeyfiError::ArithmeticOverflow)?;
    manifest.voter_count = manifest
        .voter_count
        .checked_add(1)
        .ok_or(KeyfiError::ArithmeticOverflow)?;

    // Auto-strike: if goal is met, transition immediately
    if manifest.total_deposited >= manifest.goal_lamports {
        manifest.status = ManifestStatus::Strike;
        msg!(
            "Strike triggered for manifest #{}: {} lamports deposited",
            manifest.id,
            manifest.total_deposited
        );
    }

    msg!(
        "Key-In: {} lamports from {} (total: {}/{})",
        amount,
        ctx.accounts.voter.key(),
        manifest.total_deposited,
        manifest.goal_lamports
    );

    Ok(())
}
