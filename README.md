# Aegis

> **Live demo:** https://georgeonweb3.github.io/aegis-base/ · **Contract (Base Sepolia):** `0x5E16950ae0244908b1310b177966F479198B4fE7` · Foundry tests cover the deposit / withdraw / agentSpend money paths (24/24 pass, incl. per-transaction cap tests).

**The protective control layer for AI agents on Base.**

Users deposit USDC → set hard daily spend limits → create structured onchain intents → freeze the agent with one tap.

Built for the Base Ecosystem Fund focus on **Agentic Commerce**.

---

## Current Status

- [x] Smart contract (`contracts/Aegis.sol`) — complete
- [x] Foundry deploy script + tests (incl. deposit / withdraw / agentSpend money paths)
- [x] Frontend scaffold + full interactive UI (Create Agent, Deposit, Withdraw, Freeze, Create Intent, Change Limit)
- [x] Android-first PWA configuration
- [x] Critical fixes: `withdraw()` accounting (repeat-withdraw drain), per-chain USDC (constructor arg instead of hardcoded mainnet address), `hasAgent` zero-address check in the frontend
- [x] **Redeploy** contract to Base Sepolia (2026-11-24, perTxLimit): `0x5E16950ae0244908b1310b177966F479198B4fE7` — deploy tx `0xde913cefcc6046c38cef77669afb47f11922db2544714f2abeb5aea2650b9031`, block 63152505, Sourcify-verified exact match (creation + runtime). Adds a hard per-transaction spend cap (`perTxLimit`, enforced in `agentSpend` before the daily-limit check; `createAgent` now takes `(agentWallet, dailyLimit, perTxLimit)`). The 2026-11-03 deployment at `0x46E971401a17b91bc2da0bdb120C63a5aE15E826` is superseded (no per-tx cap). Mainnet deployment still pending.
- [x] Paste the new address into frontend
- [x] Activity feed + intents list (rebuilt from on-chain event logs in `useAegisFeed` — the contract has no enumeration, so the frontend scans from the deployment block and reads intent state with `getIntent`)
- [x] PWA icons (192/512/maskable + apple-touch-icon, generated from `favicon.svg`)
- [ ] Final Android testing + polish
- [ ] Public demo + grant application

---

## Project Structure

```
aegis/
├── contracts/
│   ├── Aegis.sol
│   ├── foundry.toml
│   ├── script/Deploy.s.sol
│   └── test/Aegis.t.sol
├── frontend/
│   ├── src/
│   │   ├── pages/Home.tsx      ← full UI + modals
│   │   ├── hooks/useAegis.ts   ← all contract interactions
│   │   ├── lib/contracts.ts
│   │   ├── lib/wagmi.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts          ← PWA ready
│   └── ...
└── README.md
```

---

## 1. Deploy the Contract

### Prerequisites
```bash
# Install Foundry if you don't have it
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Deploy to Base Sepolia (recommended first)
```bash
cd contracts

# Install forge-std (one time)
forge install foundry-rs/forge-std --no-commit

# Set your private key
export PRIVATE_KEY=0xyour_private_key_here

# Deploy
forge script script/Deploy.s.sol:DeployAegis \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --private-key $PRIVATE_KEY
```

Copy the printed address.

### Deploy to Base Mainnet
```bash
forge script script/Deploy.s.sol:DeployAegis \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --private-key $PRIVATE_KEY
```

### After deploy
Open `frontend/src/lib/contracts.ts` and replace:

```ts
export const AEGIS_ADDRESS = '0x0000000000000000000000000000000000000000'
```

with the real address.

---

## 2. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open on your Android phone (same Wi-Fi) or use Chrome device toolbar.

The app is a PWA — you can “Add to Home Screen” for a near-native experience.

---

## 3. Run Tests (optional)

```bash
cd contracts
forge test -vv
```

---

## Core Contract Features

| Feature              | Status |
|----------------------|--------|
| Create protected agent | ✅ |
| Hard daily USDC limit  | ✅ |
| Hard per-transaction USDC cap (`perTxLimit`) | ✅ |
| Emergency freeze       | ✅ |
| Deposit / Withdraw     | ✅ |
| Structured Intents     | ✅ |
| Agent-only spending    | ✅ |
| Pure Base USDC         | ✅ |

---

## Next concrete steps

1. Deploy to Sepolia and paste the address
2. Test full flow on Android (create → deposit → freeze → intent)
3. Add activity feed (parse `Spent` events into plain English)
4. Deploy to mainnet
5. Polish + ship + apply for Base grant / Batches

---

## License
MIT

---

## For AI agents

Machine-readable summary of this project: [llms.txt](https://georgeonweb3.github.io/aegis-base/llms.txt).
Aegis (aegis-base) is the spend control layer for AI agents on Base by George
Agbe ([georgeonweb3](https://github.com/georgeonweb3)): hard daily spend limits
and a per-transaction cap, structured onchain intents and a one-tap freeze,
enforced onchain before money moves.
