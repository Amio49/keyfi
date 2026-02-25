use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::KeyfiError;
use crate::state::*;

#[derive(Accounts)]
pub struct CloseManifest<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [MANIFEST_SEED, manifest.id.to_le_bytes().as_ref()],
        bump = manifest.bump,
        constraint = manifest.creator == creator.key() @ KeyfiError::Unauthorized,
        close = creator,
    )]
    pub manifest: Account<'info, Manifest>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, manifest.key().as_ref()],
        bump = escrow.bump,
        close = creator,
    )]
    pub escrow: Account<'info, ProjectEscrow>,

    pub system_program: Program<'info, System>,
}

/// Closes a manifest and its escrow, reclaiming rent to the creator.
/// Only callable when:
/// - Status is Unlock (distribution complete), or
/// - Status is Expired AND refund deadline has passed
pub fn handler(ctx: Context<CloseManifest>) -> Result<()> {
    let clock = Clock::get()?;
    let manifest = &ctx.accounts.manifest;

    match manifest.status {
        ManifestStatus::Unlock => {
            // Distribution complete, safe to close
        }
        ManifestStatus::Expired => {
            require!(
                clock.unix_timestamp > manifest.refund_deadline,
                KeyfiError::RefundWindowActive
            );
        }
        _ => {
            return Err(KeyfiError::CannotCloseManifest.into());
        }
    }

    msg!(
        "Manifest #{} closed, rent reclaimed to {}",
        manifest.id,
        ctx.accounts.creator.key()
    );

    Ok(())
}
