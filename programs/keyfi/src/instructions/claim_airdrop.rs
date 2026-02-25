use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::KeyfiError;
use crate::state::*;

#[derive(Accounts)]
pub struct ClaimAirdrop<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        seeds = [MANIFEST_SEED, manifest.id.to_le_bytes().as_ref()],
        bump = manifest.bump,
        constraint = manifest.status == ManifestStatus::Unlock @ KeyfiError::ManifestNotUnlocked,
    )]
    pub manifest: Account<'info, Manifest>,

    #[account(
        mut,
        seeds = [VOTER_SEED, manifest.key().as_ref(), voter.key().as_ref()],
        bump = voter_position.bump,
        constraint = !voter_position.claimed @ KeyfiError::AlreadyClaimed,
        constraint = voter_position.voter == voter.key() @ KeyfiError::Unauthorized,
    )]
    pub voter_position: Account<'info, VoterPosition>,

    /// CHECK: PDA mint authority for signing transfers
    #[account(
        seeds = [MINT_SEED, b"authority", manifest.key().as_ref()],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    /// Program-owned vault holding airdrop tokens
    #[account(
        mut,
        seeds = [VAULT_SEED, manifest.key().as_ref()],
        bump,
    )]
    pub airdrop_vault: Account<'info, TokenAccount>,

    /// Voter's associated token account (init if needed)
    #[account(
        init_if_needed,
        payer = voter,
        associated_token::mint = token_mint,
        associated_token::authority = voter,
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    /// The project token mint
    /// CHECK: validated via manifest.token_mint constraint
    #[account(
        address = manifest.token_mint,
    )]
    pub token_mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimAirdrop>) -> Result<()> {
    let manifest = &ctx.accounts.manifest;
    let position = &mut ctx.accounts.voter_position;
    let manifest_key = manifest.key();

    // Pro-rata calculation: tokens = (user_sol / total_sol) * airdrop_supply
    let user_tokens = (position.deposited_lamports as u128)
        .checked_mul(manifest.airdrop_supply as u128)
        .ok_or(KeyfiError::ArithmeticOverflow)?
        .checked_div(manifest.total_deposited as u128)
        .ok_or(KeyfiError::ArithmeticOverflow)? as u64;

    // Transfer from vault to voter's token account
    let authority_seeds: &[&[u8]] = &[
        MINT_SEED,
        b"authority",
        manifest_key.as_ref(),
        &[ctx.bumps.mint_authority],
    ];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.airdrop_vault.to_account_info(),
                to: ctx.accounts.voter_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[authority_seeds],
        ),
        user_tokens,
    )?;

    position.claimed = true;

    msg!(
        "Airdrop claimed: {} tokens to {} (manifest #{})",
        user_tokens,
        ctx.accounts.voter.key(),
        manifest.id
    );

    Ok(())
}
