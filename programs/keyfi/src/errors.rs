use anchor_lang::prelude::*;

#[error_code]
pub enum KeyfiError {
    #[msg("Goal amount does not match the specified tier bounds")]
    InvalidTierGoal,

    #[msg("Vote amount is below the minimum threshold of 0.05 SOL")]
    BelowMinimumVote,

    #[msg("Manifest is not in the Key-In phase")]
    ManifestNotInKeyIn,

    #[msg("Key-In voting window has expired")]
    KeyInExpired,

    #[msg("Strike goal has already been met")]
    GoalAlreadyMet,

    #[msg("Strike goal has not been met")]
    GoalNotMet,

    #[msg("Refund window is still active; cannot close manifest")]
    RefundWindowActive,

    #[msg("Refund window has expired")]
    RefundWindowExpired,

    #[msg("Airdrop has already been claimed by this wallet")]
    AlreadyClaimed,

    #[msg("Refund has already been processed for this wallet")]
    AlreadyRefunded,

    #[msg("Unauthorized: signer does not have permission")]
    Unauthorized,

    #[msg("Protocol is currently paused")]
    ProtocolPaused,

    #[msg("Invalid manifest status for this operation")]
    InvalidManifestStatus,

    #[msg("Arithmetic overflow detected")]
    ArithmeticOverflow,

    #[msg("Name exceeds maximum length of 32 bytes")]
    NameTooLong,

    #[msg("URI exceeds maximum length of 200 bytes")]
    UriTooLong,

    #[msg("Key-In window has not ended yet")]
    KeyInNotExpired,

    #[msg("Manifest is not in Unlock status")]
    ManifestNotUnlocked,

    #[msg("Manifest is not in Strike status")]
    ManifestNotInStrike,

    #[msg("Cannot close manifest in current status")]
    CannotCloseManifest,
}
