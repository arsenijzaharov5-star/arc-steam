export function StatsStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <section className="stats-strip">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <div className="stat-value">{item.value}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      ))}
    </section>
  )
}
