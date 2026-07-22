import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { AEGIS_ADDRESS, AEGIS_ABI, USDC_ADDRESS, USDC_ABI } from '../lib/contracts'

export function useAegis() {
  const { address } = useAccount()

  const { data: myAgent, refetch: refetchMyAgent } = useReadContract({
    address: AEGIS_ADDRESS,
    abi: AEGIS_ABI,
    functionName: 'getMyAgent',
    query: {
      enabled: !!address && AEGIS_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  })

  const hasAgent = !!myAgent && myAgent !== '0x0000000000000000000000000000000000000000'

  const { data: agentData, refetch: refetchAgent } = useReadContract({
    address: AEGIS_ADDRESS,
    abi: AEGIS_ABI,
    functionName: 'getAgent',
    args: hasAgent ? [myAgent as `0x${string}`] : undefined,
    query: { enabled: hasAgent },
  })

  const { data: agentBalance, refetch: refetchBalance } = useReadContract({
    address: AEGIS_ADDRESS,
    abi: AEGIS_ABI,
    functionName: 'balanceOf',
    args: hasAgent ? [myAgent as `0x${string}`] : undefined,
    query: { enabled: hasAgent },
  })

  const { data: userUsdc, refetch: refetchUserUsdc } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract, data: txHash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const refresh = () => {
    refetchMyAgent()
    refetchAgent()
    refetchBalance()
    refetchUserUsdc()
  }

  // ---- Actions ----

  const createAgent = (agentWallet: `0x${string}`, dailyLimitUsd: number) => {
    const limit = parseUnits(dailyLimitUsd.toString(), 6)
    writeContract({
      address: AEGIS_ADDRESS,
      abi: AEGIS_ABI,
      functionName: 'createAgent',
      args: [agentWallet, limit],
    })
  }

  const setDailyLimit = (dailyLimitUsd: number) => {
    if (!myAgent) return
    const limit = parseUnits(dailyLimitUsd.toString(), 6)
    writeContract({
      address: AEGIS_ADDRESS,
      abi: AEGIS_ABI,
      functionName: 'setDailyLimit',
      args: [myAgent as `0x${string}`, limit],
    })
  }

  const freeze = () => {
    if (!myAgent) return
    writeContract({
      address: AEGIS_ADDRESS,
      abi: AEGIS_ABI,
      functionName: 'freeze',
      args: [myAgent as `0x${string}`],
    })
  }

  const unfreeze = () => {
    if (!myAgent) return
    writeContract({
      address: AEGIS_ADDRESS,
      abi: AEGIS_ABI,
      functionName: 'unfreeze',
      args: [myAgent as `0x${string}`],
    })
  }

  const approveUsdc = (amountUsd: number) => {
    const amount = parseUnits(amountUsd.toString(), 6)
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [AEGIS_ADDRESS, amount],
    })
  }

  const deposit = (amountUsd: number) => {
    if (!myAgent) return
    const amount = parseUnits(amountUsd.toString(), 6)
    writeContract({
      address: AEGIS_ADDRESS,
      abi: AEGIS_ABI,
      functionName: 'deposit',
      args: [myAgent as `0x${string}`, amount],
    })
  }

  const withdraw = (amountUsd: number) => {
    if (!myAgent) return
    const amount = parseUnits(amountUsd.toString(), 6)
    writeContract({
      address: AEGIS_ADDRESS,
      abi: AEGIS_ABI,
      functionName: 'withdraw',
      args: [myAgent as `0x${string}`, amount],
    })
  }

  const createIntent = (
    description: string,
    category: number,
    maxAmountUsd: number,
    deadlineHours: number
  ) => {
    if (!myAgent) return
    const maxAmount = parseUnits(maxAmountUsd.toString(), 6)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineHours * 3600)
    writeContract({
      address: AEGIS_ADDRESS,
      abi: AEGIS_ABI,
      functionName: 'createIntent',
      args: [myAgent as `0x${string}`, description, category, maxAmount, deadline],
    })
  }

  return {
    address,
    myAgent: myAgent as `0x${string}` | undefined,
    hasAgent,
    agentData,
    agentBalance,
    userUsdc,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    txHash,
    refresh,
    createAgent,
    setDailyLimit,
    freeze,
    unfreeze,
    approveUsdc,
    deposit,
    withdraw,
    createIntent,
    formatUsdc: (v: bigint | undefined) =>
      v !== undefined ? Number(formatUnits(v, 6)).toFixed(2) : '—',
  }
}
