"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Copy, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { ScoreDistribution } from "./score-distribution";
import { SupportPanel, SupportTrigger } from "./support";
import { nextTrialAt, countdownText } from "./time";

import { CATEGORIES, CATEGORY_META, dayNumber, makeQuestions, type Entry } from "./game";

export default function Home() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", tick); };
  }, []);
  const puzzleNumber = dayNumber(new Date(now));
  const nextRelease = useMemo(() => nextTrialAt(now), [puzzleNumber]);
  return <DailyTrial key={puzzleNumber} puzzleNumber={puzzleNumber} remaining={countdownText(nextRelease - now)} />;
}

function DailyTrial({ puzzleNumber, remaining }: { puzzleNumber: number; remaining: string }) {
  const questions = useMemo(() => makeQuestions(puzzleNumber), [puzzleNumber]);
  const storageKey = `daily-deebs-${puzzleNumber}`;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null, null]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const current = questions[questionIndex];
  const answered = answers[questionIndex] !== null;
  const complete = answers.every((answer) => answer !== null);
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState<{best:number|null;worst:number|null;streak:number;average:number|null;players:number;distribution?:number[]}|null>(null);
  const [statsError, setStatsError] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [picks, setPicks] = useState<string[]>([]);
  const score = answers.filter(Boolean).length;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved?.answers?.length === 4) {
        setAnswers(saved.answers);
        setPicks(saved.picks || []);
        setShowResults(Boolean(saved.showResults));
        const firstOpen = saved.answers.findIndex((answer: boolean | null) => answer === null);
        setQuestionIndex(saved.questionIndex ?? (firstOpen === -1 ? 3 : firstOpen));
        setSelectedId(saved.selectedId || null);
      }
    } catch { /* A blocked or malformed local store should not stop the quiz. */ }
  }, [storageKey]);

  const choose = useCallback((entry: Entry) => {
    if (answers[questionIndex] !== null) return false;
    const correct = entry.id === current.answer.id;
    const nextAnswers = answers.map((answer, index) => index === questionIndex ? correct : answer);
    setAnswers(nextAnswers);
    setSelectedId(entry.id);
    const nextPicks = [...picks]; nextPicks[questionIndex] = entry.id; setPicks(nextPicks);
    try { localStorage.setItem(storageKey, JSON.stringify({ answers: nextAnswers, selectedId: entry.id, picks: nextPicks, questionIndex, showResults: false })); } catch { /* Progress persistence is optional. */ }
    return correct;
  }, [answers, current.answer.id, questionIndex, storageKey, picks]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "answer_daily_deebs_question",
      title: "Answer Daily Deebs question",
      description: "Choose one of the four visible answer options for the current Daily Deebs question.",
      inputSchema: { type: "object", properties: { option: { type: "integer", minimum: 1, maximum: 4 } }, required: ["option"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const option = Number((input as { option?: number })?.option);
        if (!Number.isInteger(option) || option < 1 || option > 4) throw new Error("Option must be 1, 2, 3, or 4.");
        if (answered) throw new Error("This question has already been answered.");
        const picked = current.options[option - 1];
        const correct = choose(picked);
        return { category: current.category, correct, revealedName: current.answer.name };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [answered, choose, current]);

  useEffect(() => {
    if (!showResults) return;
    const run = async () => {
      try {
        const onPages=window.location.hostname.endsWith('.github.io');
        let player=localStorage.getItem('deebs-player');
        if(!player){player=crypto.randomUUID();localStorage.setItem('deebs-player',player);}
        const endpoint=onPages?'https://daily-deebs.raheelio123.chatgpt.site/api/stats':'/api/stats';
        const response = await fetch(endpoint, picks.length === 4 ? {method:'POST',headers:{'Content-Type':'application/json','X-Deebs-Player':player},body:JSON.stringify({day:puzzleNumber,picks})} : {headers:{'X-Deebs-Player':player}});
        if (!response.ok) throw new Error('Statistics are temporarily unavailable. Please refresh to retry.');
        setStats(await response.json());
      } catch (error) { setStatsError((error as Error).message); }
    };
    void run();
  }, [showResults, picks, puzzleNumber]);

  function nextQuestion() {
    if (questionIndex >= 3) { setShowResults(true); try { localStorage.setItem(storageKey, JSON.stringify({answers, picks, showResults:true})); } catch {} return; }
    setQuestionIndex(questionIndex + 1);
    setSelectedId(null);
    try { localStorage.setItem(storageKey, JSON.stringify({ answers, picks, questionIndex: questionIndex + 1, selectedId: null })); } catch { /* Progress persistence is optional. */ }
  }

  async function shareResult(platform = "native") {
    const marks = answers.map((answer) => answer ? "🚪" : "🪝").join("  ");
    const text = `Daily Deebs #${puzzleNumber}\n${marks}\n${score}/4\n\nPlay today’s game: ${new URL("./", window.location.href).href}`;
    try {
      if (platform === "X") { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer"); return; }
      if (platform === "Text") { window.location.href = `sms:?body=${encodeURIComponent(text)}`; return; }
      if (platform !== "native") { await navigator.clipboard.writeText(text); setShareNotice(`Result copied. Paste it into ${platform}, or choose ${platform} from your device’s share menu.`); }
      if (navigator.share) await navigator.share({ title: `Daily Deebs #${puzzleNumber}`, text });
      else { await navigator.clipboard.writeText(text); setShareState("copied"); window.setTimeout(() => setShareState("idle"), 1800); }
    } catch (error) {
      if ((error as Error).name !== "AbortError") { await navigator.clipboard.writeText(text); setShareState("copied"); }
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Daily Deebs home"><img className="mask-logo" src="./favicon.svg" alt="" /><span>DAILY DEEBS</span></a>
        <div className="header-actions"><SupportTrigger /><div className="edition">#{puzzleNumber}</div></div>
      </header>
      <div id="top" className="page-grid">
        <div className="content-column">
          <section className="quiz-card" aria-labelledby="quiz-title">
            <div className="quiz-topline">
              <div><p className="eyebrow">Today’s trial</p><h1 id="quiz-title">Know what it does?</h1></div>
              <div className="question-count">{questionIndex + 1} / 4</div>
            </div>
            <Progress className="quiz-progress" value={complete ? 100 : ((questionIndex + (answered ? 1 : 0)) / 4) * 100} />
            {!showResults ? (
              <>
                <div className="category-row">
                  {CATEGORIES.map((category, index) => <span key={category} className={index === questionIndex ? "active" : index < questionIndex ? "done" : ""}>{CATEGORY_META[category].label}</span>)}
                </div>
                <div className="question-stage">
                  <div className={`icon-frame rarity-${current.answer.rarity || "veryrare"}`} title={current.answer.rarity || "Tier III perk"}><img src={(current.answer.icon || "").replace(/^\//, "./")} alt={`Mystery ${CATEGORY_META[current.category].label.toLowerCase()} icon`} /></div>
                  <div className="question-copy"><p className="category-label">{CATEGORY_META[current.category].label}</p><h2>{CATEGORY_META[current.category].prompt}</h2><p>Choose the description that matches the icon.</p></div>
                </div>
                <div className="answer-grid" role="group" aria-label="Answer choices">
                  {current.options.map((option, index) => {
                    const isCorrect = answered && option.id === current.answer.id;
                    const isWrongPick = answered && option.id === selectedId && !isCorrect;
                    return (
                      <button key={option.id} className={`answer ${isCorrect ? "answer--correct" : ""} ${isWrongPick ? "answer--wrong" : ""}`} onClick={() => choose(option)} disabled={answered}>
                        <span className="answer-letter">{String.fromCharCode(65 + index)}</span><span className="answer-text">{answered && <span className="option-reveal"><img src={(option.icon || "").replace(/^\//, "./")} alt="" /><strong>{option.name}</strong></span>}{option.description}</span>
                        {isCorrect ? <Check aria-label="Correct answer" /> : null}{isWrongPick ? <X aria-label="Your incorrect answer" /> : null}
                      </button>
                    );
                  })}
                </div>
                {answered ? (
                  <div className={`reveal ${answers[questionIndex] ? "reveal--correct" : "reveal--wrong"}`} role="status">
                    <div><p>The pictured {CATEGORY_META[current.category].label.toLowerCase()}</p><h3>{current.answer.name}</h3></div>
                    <Button className="next-button" onClick={nextQuestion}>{questionIndex < 3 ? "Next" : "See results"} <ChevronRight /></Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="results" role="status">
                <p className="eyebrow">Trial complete</p><div className="score"><strong>{score}</strong><span>/4</span></div>
                <h2>{score === 4 ? "You escaped clean." : score >= 2 ? "You lived to queue again." : "The Entity noticed."}</h2>
                <div className="result-marks" aria-label={`${score} correct answers out of 4`}>{answers.map((answer, index) => <span key={index}>{answer ? "🚪" : "🪝"}</span>)}</div>
                <Button size="lg" className="share-button" onClick={() => shareResult()}>{shareState === "copied" ? <Copy /> : <Share2 />}{shareState === "copied" ? "Copied to clipboard" : "Share result"}</Button>
                <div className="platforms">{["Text", "Discord", "Instagram", "X", "Snapchat"].map(platform => <Button variant="outline" key={platform} onClick={() => shareResult(platform)}>{platform}</Button>)}</div><p role="status">{shareNotice}</p>
                <div className="stats-grid">{[["Best score", stats?.best == null ? "—" : `${stats.best}/4`], ["Current streak", stats ? `${stats.streak} days` : "—"], ["Worst score", stats?.worst == null ? "—" : `${stats.worst}/4`], ["Today’s average", stats?.average == null ? "—" : `${stats.average.toFixed(2)}/4`]].map(([label,value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><p className="stats-note">{statsError || (stats ? `${stats.players} completed trials today. Personal records follow this browser. Streak = consecutive days completed.` : "Loading player statistics…")}</p>
                <ScoreDistribution distribution={stats?.distribution} error={statsError} />
                <div className="return-note countdown"><span>Next trial in</span><strong role="timer" aria-live="off">{remaining}</strong></div>
              </div>
            )}
          </section>
          <footer><p>Daily Deebs is an unofficial fan project and is not affiliated with Behaviour Interactive.</p><p>Catalogue snapshot: September 2026 · Gameplay reference: <a href="https://deadbydaylight.wiki.gg/" target="_blank" rel="noreferrer">Official Dead by Daylight Wiki</a>.</p></footer>
        </div>
        <aside className="rail-column" aria-label="Support Daily Deebs"><SupportPanel /></aside>
      </div>
    </main>
  );
}
