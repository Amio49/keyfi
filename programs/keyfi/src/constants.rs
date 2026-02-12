/// Minimum SOL commitment per vote (0.05 SOL in lamports)
pub const MIN_VOTE_LAMPORTS: u64 = 50_000_000;

/// Key-In voting window duration (7 days in seconds)
pub const KEYIN_DURATION: i64 = 7 * 24 * 60 * 60;

/// Refund window after expiry (72 hours in seconds)
pub const REFUND_WINDOW: i64 = 72 * 60 * 60;

/// Micro tier bounds (in lamports)
pub const MICRO_MIN_LAMPORTS: u64 = 5_000_000_000;
pub const MICRO_MAX_LAMPORTS: u64 = 15_000_000_000;

/// Standard tier bounds (in lamports)
pub const STANDARD_MIN_LAMPORTS: u64 = 25_000_000_000;
pub const STANDARD_MAX_LAMPORTS: u64 = 60_000_000_000;

/// Premium tier minimum (in lamports)
pub const PREMIUM_MIN_LAMPORTS: u64 = 100_000_000_000;

/// Airdrop share: 80% of supply goes to voters
pub const AIRDROP_SHARE_BPS: u64 = 8_000;

/// Liquidity share: 20% of supply for pool injection
pub const LIQUIDITY_SHARE_BPS: u64 = 2_000;

/// Basis points denominator
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Token decimals for minted project tokens
pub const TOKEN_DECIMALS: u8 = 6;

/// Default token supply (1 billion, pre-decimal)
pub const DEFAULT_SUPPLY: u64 = 1_000_000_000;

/// PDA seeds
pub const CONFIG_SEED: &[u8] = b"config";
pub const MANIFEST_SEED: &[u8] = b"manifest";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const VOTER_SEED: &[u8] = b"voter";
pub const MINT_SEED: &[u8] = b"mint";
pub const VAULT_SEED: &[u8] = b"vault";

/// Maximum name length (bytes)
pub const MAX_NAME_LEN: usize = 32;

/// Maximum URI length (bytes)
pub const MAX_URI_LEN: usize = 200;
