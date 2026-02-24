use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::constants::*;
use crate::errors::KeyfiError;
use crate::state::*;

#[derive(Accounts)]
pub struct MintAndInject<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [MANIFEST_SEED, manifest.id.to_le_bytes().as_ref()],
        bump = manifest.bump,
        constraint = manifest.status == ManifestStatus::Strike @ KeyfiError::ManifestNotInStrike,
        constraint = manifest.creator == creator.key() @ KeyfiError::Unauthorized,
    )]
    pub manifest: Account<'info, Manifest>,

    #[account(
        init,
        payer = creator,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint_authority,
        seeds = [MINT_SEED, manifest.key().as_ref()],
        bump,
    )]
    pub token_mint: Account<'info, Mint>,

    /// CHECK: PDA used as mint authority, no data needed
    #[account(
        seeds = [MINT_SEED, b"authority", manifest.key().as_ref()],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    /// Token account to hold airdrop supply (program-owned vault)
    #[account(
        init,
        payer = creator,
        token::mint = token_mint,
        token::authority = mint_authority,
        seeds = [VAULT_SEED, manifest.key().as_ref()],
        bump,
    )]
    pub airdrop_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintAndInject>) -> Result<()> {
    let manifest = &mut ctx.accounts.manifest;
    let manifest_key = manifest.key();

    // Calculate supply allocations
    let total_supply = DEFAULT_SUPPLY
        .checked_mul(10u64.pow(TOKEN_DECIMALS as u32))
        .ok_or(KeyfiError::ArithmeticOverflow)?;

    let airdrop_supply = total_supply
        .checked_mul(AIRDROP_SHARE_BPS)
        .ok_or(KeyfiError::ArithmeticOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(KeyfiError::ArithmeticOverflow)?;

    // Mint authority signer seeds
    let authority_seeds: &[&[u8]] = &[
        MINT_SEED,
        b"authority",
        manifest_key.as_ref(),
        &[ctx.bumps.mint_authority],
    ];

    // Mint airdrop allocation to vault
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.airdrop_vault.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[authority_seeds],
        ),
        airdrop_supply,
    )?;

    // Update manifest state
    manifest.token_mint = ctx.accounts.token_mint.key();
    manifest.airdrop_supply = airdrop_supply;
    manifest.status = ManifestStatus::Unlock;

    msg!(
        "Manifest #{} minted: {} total supply, {} airdrop tokens",
        manifest.id,
        total_supply,
        airdrop_supply
    );

    // NOTE: Liquidity injection (remaining 20%) to Raydium/Orca pool
    // is handled by a separate permissioned instruction in production.
    // For devnet, liquidity tokens remain in the mint for manual injection.

    Ok(())
}
