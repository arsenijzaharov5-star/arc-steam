export function RecentSales() {
  const sales = [
    ['Butterfly Knife | Fade', '2,149.00', '2 min ago'],
    ['AK-47 | Vulcan (FT)', '315.00', '7 min ago'],
    ['M4A1-S | Printstream', '355.00', '11 min ago'],
    ['AWP | Asiimov', '188.00', '16 min ago'],
  ]

  return (
    <div className="sales-strip">
      {sales.map(([name, price, time]) => (
        <div className="sale-pill" key={`${name}-${time}`}>
          <span className="sale-name">{name}</span>
          <span className="sale-price">{price} USDC</span>
          <span className="sale-time">{time}</span>
        </div>
      ))}
    </div>
  )
}
