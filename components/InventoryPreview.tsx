export function InventoryPreview() {
  const items = [
    ['AK-47 | Redline', 'FT', '129.50'],
    ['M4A1-S | Printstream', 'MW', '355.00'],
    ['USP-S | Kill Confirmed', 'FT', '188.00'],
    ['AWP | Asiimov', 'WW', '188.00'],
  ]

  return (
    <div className="inventory-list">
      {items.map(([name, wear, price]) => (
        <div key={name} className="inventory-row">
          <div className="inventory-thumb">CS2</div>
          <div style={{ minWidth: 0 }}>
            <div className="inventory-name">{name}</div>
            <div className="muted">Condition: {wear}</div>
          </div>
          <div className="inventory-price">{price} USDC</div>
        </div>
      ))}
    </div>
  )
}
