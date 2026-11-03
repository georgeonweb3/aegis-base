import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'
// Free public RPCs – good enough for MVP.
// PublicNode instead of *.base.org: the base.org endpoints limit
// eth_getLogs to a 200-block range, which makes the activity/intents
// event feed unusable. PublicNode allows 50k-block ranges.
const baseRpc = http('https://base-rpc.publicnode.com')
const baseSepoliaRpc = http('https://base-sepolia-rpc.publicnode.com')

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Aegis',
      preference: 'smartWalletOnly', // prioritise Base Account / Smart Wallet
    }),
    injected(),
    // WalletConnect needs a projectId – leave commented until you get a free one from cloud.walletconnect.com
    // walletConnect({ projectId: 'YOUR_PROJECT_ID' }),
  ],
  transports: {
    [base.id]: baseRpc,
    [baseSepolia.id]: baseSepoliaRpc,
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
