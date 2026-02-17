use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::KeyfiError;
use crate::state::*;

#[derive(Accounts)]
pub struct CreateManifest<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.paused @ KeyfiError::ProtocolPaused,
    )]
    pub config: Account<'info, ProtocolConfig>,

    #[account(
        init,
        payer = creator,
        space = Manifest::SIZE,
        seeds = [MANIFEST_SEED, config.manifest_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub manifest: Account<'info, Manifest>,

    #[account(
        init,
        payer = creator,
        space = ProjectEscrow::SIZE,
        seeds = [ESCROW_SEED, manifest.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, ProjectEscrow>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateManifest>,
    name: String,
    uri: String,
    tier: Tier,
    goal_lamports: u64,
) -> Result<()> {
    require!(name.len() <= MAX_NAME_LEN, KeyfiError::NameTooLong);
    require!(uri.len() <= MAX_URI_LEN, KeyfiError::UriTooLong);
    require!(
        Manifest::validate_tier_goal(&tier, goal_lamports),
        KeyfiError::InvalidTierGoal
    );

    let config = &mut ctx.accounts.config;
    let manifest = &mut ctx.accounts.manifest;
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    // Pad name and URI into fixed-size arrays
    let mut name_bytes = [0u8; MAX_NAME_LEN];
    name_bytes[..name.len()].copy_from_slice(name.as_bytes());

    let mut uri_bytes = [0u8; MAX_URI_LEN];
    uri_bytes[..uri.len()].copy_from_slice(uri.as_bytes());

    manifest.id = config.manifest_count;
    manifest.creator = ctx.accounts.creator.key();
    manifest.name = name_bytes;
    manifest.uri = uri_bytes;
    manifest.tier = tier;
    manifest.goal_lamports = goal_lamports;
    manifest.total_deposited = 0;
    manifest.voter_count = 0;
    manifest.status = ManifestStatus::KeyIn;
    manifest.keyin_start_ts = clock.unix_timestamp;
    manifest.keyin_end_ts = clock
        .unix_timestamp
        .checked_add(KEYIN_DURATION)
        .ok_or(KeyfiError::ArithmeticOverflow)?;
    manifest.token_mint = Pubkey::default();
    manifest.airdrop_supply = 0;
    manifest.refund_deadline = 0;
    manifest.bump = ctx.bumps.manifest;

    escrow.manifest = manifest.key();
    escrow.bump = ctx.bumps.escrow;

    config.manifest_count = config
        .manifest_count
        .checked_add(1)
        .ok_or(KeyfiError::ArithmeticOverflow)?;

    msg!(
        "Manifest #{} created: {} ({:?} tier, {} SOL goal)",
        manifest.id,
        name,
        manifest.tier,
        goal_lamports / 1_000_000_000
    );

    Ok(())
}
