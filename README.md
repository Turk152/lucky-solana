# LUCKY

A responsive Solana lottery-style website framework. Dark graphite, blue and lavender, a cinematic 8.5-second wallet reel, a shared three-minute countdown, winner confetti and optional synthesized audio.

## What works

- Shared, wall-clock-aligned three-minute **demo** rounds; refreshing does not restart a round.
- Holding-weighted selection over eight sample wallets, with an exact integer selection utility and unbiased entropy-to-ticket mapping for later integration.
- Dramatic decelerating wallet reel, winning-card glow, personalized win/loss/spectator result dialogs, winner confetti, sounds, history replay and reduced-motion handling.
- Phantom injected-provider connection, trusted reconnection, account-change and disconnect handling, ownership message signatures, missing-extension help, and a separate three-wallet demo portfolio.
- Multiple verified wallet addresses saved in D1 under a private per-user or browser-session identity. Each wallet has its own token and SOL balances; the position shows exact combined token holdings. Duplicate wallet addresses are counted once. Proofs expire after five minutes and cannot be reused. Users switch accounts in Phantom to link each wallet. Phantom does not expose every account at once.
- A server-side Solana RPC endpoint reads balances for a configured SPL or Token-2022 mint and displays percentage of total supply. Real winning odds remain unavailable until the eligible-holder snapshot exists.
- A top-right chat toggle, closed by default, opens shared D1 chat with three-second polling, persistent messages, guest names, 280-character limits, same-origin write protection and atomic four-second per-actor rate limiting. Guest names do not claim ownership of connected wallets.
- Mobile layout, keyboard-accessible dialogs and controls, an SVG favicon, and a feature-detected WebMCP preview action.

## Run locally

Requires Node 22.13+ (Node 24 is used for the TypeScript unit tests).

```sh
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lying_wilson_fisk.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_regular_clint_barton.sql
npm run dev
```

Apply each local database migration only once. Local preview starts on the address printed by the server. On Windows, if the npm shell shim fails, invoke its installed `npm-cli.js` through Node.

Checks:

```sh
node --test tests/draw.test.mjs
# With the local server running, verify the wallet linking API using disposable keys:
node tests/wallet-flow.mjs
npx tsc --noEmit --incremental false --target ES2022
npm run build
```

## Connect the project token

Copy `.env.example` to `.env` for local work. Configure the same keys in hosted Site environment variables:

| Variable | Purpose |
| --- | --- |
| TOKEN_MINT | The token's Solana mint address |
| TOKEN_SYMBOL | Display symbol; LUCKY by default |
| SOLANA_RPC_URL | An HTTPS Solana RPC endpoint; mainnet public RPC is the fallback |

The holdings endpoint sums all accounts owned by the wallet for that mint using raw integer amounts. Token accounts and supply are read with finalized commitment, but these reads do not constitute an authoritative draw snapshot. Provider rate limits can still apply. Phantom must be installed in the visitor's browser or the page must be opened in Phantom's mobile browser. Wallet ownership signatures verify the user controls each linked address; these signatures cannot authorize automatic treasury payouts. The demo view holds three sample wallets and has 18.5% of the sample eligible holdings. Total winnings sent remains zero because no real transfers occur.

Phantom extension prompts need a final user-approved end-to-end check in an extension-enabled browser; the Codex in-app browser cannot provide an installed Phantom extension. Backend integration tests verify real Ed25519 signatures from disposable in-memory keys, forged signatures, replay protection, two-wallet persistence, session isolation and unlink authorization. These tests do not transact on Solana.

## Real payout integration — intentionally not active

There is no treasury key, transaction signer, fee collector, VRF integration or unattended payout worker in this version. Every draw, history result and prize pool is simulated, regardless of whether a real Phantom wallet is connected. The deterministic sample generator is public and is **not suitable for real prizes**. Real token balances never join the sample draw.

The next implementation needs these explicit project decisions and components:

1. **Token and fee source:** identify the mint, chain, swap venue and which fees actually accrue to the treasury. Ordinary Solana network fees do not automatically become token-project revenue. If fees arrive in the token, specify conversion to SOL and slippage limits.
2. **Eligibility:** specify excluded treasury, pool, burn and escrow addresses; aggregate all token accounts by wallet; set a finalized snapshot slot and commit its ordered holdings and total. Decide whether flash-held balances qualify. Publish eligibility rules before launch.
3. **Selection:** request verifiable randomness after committing the snapshot, verify fulfillment and map bytes to an integer ticket without modulo bias. `selectWeightedIndex` and `unbiasedTicket` are reusable utilities, not a full randomness protocol. An AI agent must not choose or reroll winners.
4. **Three-minute worker:** use a server scheduler/keeper or on-chain program with rounds keyed by epoch. Advance states `open → snapshot_committed → randomness_requested → randomness_verified → payout_pending → confirmed`. Persist transitions with compare-and-swap/unique round constraints and distributed leases. Browser timers must never determine real eligibility or payouts. Chain or oracle delays can postpone confirmation beyond the three-minute target.
5. **Payout:** isolate each round's accumulated spendable fees, retain the specified rent/transaction reserve, and pay the committed winner from a treasury program. Use a per-round on-chain paid marker to prevent duplicate disbursements. Persist signatures, reconcile finalized transactions before retrying, and never mark a payout complete merely because submission succeeded. Keep keys out of the web client and source repository.
6. **Production chat:** add wallet-signature authentication if names should represent wallets, moderation/reporting, retention controls and operational abuse limits before public launch. The current chat uses clearly labeled guest identities.
7. **Launch:** review the contract and prize-draw rules for the intended markets before enabling funds. This private website demo does not establish that a paid prize draw is approved to operate.

## Main files

- `app/page.tsx`: draw room and round orchestration.
- `app/experience.tsx`: reel, winner effects, Phantom controls and shared chat.
- `app/wallets.tsx`: multiple-wallet linking, verification prompts, saved addresses and portfolio totals.
- `app/api/wallets/`: single-use ownership challenges, verified wallet records and unlinking.
- `lib/wallet-proof.ts`: Ed25519 signature verification.
- `lib/wallet-identity.ts`: user/session isolation for private wallet groups.
- `app/globals.css`: theme, responsive layout and animation.
- `app/api/draw/route.ts`: synchronized sample rounds.
- `app/api/holdings/route.ts`: read-only token balance lookup.
- `app/api/chat/route.ts`: persistent chat and rate limiting.
- `lib/draw.ts`: exact weighting, entropy mapping and explicit demo fixtures.
- `db/schema.ts`, `drizzle/`: persistent chat schema and migration.

Integration references: [Phantom provider](https://docs.phantom.com/solana/detecting-the-provider), [Phantom connections](https://docs.phantom.com/solana/establishing-a-connection), [Solana token accounts by owner](https://solana.com/docs/rpc/http/gettokenaccountsbyowner).
