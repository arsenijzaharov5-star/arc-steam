'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type WalletContextValue = {
  walletAddress: string
  isConnected: boolean
  connect: (address?: string) => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

function randomWallet() {
  return '0x' + Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40)
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState('')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('demo_wallet_address') : null
    if (saved) setWalletAddress(saved)
  }, [])

  const value = useMemo<WalletContextValue>(() => ({
    walletAddress,
    isConnected: !!walletAddress,
    connect: (address?: string) => {
      const next = address || randomWallet()
      setWalletAddress(next)
      if (typeof window !== 'undefined') window.localStorage.setItem('demo_wallet_address', next)
    },
    disconnect: () => {
      setWalletAddress('')
      if (typeof window !== 'undefined') window.localStorage.removeItem('demo_wallet_address')
    },
  }), [walletAddress])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
