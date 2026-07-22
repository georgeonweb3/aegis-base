import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

// Free public RPCs – good enough for MVP
const baseRpc = http('https://mainnet.base.org')
const baseSepoliaRpc = http('https://sepolia.base.org')

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
