export function MarketCollections() {
  const collections = [
    ['Knives', 'High-value CS2 inventory'],
    ['Rifles', 'Most active CS2 market'],
    ['AWP Skins', 'Popular sniper lots'],
    ['Printstream', 'Recognizable CS2 skin family'],
  ]

  return (
    <div className="collections-grid">
      {collections.map(([title, subtitle]) => (
        <div key={title} className="collection-card">
          <div className="badge badge-soft">Collection</div>
          <h4>{title}</h4>
          <p>{subtitle}</p>
        </div>
      ))}
    </div>
  )
}
