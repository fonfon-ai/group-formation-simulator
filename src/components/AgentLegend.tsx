const ITEMS: Array<{ color: string; label: string }> = [
  { color: "#9ca3af", label: "gray: undecided" },
  { color: "#3b82f6", label: "blue: leaning toward going on to a next round" },
  { color: "#22c55e", label: "green: joined a circle/group (forming circle or confirmed group)" },
  { color: "#ef4444", label: "red: heading home" },
  { color: "#a855f7", label: "purple: leader / person forming a core" },
  { color: "#f97316", label: "orange: observerJoiner type (the one to watch)" },
];

export function AgentLegend() {
  return (
    <div className="panel legend">
      <h2>Legend</h2>
      <ul>
        {ITEMS.map((item) => (
          <li key={item.label}>
            <span className="dot" style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>
      <p className="legend-note">
        The larger the circle, the more initiative that person has. A thick orange
        outline marks the observerJoiner type (someone who wants to go but doesn't want to move the room themselves).
      </p>
    </div>
  );
}
