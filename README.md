# Aegis

> **Live demo:** https://georgeonweb3.github.io/aegis-base/ · **Contract (Base Sepolia):** `0x46E971401a17b91bc2da0bdb120C63a5aE15E826` · Foundry tests cover the deposit / withdraw / agentSpend money paths.

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
- [x] **Redeploy** contract to Base Sepolia (2026-11-03): `0x46E971401a17b91bc2da0bdb120C63a5aE15E826` — deploy tx `0xcdb8c29294df45b8fb84c29f8e88ba5e1652c0aa6674d2ebf153bcd65a27cca5`, `USDC()` verified on-chain as Base Sepolia USDC. (The old deployment at `0x414B…6A39` predates the fixes and was built against the mainnet USDC address, so it cannot move Sepolia USDC.) Mainnet deployment still pending.
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
