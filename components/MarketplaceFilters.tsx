'use client'

export function MarketplaceFilters() {
  return (
    <aside className="filters-panel card">
      <div className="filters-section">
        <div className="filters-title">Game</div>
        <button className="chip active">CS2</button>
      </div>

      <div className="filters-section">
        <div className="filters-title">Price range</div>
        <div className="grid" style={{ gap: 8 }}>
          <input className="input" placeholder="Min USDC" />
          <input className="input" placeholder="Max USDC" />
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-title">Condition</div>
        <div className="chip-wrap">
          <button className="chip">FN</button>
          <button className="chip">MW</button>
          <button className="chip">FT</button>
          <button className="chip">WW</button>
          <button className="chip">BS</button>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-title">Trading state</div>
        <div className="chip-wrap">
          <button className="chip active">Instant-ish</button>
          <button className="chip">Trade hold</button>
        </div>
      </div>
    </aside>
  )
}
