import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './lib/wagmi'
import { Home } from './pages/Home'

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-full flex flex-col bg-aegis-bg text-aegis-text">
          <Home />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
