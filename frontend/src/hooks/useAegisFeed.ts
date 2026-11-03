import { useCallback, useEffect, useRef, useState } from 'react'
import { useChainId, usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import {
  AEGIS_ABI,
  AEGIS_DEPLOY_BLOCKS,
  CATEGORIES,
  aegisAddressForChain,
} from '../lib/contracts'

// The contract has no feed or intent enumeration — both are rebuilt here
// from event logs (scanning from the deployment block, in chunks the
// public RPC accepts), plus getIntent() reads for intent details.

export interface ActivityItem {
  id: string
  kind: 'spent' | 'deposited' | 'withdrawn' | 'frozen' | 'unfrozen' | 'created' | 'intent' | 'limit'
  text: string
  txHash: string
  blockNumber: bigint
  timestamp?: number // unix seconds
}

export interface IntentItem {
  id: bigint
  description: string
  category: number
  categoryLabel: string
  maxAmount: bigint
  deadline: bigint
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired'
}

// PublicNode caps eth_getLogs at a 50k-block range (the base.org RPCs cap
// it at 200, which is why wagmi.ts points at PublicNode).
const CHUNK = 45000n

const usd = (v: bigint) => `$${Number(formatUnits(v, 6)).toFixed(2)}`
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
const categoryLabel = (id: number) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? 'Other'

export function useAegisFeed(myAgent: `0x${string}` | undefined, hasAgent: boolean) {
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [intents, setIntents] = useState<IntentItem[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(false)
  const running = useRef(false)

  const refetchFeed = useCallback(async () => {
    if (!publicClient || !myAgent || !hasAgent || running.current) return
    running.current = true
    setIsLoadingFeed(true)
    try {
      const address = aegisAddressForChain(chainId)
      const fromStart = AEGIS_DEPLOY_BLOCKS[chainId] ?? AEGIS_DEPLOY_BLOCKS[84532] ?? 0n
      const head = await publicClient.getBlockNumber()

      const getLogsChunked = async (
        eventName: string,
        args: Record<string, unknown>
      ): Promise<any[]> => {
        const out: any[] = []
        for (let from = fromStart; from <= head; from += CHUNK) {
          const to = from + CHUNK - 1n > head ? head : from + CHUNK - 1n
          // viem's getLogs abi/eventName generics are stricter than its
          // runtime; the loose call keeps this readable.
          try {
            const logs = await (publicClient.getLogs as any)({
              address,
              abi: AEGIS_ABI,
              eventName,
              args,
              fromBlock: from,
              toBlock: to,
            })
            out.push(...logs)
          } catch {
            // One failed chunk shouldn't empty the whole feed.
          }
        }
        return out
      }

      const byAgent = { agentWallet: myAgent }
      const [spent, deposited, withdrawn, frozen, unfrozen, created, limits, intentCreated] =
        await Promise.all([
          getLogsChunked('Spent', byAgent),
          getLogsChunked('Deposited', byAgent),
          getLogsChunked('Withdrawn', byAgent),
          getLogsChunked('Frozen', byAgent),
          getLogsChunked('Unfrozen', byAgent),
          getLogsChunked('AgentCreated', byAgent),
          getLogsChunked('LimitsUpdated', byAgent),
          getLogsChunked('IntentCreated', { agent: myAgent }),
        ])

      const items: ActivityItem[] = []
      const push = (
        log: any,
        kind: ActivityItem['kind'],
        text: string
      ) =>
        items.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          kind,
          text,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber ?? 0n,
        })

      for (const l of created)
        push(l, 'created', `Agent created with a ${usd(l.args.dailyLimit)}/day limit`)
      for (const l of deposited) push(l, 'deposited', `Deposited ${usd(l.args.amount)}`)
      for (const l of withdrawn) push(l, 'withdrawn', `Withdrew ${usd(l.args.amount)}`)
      for (const l of spent)
        push(
          l,
          'spent',
          `Agent spent ${usd(l.args.amount)} on ${categoryLabel(Number(l.args.category))}` +
            (l.args.intentId && l.args.intentId !== 0n
              ? ` (intent #${l.args.intentId})`
              : '') +
            ` → ${short(l.args.to)}`
        )
      for (const l of frozen) push(l, 'frozen', 'Agent frozen')
      for (const l of unfrozen) push(l, 'unfrozen', 'Agent unfrozen')
      for (const l of limits)
        push(l, 'limit', `Daily limit changed to ${usd(l.args.dailyLimit)}`)
      for (const l of intentCreated)
        push(l, 'intent', `New intent created: up to ${usd(l.args.maxAmount)}`)

      items.sort((a, b) => Number(b.blockNumber - a.blockNumber))

      // Block timestamps for display (few unique blocks in practice)
      const uniqueBlocks = [...new Set(items.map((i) => i.blockNumber))]
      const times = new Map<bigint, number>()
      await Promise.all(
        uniqueBlocks.map(async (bn) => {
          try {
            const block = await publicClient.getBlock({ blockNumber: bn })
            times.set(bn, Number(block.timestamp))
          } catch {
            /* timestamp is cosmetic — skip on failure */
          }
        })
      )
      for (const i of items) i.timestamp = times.get(i.blockNumber)

      setActivity(items)

      // Intents: discover ids from IntentCreated, then read current state
      const now = BigInt(Math.floor(Date.now() / 1000))
      const intentItems: IntentItem[] = []
      for (const l of intentCreated) {
        const id = l.args.intentId as bigint
        try {
          const intent = await publicClient.readContract({
            address,
            abi: AEGIS_ABI,
            functionName: 'getIntent',
            args: [id],
          })
          const status: IntentItem['status'] = intent.fulfilled
            ? 'fulfilled'
            : !intent.active
              ? 'cancelled'
              : intent.deadline < now
                ? 'expired'
                : 'active'
          intentItems.push({
            id,
            description: intent.description,
            category: Number(intent.category),
            categoryLabel: categoryLabel(Number(intent.category)),
            maxAmount: intent.maxAmount,
            deadline: intent.deadline,
            status,
          })
        } catch {
          /* skip intents that can't be read */
        }
      }
      intentItems.sort((a, b) => Number(b.id - a.id))
      setIntents(intentItems)
    } catch {
      // Feed is best-effort: a log-scan failure shouldn't break the app.
    } finally {
      running.current = false
      setIsLoadingFeed(false)
    }
  }, [publicClient, myAgent, hasAgent, chainId])

  useEffect(() => {
    refetchFeed()
  }, [refetchFeed])

  return { activity, intents, isLoadingFeed, refetchFeed }
}
