export type DailySummary = { distribution: number[]; average: number | null; players: number };
type Props = { combined?: DailySummary; easy?: DailySummary; hard?: DailySummary; error?: string };
export function ScoreDistribution({ combined, easy, hard, error }: Props) {
  if(error || !combined || !easy || !hard) return <section className="daily-chart"><h3>Today’s scores</h3><p>{error ? 'Score statistics are temporarily unavailable. Your result is saved in this browser.' : 'Loading today’s scores…'}</p></section>;
  const groups=[{key:'easy',label:'Easy',stats:easy},{key:'hard',label:'Hard',stats:hard},{key:'combined',label:'Combined',stats:combined}];
  const maximum=Math.max(1,...groups.flatMap(g=>g.stats.distribution));
  return <section className="daily-chart" aria-label="Today's score distribution">
    <h3>Today’s scores</h3>
    <div className="mode-averages">{groups.map(g=><div key={g.key}><strong>{g.stats.average===null?'—':`${g.stats.average.toFixed(2)}/4`}</strong><span>{g.label} average</span><small>{g.stats.players.toLocaleString()} players</small></div>)}</div>
    <div className="chart-legend">{groups.map(g=><span key={g.key}><i className={g.key}/>{g.label}</span>)}</div>
    <p className="chart-axis">Number of players · shared scale: 0–{maximum}</p>
    <div className="grouped-chart" role="img" aria-label="Daily player counts by score for Easy, Hard and Combined. Exact counts are in the table below.">
      {[0,1,2,3,4].map(score=><div className="score-group" key={score}><div className="score-bars">{groups.map(g=><span key={g.key} className={g.key} style={{height:`${g.stats.distribution[score]/maximum*100}%`}} title={`${g.label}: ${g.stats.distribution[score]} players scored ${score}/4`}/>)}</div><span>{score}/4</span></div>)}
    </div>
    {combined.players===0&&<p>No completed trials yet today.</p>}
    <details className="score-counts"><summary>View exact counts</summary><table><caption>Players by score today</caption><thead><tr><th scope="col">Score</th>{groups.map(g=><th scope="col" key={g.key}>{g.label}</th>)}</tr></thead><tbody>{[0,1,2,3,4].map(score=><tr key={score}><th scope="row">{score}/4</th>{groups.map(g=><td key={g.key}>{g.stats.distribution[score]}</td>)}</tr>)}</tbody></table></details>
  </section>;
}
