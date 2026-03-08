# KeyFi

**Commit-to-Mint protocol on Solana.**

KeyFi is a decentralized launchpad for AI projects that uses Proof of Intent (PoI). Community members vote with SOL commitment before token creation, filtering for high-conviction projects with fair distribution.

[Website](https://keyfi.app) | [X](https://x.com/keydotfi)

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   MANIFEST   │────▶│    KEY-IN    │────▶│    STRIKE    │────▶│    UNLOCK    │
│  (Submit)    │     │  (Vote+SOL)  │     │  (Mint)      │     │  (Airdrop)  │
└──────────────┘     └──────┬───────┘     └──────────────┘     └──────────────┘
                            │ goal not met
                            ▼
                     ┌──────────────┐
                     │   EXPIRED    │
                     │  (Refund)    │
                     └──────────────┘
```

### Protocol Lifecycle

1. **Manifest** - Developer submits project metadata (name, architecture, URI) with a SOL strike goal
2. **Key-In** - Community votes by locking SOL into project-specific PDA escrow (min 0.05 SOL)
3. **Strike** - When escrow reaches 100% of target, token mint + liquidity injection triggers atomically
4. **Unlock** - Pro-rata airdrop to all voting wallets: `tokens = (user_sol / total_sol) * supply`

If the goal isn't met within the 7-day window, the manifest expires and voters can claim full refunds within 72 hours.

### Economic Tiers

| Tier | Goal Range | Use Case |
|------|-----------|----------|
| Micro | 5-15 SOL | AI wrappers, bots, experimental agents |
| Standard | 25-60 SOL | Fine-tuned LLMs, autonomous agents, AI tooling |
| Premium | 100+ SOL | GPU infrastructure, DePIN agents, large-scale models |

## Project Structure

```
programs/keyfi/src/
├── lib.rs                  # Program entrypoint
├── constants.rs            # Seeds, thresholds, tier bounds
├── errors.rs               # Custom error codes
├── state/                  # Account definitions
│   ├── config.rs           # ProtocolConfig (global singleton)
│   ├── manifest.rs         # Manifest + status/tier enums
│   ├── escrow.rs           # ProjectEscrow (SOL vault)
│   └── voter.rs            # VoterPosition (per-user deposit)
└── instructions/           # Program instructions
    ├── initialize.rs       # One-time protocol setup
    ├── create_manifest.rs  # Submit new project
    ├── key_in.rs           # Vote with SOL deposit
    ├── check_strike.rs     # Permissionless crank
    ├── mint_and_inject.rs  # Token creation + distribution
    ├── claim_airdrop.rs    # Pro-rata token claim
    ├── refund.rs           # Expired project refund
    └── close_manifest.rs   # Account cleanup

sdk/src/                    # TypeScript SDK
├── keyfi.ts                # KeyfiClient class
├── pda.ts                  # PDA derivation helpers
├── types.ts                # Account type definitions
├── constants.ts            # On-chain constant mirrors
└── utils.ts                # Airdrop math, tier validation
```

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (1.75+)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (2.0+)
- [Anchor](https://www.anchor-lang.com/docs/installation) (0.30.1)
- Node.js 18+

### Build

```bash
anchor build
```

### Test

```bash
anchor test
```

### Deploy (Devnet)

```bash
anchor deploy --provider.cluster devnet
npx ts-node scripts/init-protocol.ts
npx ts-node scripts/seed-devnet.ts
```

## Program ID

```
KeyF1xVrgr9mTFSMk9r7v26CjRz2bqRNTaoc5ALnfNm
```

## Security

- **Non-custodial escrow**: SOL held in program-locked PDAs, released only on goal completion or expiry
- **Anti-Sybil**: Minimum 0.05 SOL per vote prevents spam
- **Verified metadata**: On-chain hashed manifests prevent bait-and-switch
- **No pre-allocation**: Zero team tokens, zero VC allocation - 80% airdrop, 20% liquidity

## License

MIT
