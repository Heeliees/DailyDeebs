type Props = { distribution?: number[]; error?: string };

export function ScoreDistribution({ distribution, error }: Props) {
  const available = Array.isArray(distribution) && distribution.length === 5 && distribution.every(count => Number.isInteger(count) && count >= 0);
  if (!available) return <section aria-label="Today's score distribution" style={{ width: '100%', marginTop: 24 }}><h3>Today’s scores</h3><p className="stats-note">{error ? 'Score distribution is temporarily unavailable.' : 'Loading today’s score distribution…'}</p></section>;
  const maximum = Math.max(1, ...distribution.slice(1));
  const total = distribution.reduce((sum, count) => sum + count, 0);
  const format = (value: number) => value.toLocaleString();
  return <figure style={{ width: '100%', margin: '24px 0 0', padding: '20px 16px', background: '#121c23', border: '1px solid #414d55', borderRadius: 8, textAlign: 'left' }}>
    <figcaption style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>Today’s scores</figcaption>
    <p style={{ fontSize: '.875rem', color: '#b9c0c4', margin: '0 0 18px' }}>Number of players</p>
    <div role="list" aria-label="Players by score" style={{ display: 'grid', gap: 14 }}>
      {[1, 2, 3, 4].map(score => <div role="listitem" aria-label={`${score} out of 4: ${format(distribution[score])} players`} key={score} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) max-content', alignItems: 'center', gap: 12 }}>
        <span aria-hidden="true" style={{ fontSize: '1rem' }}>{score}/4</span>
        <div aria-hidden="true" style={{ height: 28, background: '#26323b', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${distribution[score] / maximum * 100}%`, background: '#d9ba7f', borderRadius: 3 }} /></div>
        <strong aria-hidden="true" style={{ minWidth: '2ch', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#f0dbb5' }}>{format(distribution[score])}</strong>
      </div>)}
    </div>
    <p style={{ margin: '18px 0 0', color: '#b9c0c4', fontSize: '.875rem', lineHeight: 1.5 }}>{total === 0 ? 'No completed trials recorded today yet.' : `${format(total)} completed trials today. ${format(distribution[0])} ${distribution[0] === 1 ? 'player scored' : 'players scored'} 0/4 (not shown).`}</p>
  </figure>;
}
