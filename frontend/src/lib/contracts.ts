// Aegis contract ABI + addresses

// Deployed on Base Sepolia only (2026-11-03, post-fix redeploy; USDC()
// verified on-chain as the Base Sepolia USDC below) — this address has no
// code on Base mainnet. A mainnet deployment still needs to happen;
// don't point mainnet users here.
export const AEGIS_ADDRESS = '0x46E971401a17b91bc2da0bdb120C63a5aE15E826' as const

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

// USDC differs per chain. The Sepolia token is NOT the mainnet address —
// using the mainnet address on Sepolia calls a non-contract address.
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base mainnet
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
}

export function usdcAddressForChain(chainId: number | undefined): `0x${string}` {
  return (chainId !== undefined && USDC_ADDRESSES[chainId]) || USDC_ADDRESSES[84532]
}

// Backwards-compatible default (Base mainnet). Prefer usdcAddressForChain().
export const USDC_ADDRESS = USDC_ADDRESSES[8453]

export const AEGIS_ABI = [
  // Events
  {
    type: 'event',
    name: 'AgentCreated',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'agentWallet', type: 'address', indexed: true },
      { name: 'dailyLimit', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Frozen',
    inputs: [{ name: 'agentWallet', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'Unfrozen',
    inputs: [{ name: 'agentWallet', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { name: 'agentWallet', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Spent',
    inputs: [
      { name: 'agentWallet', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'category', type: 'uint8', indexed: false },
      { name: 'intentId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'IntentCreated',
    inputs: [
      { name: 'intentId', type: 'uint256', indexed: true },
      { name: 'agent', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'maxAmount', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
    ],
  },

  // Read
  {
    type: 'function',
    name: 'getMyAgent',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'getAgent',
    stateMutability: 'view',
    inputs: [{ name: 'agentWallet', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'agentWallet', type: 'address' },
          { name: 'frozen', type: 'bool' },
          { name: 'dailyLimit', type: 'uint256' },
          { name: 'spentToday', type: 'uint256' },
          { name: 'lastDay', type: 'uint256' },
          { name: 'totalDeposited', type: 'uint256' },
          { name: 'totalSpent', type: 'uint256' },
          { name: 'totalWithdrawn', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'agentWallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getIntent',
    stateMutability: 'view',
    inputs: [{ name: 'intentId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'agent', type: 'address' },
          { name: 'description', type: 'string' },
          { name: 'category', type: 'uint8' },
          { name: 'maxAmount', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'active', type: 'bool' },
          { name: 'fulfilled', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'ownerToAgent',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
  },

  // Write
  {
    type: 'function',
    name: 'createAgent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentWallet', type: 'address' },
      { name: 'dailyLimit', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setDailyLimit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentWallet', type: 'address' },
      { name: 'newDailyLimit', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'freeze',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentWallet', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unfreeze',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentWallet', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentWallet', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentWallet', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'createIntent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentWallet', type: 'address' },
      { name: 'description', type: 'string' },
      { name: 'category', type: 'uint8' },
      { name: 'maxAmount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'intentId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'cancelIntent',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'intentId', type: 'uint256' }],
    outputs: [],
  },
] as const

export const USDC_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

export const CATEGORIES = [
  { id: 0, label: 'Other' },
  { id: 1, label: 'Shopping' },
  { id: 2, label: 'Travel' },
  { id: 3, label: 'Food' },
  { id: 4, label: 'Subscriptions' },
] as const
