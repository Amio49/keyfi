use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::Tier;

declare_id!("KeyF1xVrgr9mTFSMk9r7v26CjRz2bqRNTaoc5ALnfNm");

#[program]
pub mod keyfi {
    use super::*;

    /// Initialize the protocol configuration. Called once at deployment.
    pub fn initialize(ctx: Context<Initialize>, treasury: Pubkey) -> Result<()> {
        instructions::initialize::handler(ctx, treasury)
    }

    /// Submit a new project manifest and open the Key-In window.
    pub fn create_manifest(
        ctx: Context<CreateManifest>,
        name: String,
        uri: String,
        tier: Tier,
        goal_lamports: u64,
    ) -> Result<()> {
        instructions::create_manifest::handler(ctx, name, uri, tier, goal_lamports)
    }

    /// Vote on a manifest by depositing SOL into escrow.
    /// Automatically triggers Strike if the goal is met.
    pub fn key_in(ctx: Context<KeyIn>, amount: u64) -> Result<()> {
        instructions::key_in::handler(ctx, amount)
    }

    /// Permissionless crank to evaluate strike conditions after Key-In window closes.
    pub fn check_strike(ctx: Context<CheckStrike>) -> Result<()> {
        instructions::check_strike::handler(ctx)
    }

    /// Mint the project token and allocate supply for airdrop distribution.
    /// Only callable by the manifest creator after Strike is reached.
    pub fn mint_and_inject(ctx: Context<MintAndInject>) -> Result<()> {
        instructions::mint_and_inject::handler(ctx)
    }

    /// Claim pro-rata airdrop tokens based on SOL commitment.
    pub fn claim_airdrop(ctx: Context<ClaimAirdrop>) -> Result<()> {
        instructions::claim_airdrop::handler(ctx)
    }

    /// Claim a refund for an expired manifest within the refund window.
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        instructions::refund::handler(ctx)
    }

    /// Close a completed or expired manifest, reclaiming rent to the creator.
    pub fn close_manifest(ctx: Context<CloseManifest>) -> Result<()> {
        instructions::close_manifest::handler(ctx)
    }
}
