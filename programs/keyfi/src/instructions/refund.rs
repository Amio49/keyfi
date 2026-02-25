use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::KeyfiError;
use crate::state::*;

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [MANIFEST_SEED, manifest.id.to_le_bytes().as_ref()],
        bump = manifest.bump,
        constraint = manifest.status == ManifestStatus::Expired @ KeyfiError::InvalidManifestStatus,
    )]
    pub manifest: Account<'info, Manifest>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, manifest.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, ProjectEscrow>,

    #[account(
        mut,
        seeds = [VOTER_SEED, manifest.key().as_ref(), voter.key().as_ref()],
        bump = voter_position.bump,
        constraint = !voter_position.refunded @ KeyfiError::AlreadyRefunded,
        constraint = voter_position.voter == voter.key() @ KeyfiError::Unauthorized,
    )]
    pub voter_position: Account<'info, VoterPosition>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Refund>) -> Result<()> {
    let clock = Clock::get()?;
    let manifest = &mut ctx.accounts.manifest;
    let position = &mut ctx.accounts.voter_position;

    // Ensure we're within the refund window
    require!(
        clock.unix_timestamp <= manifest.refund_deadline,
        KeyfiError::RefundWindowExpired
    );

    let refund_amount = position.deposited_lamports;

    // Transfer lamports from escrow PDA back to voter
    // Using PDA signer seeds for the escrow account
    let manifest_key = manifest.key();
    let escrow_seeds: &[&[u8]] = &[
        ESCROW_SEED,
        manifest_key.as_ref(),
        &[ctx.accounts.escrow.bump],
    ];

    let escrow_info = ctx.accounts.escrow.to_account_info();
    let voter_info = ctx.accounts.voter.to_account_info();

    **escrow_info.try_borrow_mut_lamports()? -= refund_amount;
    **voter_info.try_borrow_mut_lamports()? += refund_amount;

    // Mark position as refunded
    position.refunded = true;

    // Decrement manifest tracking
    manifest.total_deposited = manifest
        .total_deposited
        .checked_sub(refund_amount)
        .ok_or(KeyfiError::ArithmeticOverflow)?;

    msg!(
        "Refund: {} lamports returned to {} (manifest #{})",
        refund_amount,
        ctx.accounts.voter.key(),
        manifest.id
    );

    Ok(())
}
