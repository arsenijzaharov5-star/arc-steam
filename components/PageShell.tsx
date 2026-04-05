import type { ReactNode } from 'react'
import { Header } from '@/components/Header'

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="container shell">
      <Header />
      <section className="page-head">
        <div>
          <p className="eyebrow">Arc-native marketplace</p>
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
      </section>
      {children}
    </main>
  )
}
