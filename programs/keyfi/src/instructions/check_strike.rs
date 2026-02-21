use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::KeyfiError;
use crate::state::*;

#[derive(Accounts)]
pub struct CheckStrike<'info> {
    /// Permissionless — anyone can crank this
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [MANIFEST_SEED, manifest.id.to_le_bytes().as_ref()],
        bump = manifest.bump,
        constraint = manifest.status == ManifestStatus::KeyIn @ KeyfiError::ManifestNotInKeyIn,
    )]
    pub manifest: Account<'info, Manifest>,
}

/// Permissionless crank to evaluate strike conditions after the Key-In window closes.
/// If the goal was met, transitions to Strike. Otherwise, transitions to Expired
/// and sets the refund deadline.
pub fn handler(ctx: Context<CheckStrike>) -> Result<()> {
    let clock = Clock::get()?;
    let manifest = &mut ctx.accounts.manifest;

    require!(
        clock.unix_timestamp >= manifest.keyin_end_ts,
        KeyfiError::KeyInNotExpired
    );

    if manifest.total_deposited >= manifest.goal_lamports {
        manifest.status = ManifestStatus::Strike;
        msg!(
            "Manifest #{} reached strike: {} / {} lamports",
            manifest.id,
            manifest.total_deposited,
            manifest.goal_lamports
        );
    } else {
        manifest.status = ManifestStatus::Expired;
        manifest.refund_deadline = clock
            .unix_timestamp
            .checked_add(REFUND_WINDOW)
            .ok_or(KeyfiError::ArithmeticOverflow)?;
        msg!(
            "Manifest #{} expired: {} / {} lamports (refund deadline: {})",
            manifest.id,
            manifest.total_deposited,
            manifest.goal_lamports,
            manifest.refund_deadline
        );
    }

    Ok(())
}
