'use client'

import { useWallet } from '@/components/WalletProvider'

function short(addr: string) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''
}

export function WalletButton() {
  const { walletAddress, isConnected, connect, disconnect } = useWallet()

  if (isConnected) {
    return (
      <button className="btn secondary" onClick={disconnect}>
        {short(walletAddress)} · Disconnect
      </button>
    )
  }

  return <button className="btn" onClick={() => connect()}>Connect wallet</button>
}
