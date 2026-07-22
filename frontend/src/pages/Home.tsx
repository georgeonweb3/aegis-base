import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect, useState } from 'react'
import {
  Shield,
  Wallet,
  Snowflake,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAegis } from '../hooks/useAegis'
import { CATEGORIES } from '../lib/contracts'

type Modal = 'none' | 'create' | 'deposit' | 'withdraw' | 'intent' | 'limit'

export function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  const {
    hasAgent,
    myAgent,
    agentData,
    agentBalance,
    userUsdc,
    isPending,
    isSuccess,
    error,
    txHash,
    refresh,
    createAgent,
    freeze,
    unfreeze,
    approveUsdc,
    deposit,
    withdraw,
    createIntent,
    setDailyLimit,
    formatUsdc,
  } = useAegis()

  const [activeTab, setActiveTab] = useState<'overview' | 'intents' | 'activity'>('overview')
  const [modal, setModal] = useState<Modal>('none')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  // Form state
  const [agentAddress, setAgentAddress] = useState('')
  const [dailyLimit, setDailyLimitInput] = useState('50')
  const [amount, setAmount] = useState('')
  const [intentDesc, setIntentDesc] = useState('')
  const [intentCategory, setIntentCategory] = useState(1)
  const [intentMax, setIntentMax] = useState('')
  const [intentHours, setIntentHours] = useState('24')

  // Refresh on success
  useEffect(() => {
    if (isSuccess) {
      refresh()
      setStatusMsg('Transaction confirmed')
      setTimeout(() => {
        setModal('none')
        setStatusMsg(null)
        setAmount('')
        setIntentDesc('')
        setIntentMax('')
      }, 1800)
    }
  }, [isSuccess])

  useEffect(() => {
    if (error) {
      setStatusMsg(error.message?.slice(0, 100) || 'Transaction failed')
    }
  }, [error])

  // ---------- Not connected ----------
  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="w-16 h-16 rounded-2xl bg-aegis-panel border border-aegis-border flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-aegis-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Aegis</h1>
        <p className="text-aegis-muted text-center text-sm mb-8 max-w-xs leading-relaxed">
          Protective control layer for AI agents on Base.
          Set hard limits. Create intents. Stay in command.
        </p>

        <div className="w-full max-w-xs space-y-3">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isConnecting}
              className="w-full py-3.5 px-4 rounded-xl bg-aegis-accent text-black font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {isConnecting ? 'Connecting…' : `Connect ${connector.name}`}
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-aegis-muted">Built for Base · Agentic Commerce</p>
      </div>
    )
  }

  // ---------- Connected ----------
  return (
    <div className="flex-1 flex flex-col safe-top relative">
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-aegis-border">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-aegis-accent" />
          <span className="font-semibold tracking-tight">Aegis</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="text-xs text-aegis-muted font-mono truncate max-w-[120px]"
        >
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 py-5">
        {!hasAgent ? (
          <div className="bg-aegis-panel border border-aegis-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-aegis-bg border border-aegis-border flex items-center justify-center">
                <Wallet className="w-5 h-5 text-aegis-accent" />
              </div>
              <div>
                <h2 className="font-semibold">Create your Agent</h2>
                <p className="text-xs text-aegis-muted">One protected wallet for your AI</p>
              </div>
            </div>

            <p className="text-sm text-aegis-muted mb-5 leading-relaxed">
              Choose an address the AI will use, set a hard daily spend limit in USDC,
              and deposit funds. The agent can never exceed the limit or spend while frozen.
            </p>

            <button
              onClick={() => setModal('create')}
              className="w-full py-3.5 rounded-xl bg-aegis-accent text-black font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              Create Agent
            </button>
          </div>
        ) : (
          <>
            {/* Status card */}
            <div className="bg-aegis-panel border border-aegis-border rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      agentData?.frozen ? 'bg-aegis-danger' : 'bg-aegis-accent'
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {agentData?.frozen ? 'Frozen' : 'Active'}
                  </span>
                </div>
                <span className="text-xs text-aegis-muted font-mono">
                  {myAgent?.slice(0, 6)}…{myAgent?.slice(-4)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-aegis-muted uppercase tracking-wider mb-1">
                    Balance
                  </p>
                  <p className="text-xl font-semibold font-mono">
                    ${formatUsdc(agentBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-aegis-muted uppercase tracking-wider mb-1">
                    Daily Limit
                  </p>
                  <p className="text-xl font-semibold font-mono">
                    ${agentData ? formatUsdc(agentData.dailyLimit) : '—'}
                  </p>
                </div>
              </div>

              {agentData && (
                <div className="mt-3 pt-3 border-t border-aegis-border">
                  <div className="flex justify-between text-xs text-aegis-muted">
                    <span>Spent today</span>
                    <span className="font-mono">${formatUsdc(agentData.spentToday)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-aegis-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-aegis-accent rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Number(agentData.dailyLimit) > 0
                            ? (Number(agentData.spentToday) / Number(agentData.dailyLimit)) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <ActionButton
                icon={<ArrowDownToLine className="w-5 h-5" />}
                label="Deposit"
                onClick={() => setModal('deposit')}
              />
              <ActionButton
                icon={<ArrowUpFromLine className="w-5 h-5" />}
                label="Withdraw"
                onClick={() => setModal('withdraw')}
              />
              <ActionButton
                icon={<Snowflake className="w-5 h-5" />}
                label={agentData?.frozen ? 'Unfreeze' : 'Freeze'}
                danger={!agentData?.frozen}
                onClick={() => {
                  if (agentData?.frozen) unfreeze()
                  else freeze()
                }}
              />
              <ActionButton
                icon={<Plus className="w-5 h-5" />}
                label="Intent"
                onClick={() => setModal('intent')}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-aegis-panel rounded-xl p-1 border border-aegis-border">
              {(['overview', 'intents', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                    activeTab === tab ? 'bg-aegis-bg text-aegis-text' : 'text-aegis-muted'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-1">
                <InfoRow label="Your USDC" value={`$${formatUsdc(userUsdc)}`} />
                <InfoRow label="Agent address" value={myAgent || '—'} mono />
                <InfoRow
                  label="Total deposited"
                  value={agentData ? `$${formatUsdc(agentData.totalDeposited)}` : '—'}
                />
                <InfoRow
                  label="Total spent"
                  value={agentData ? `$${formatUsdc(agentData.totalSpent)}` : '—'}
                />
                <button
                  onClick={() => setModal('limit')}
                  className="w-full mt-4 py-3 rounded-xl border border-aegis-border text-sm text-aegis-muted"
                >
                  Change daily limit
                </button>
              </div>
            )}

            {activeTab === 'intents' && (
              <div className="text-center py-12 text-aegis-muted text-sm">
                <Plus className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No active intents yet</p>
                <p className="text-xs mt-1">Create one to give your agent clear instructions</p>
                <button
                  onClick={() => setModal('intent')}
                  className="mt-4 px-4 py-2 rounded-lg bg-aegis-panel border border-aegis-border text-xs"
                >
                  Create Intent
                </button>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="text-center py-12 text-aegis-muted text-sm">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No activity yet</p>
                <p className="text-xs mt-1">Agent spends will appear here in plain English</p>
              </div>
            )}
          </>
        )}
      </main>

      <div className="safe-bottom" />

      {/* ========== MODALS ========== */}
      {modal !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70">
          <div className="w-full max-w-md bg-aegis-panel border border-aegis-border rounded-t-2xl sm:rounded-2xl p-5 safe-bottom">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">
                {modal === 'create' && 'Create Agent'}
                {modal === 'deposit' && 'Deposit USDC'}
                {modal === 'withdraw' && 'Withdraw USDC'}
                {modal === 'intent' && 'Create Intent'}
                {modal === 'limit' && 'Set Daily Limit'}
              </h3>
              <button onClick={() => setModal('none')} className="p-1">
                <X className="w-5 h-5 text-aegis-muted" />
              </button>
            </div>

            {/* Status feedback */}
            {(isPending || statusMsg) && (
              <div
                className={`mb-4 px-3 py-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  isSuccess
                    ? 'bg-aegis-accent/10 text-aegis-accent'
                    : error
                    ? 'bg-aegis-danger/10 text-aegis-danger'
                    : 'bg-aegis-bg text-aegis-muted'
                }`}
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                {error && <AlertCircle className="w-3.5 h-3.5" />}
                <span className="truncate">
                  {isPending
                    ? 'Confirm in wallet…'
                    : statusMsg || (txHash ? `Tx: ${txHash.slice(0, 10)}…` : '')}
                </span>
              </div>
            )}

            {/* CREATE AGENT */}
            {modal === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-aegis-muted mb-1.5 block">
                    Agent wallet address
                  </label>
                  <input
                    value={agentAddress}
                    onChange={(e) => setAgentAddress(e.target.value)}
                    placeholder="0x…"
                    className="w-full bg-aegis-bg border border-aegis-border rounded-xl px-3 py-3 text-sm font-mono outline-none focus:border-aegis-accent"
                  />
                  <p className="text-[11px] text-aegis-muted mt-1.5">
                    This is the address your AI agent will use. You can use a fresh burner or a
                    smart account.
                  </p>
                </div>
                <div>
                  <label className="text-xs text-aegis-muted mb-1.5 block">
                    Daily spend limit (USDC)
                  </label>
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimitInput(e.target.value)}
                    placeholder="50"
                    className="w-full bg-aegis-bg border border-aegis-border rounded-xl px-3 py-3 text-sm outline-none focus:border-aegis-accent"
                  />
                </div>
                <button
                  disabled={isPending || !agentAddress || !dailyLimit}
                  onClick={() => createAgent(agentAddress as `0x${string}`, Number(dailyLimit))}
                  className="w-full py-3.5 rounded-xl bg-aegis-accent text-black font-semibold text-sm disabled:opacity-50"
                >
                  {isPending ? 'Creating…' : 'Create Agent'}
                </button>
              </div>
            )}

            {/* DEPOSIT */}
            {modal === 'deposit' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-aegis-muted mb-1.5 block">Amount (USDC)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25"
                    className="w-full bg-aegis-bg border border-aegis-border rounded-xl px-3 py-3 text-sm outline-none focus:border-aegis-accent"
                  />
                  <p className="text-[11px] text-aegis-muted mt-1.5">
                    Your balance: ${formatUsdc(userUsdc)}
                  </p>
                </div>

                <button
                  disabled={isPending || !amount}
                  onClick={() => approveUsdc(Number(amount))}
                  className="w-full py-3.5 rounded-xl bg-aegis-accent text-black font-semibold text-sm disabled:opacity-50"
                >
                  {isPending ? 'Approving…' : '1. Approve USDC'}
                </button>

                <button
                  disabled={isPending || !amount}
                  onClick={() => deposit(Number(amount))}
                  className="w-full py-3.5 rounded-xl border border-aegis-border font-semibold text-sm disabled:opacity-50"
                >
                  {isPending ? 'Depositing…' : '2. Deposit'}
                </button>
              </div>
            )}

            {/* WITHDRAW */}
            {modal === 'withdraw' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-aegis-muted mb-1.5 block">Amount (USDC)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10"
                    className="w-full bg-aegis-bg border border-aegis-border rounded-xl px-3 py-3 text-sm outline-none focus:border-aegis-accent"
                  />
                  <p className="text-[11px] text-aegis-muted mt-1.5">
                    Agent balance: ${formatUsdc(agentBalance)}
                  </p>
                </div>
                <button
                  disabled={isPending || !amount}
                  onClick={() => withdraw(Number(amount))}
                  className="w-full py-3.5 rounded-xl bg-aegis-accent text-black font-semibold text-sm disabled:opacity-50"
                >
                  {isPending ? 'Withdrawing…' : 'Withdraw'}
                </button>
              </div>
            )}

            {/* CREATE INTENT */}
            {modal === 'intent' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-aegis-muted mb-1.5 block">Description</label>
                  <input
                    value={intentDesc}
                    onChange={(e) => setIntentDesc(e.target.value)}
                    placeholder="Buy cheapest flight NYC → Miami under $180"
                    className="w-full bg-aegis-bg border border-aegis-border rounded-xl px-3 py-3 text-sm outline-none focus:border-aegis-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-aegis-muted mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setIntentCategory(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${
                          intentCategory === c.id
                            ? 'bg-aegis-accent text-black border-aegis-accent'
                            : 'border-aegis-border text-aegis-muted'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-aegis-muted mb-1.5 block">Max amount ($)</label>
                    <input
                      type="number"
                      value={intentMax}
                      onChange={(e) => setIntentMax(e.target.value)}
                      placeholder="180"
                      className="w-full bg-aegis-bg border border-aegis-border rounded-xl px-3 py-3 text-sm outline-none focus:border-aegis-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-aegis-muted mb-1.5 block">Expires (hours)</label>
                    <input
                      type="number"
                      value={intentHours}
                      onChange={(e) => setIntentHours(e.target.value)}
                      placeholder="24"
                      className="w-full bg-aegis-bg border border-aegis-border rounded-xl px-3 py-3 text-sm outline-none focus:border-aegis-accent"
                    />
                  </div>
                </div>
                <button
                  disabled={isPending || !intentDesc || !intentMax}
                  onClick={() =>
                    createIntent(intentDesc, intentCategory, Number(intentMax), Number(intentHours))
                  }
                  className="w-full py-3.5 rounded-xl bg-aegis-accent text-black font-semibold text-sm disabled:opacity-50"
                >
                  {isPending ? 'Creating…' : 'Create Intent'}
                </button>
              </div>
            )}

            {/* CHANGE LIMIT */}
            {modal === 'limit' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-aegis-muted mb-1.5 block">
                    New daily limit (USDC)
                  </label>
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimitInput(e.target.value)}
                    placeholder="100"
                    className="w-full bg-aegis-bg border border-aegis-border rounded-xl px-3 py-3 text-sm outline-none focus:border-aegis-accent"
                  />
                </div>
                <button
                  disabled={isPending || !dailyLimit}
                  onClick={() => setDailyLimit(Number(dailyLimit))}
                  className="w-full py-3.5 rounded-xl bg-aegis-accent text-black font-semibold text-sm disabled:opacity-50"
                >
                  {isPending ? 'Updating…' : 'Update Limit'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionButton({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-aegis-panel border border-aegis-border active:scale-[0.97] transition-transform"
    >
      <div className={danger ? 'text-aegis-danger' : 'text-aegis-text'}>{icon}</div>
      <span className="text-[11px] text-aegis-muted">{label}</span>
    </button>
  )
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-aegis-border last:border-0">
      <span className="text-sm text-aegis-muted">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
        {value.length > 22 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value}
      </span>
    </div>
  )
}
