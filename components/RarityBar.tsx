export function RarityBar({ game }: { game: string }) {
  return (
    <div className="rarity-bar">
      <span className="rarity-dot blue" />
      <span className="rarity-dot purple" />
      <span className="rarity-dot pink" />
      <span className="rarity-dot gold" />
      <span className="muted" style={{ marginLeft: 8 }}>{game} market lot</span>
    </div>
  )
}
