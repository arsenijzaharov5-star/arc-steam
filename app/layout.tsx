import './globals.css'
import type { Metadata } from 'next'
import { WalletProvider } from '@/components/WalletProvider'

export const metadata: Metadata = {
  title: 'Arc Steam Marketplace',
  description: 'Wallet-native Steam items marketplace with Arc USDC settlement',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
