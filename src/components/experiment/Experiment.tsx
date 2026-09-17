import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, FlaskConical, Pause, Play, Shuffle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { assembleReport, reportCSV, runCondition } from '../../lib/experiment/run';
import { DEFAULT_SETTINGS, METHODS, METHOD_LABELS, type CaseResult, type ConditionResult, type Difference, type Method, type Report } from '../../lib/experiment/types';

const panel = 'rounded-[var(--radius-xl)] border border-border bg-surface p-5 md:p-6';
const colors: Record<Method, string> = { ordinary: '#a8b4c4', braid: '#8eb8b4', scrambled: '#c4a07a' };
const pct = (value: number) => `${(100 * value).toFixed(1)}%`;
const pp = (value: number) => `${value > 0 ? '+' : ''}${(100 * value).toFixed(1)} pp`;
function interval(value: Difference) { return `${pp(value.mean)} (95% interval ${pp(value.low)} to ${pp(value.high)})`; }

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function HistoryView({ sample, method, queryId, reveal }: { sample: CaseResult; method: Method; queryId: string; reveal: boolean }) {
  const { observations, updates } = sample.public;
  const records = [...observations, ...updates];
  const maxTime = Math.max(...records.map(r => r.time));
  const y = (time: number) => 38 + time / maxTime * 285;
  const predictions = sample.methods[method].predictions;
  const answer = sample.answers[queryId];
  const chosen = predictions.find(p => p.queryId === queryId)?.selectedId;
  return <svg viewBox="0 0 470 355" role="img" aria-label={`${METHOD_LABELS[method]} links between observations and updates; highlighted update ${queryId}`} className="mt-4 w-full">
    <text x="80" y="18" fill="#8eb8b4" fontSize="12" textAnchor="middle">A · Observations</text>
    <text x="370" y="18" fill="#c4a07a" fontSize="12" textAnchor="middle">B · Updates</text>
    <line x1="80" x2="80" y1="30" y2="330" stroke="#8eb8b4" opacity="0.35" />
    <line x1="370" x2="370" y1="30" y2="330" stroke="#c4a07a" opacity="0.35" />
    {predictions.map(p => {
      const a = observations.find(r => r.id === p.selectedId), b = updates.find(r => r.id === p.queryId);
      if (!a || !b) return null;
      const selected = p.queryId === queryId;
      return <path key={p.queryId} d={`M80 ${y(a.time)} C180 ${y(a.time)}, 260 ${y(b.time)}, 370 ${y(b.time)}`} fill="none" stroke={colors[method]} strokeWidth={selected ? 3 : 1} opacity={selected ? 1 : 0.2} />;
    })}
    {reveal && (() => {
      const a = observations.find(r => r.id === answer)!, b = updates.find(r => r.id === queryId)!;
      return <path d={`M80 ${y(a.time)} C180 ${y(a.time)},260 ${y(b.time)},370 ${y(b.time)}`} fill="none" stroke="#8aab8a" strokeWidth="2" strokeDasharray="5 5" />;
    })()}
    {observations.map(r => <g key={r.id}>
      <circle cx="80" cy={y(r.time)} r={r.id === chosen || (reveal && r.id === answer) ? 5 : 2.5} fill={reveal && r.id === answer ? '#8aab8a' : '#8eb8b4'} />
      {(r.id === chosen || (reveal && r.id === answer)) && <text x="66" y={y(r.time) - 7} textAnchor="end" fill="#ece8e1" fontSize="12">{r.id}</text>}
    </g>)}
    {updates.map(r => <g key={r.id}>
      <circle cx="370" cy={y(r.time)} r={r.id === queryId ? 5 : 3} fill="#c4a07a" />
      {r.id === queryId && <text x="383" y={y(r.time) + 4} fill="#ece8e1" fontSize="12">{r.id}</text>}
    </g>)}
    <text x="235" y="350" textAnchor="middle" fill="#9a958c" fontSize="11">Time flows down · solid lines are selected matches</text>
  </svg>;
}

function Replay({ result, active }: { result: ConditionResult; active: boolean }) {
  const [historyIndex, setHistoryIndex] = useState(0);
  const [queryIndex, setQueryIndex] = useState(0);
  const [method, setMethod] = useState<Method>('braid');
  const [playing, setPlaying] = useState(false);
  const [reveal, setReveal] = useState(false);
  const sample = result.cases[Math.min(historyIndex, result.cases.length - 1)];
  const query = sample.public.updates[queryIndex];
  useEffect(() => {
    if (!playing || !active) return;
    const timer = window.setInterval(() => setQueryIndex(i => (i + 1) % sample.public.updates.length), 1200);
    return () => window.clearInterval(timer);
  }, [playing, active, sample.public.updates.length]);
  const source = sample.public.observations.find(r => r.id === sample.answers[query.id])!;
  return <section className={panel} aria-labelledby="replay-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs uppercase tracking-widest text-muted">Follow the choices</p><h2 id="replay-heading" className="mt-1 text-2xl">Replay a history</h2></div>
      <label className="text-sm text-muted">History <select aria-label="Replay history" className="ml-2 rounded-lg border border-border bg-elevated p-2 text-fg" value={historyIndex} onChange={e => { setHistoryIndex(Number(e.target.value)); setQueryIndex(0); setPlaying(false); }}>
        {result.cases.map((_, i) => <option key={i} value={i}>{i + 1} of {result.cases.length}</option>)}
      </select></label>
    </div>
    <div className="mt-5 grid gap-6 lg:grid-cols-2">
      <div>
        <div className="flex flex-wrap gap-2" aria-label="Show method connections">
          {METHODS.map(m => <button key={m} type="button" onClick={() => setMethod(m)} aria-pressed={method === m} className={`rounded-lg border px-3 py-2 text-xs ${method === m ? 'border-strand-a bg-strand-a/10 text-fg' : 'border-border text-muted'}`}>{METHOD_LABELS[m]}</button>)}
        </div>
        <HistoryView sample={sample} method={method} queryId={query.id} reveal={reveal} />
        <p className="mt-2 text-xs text-muted">Every dot is a record. Follow a bright line to see which observation the selected method chose. The scrambled control rearranges structural connections; this view keeps actual time on both sides.</p>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="icon-sm" aria-label="Previous update" onClick={() => { setPlaying(false); setQueryIndex(i => (i + 7) % 8); }}><ArrowLeft className="size-4" /></Button>
          <Button size="icon-sm" aria-label={playing ? 'Pause replay' : 'Play replay'} onClick={() => setPlaying(p => !p)}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
          <Button size="icon-sm" aria-label="Next update" onClick={() => { setPlaying(false); setQueryIndex(i => (i + 1) % 8); }}><ArrowRight className="size-4" /></Button>
          <span className="ml-2 text-sm text-muted">Update {queryIndex + 1} of 8 · {query.id}</span>
        </div>
        <div className="mt-4 rounded-xl border border-strand-b/30 bg-strand-b/5 p-4">
          <p className="font-mono text-xs text-strand-b">HISTORY B · t = {query.time}</p>
          <p className="mt-2 text-lg leading-snug">{query.text}</p>
          <p className="mt-2 text-xs text-muted">{query.clues.length} of 3 clues visible to all methods</p>
        </div>
        <div className="mt-3 space-y-2">
          {METHODS.map(m => {
            const prediction = sample.methods[m].predictions.find(p => p.queryId === query.id)!;
            const picked = sample.public.observations.find(r => r.id === prediction.selectedId);
            const hit = prediction.selectedId === source.id;
            return <div key={m} className="rounded-xl bg-elevated px-4 py-3">
              <div className="flex justify-between gap-2 text-sm"><span style={{ color: colors[m] }}>{METHOD_LABELS[m]}</span><span className={reveal ? hit ? 'text-reentangle' : 'text-diverge' : 'text-muted'}>{reveal ? hit ? 'Correct' : 'Missed' : picked?.id ?? 'No answer'}</span></div>
              <p className="mt-1 text-sm">{picked ? `${picked.id} · ${picked.text}` : 'No eligible match selected.'}</p>
            </div>;
          })}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={reveal} onChange={e => setReveal(e.target.checked)} className="size-4 accent-[#8eb8b4]" />Reveal the correct observation</label>
        {reveal && <p className="mt-3 rounded-lg border border-reentangle/30 bg-reentangle/10 p-3 text-sm text-reentangle">Answer: {source.id} at t = {source.time}. {source.text} The dashed green link shows the source kept in the separate answer key.</p>}
      </div>
    </div>
    <details className="mt-5 border-t border-border pt-4">
      <summary className="cursor-pointer text-sm text-muted">Inspect all visible observations · history seed {sample.seed}</summary>
      <div className="mt-3 max-h-72 overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="text-muted"><th className="p-2">ID</th><th className="p-2">Time</th><th className="p-2">Record</th></tr></thead><tbody>{sample.public.observations.map(r => <tr key={r.id} className="border-t border-border"><td className="p-2 font-mono">{r.id}</td><td className="p-2">{r.time}</td><td className="p-2">{r.text}</td></tr>)}</tbody></table></div>
    </details>
  </section>;
}

export function Experiment({ active = true }: { active?: boolean }) {
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [seedText, setSeedText] = useState(String(DEFAULT_SETTINGS.seed));
  const [report, setReport] = useState<Report | null>(null);
  const [conditionIndex, setConditionIndex] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const busy = progress !== null;
  const current = report?.conditions[conditionIndex];
  const changed = report && JSON.stringify(report.settings) !== JSON.stringify({ ...settings, seed: Number(seedText) });
  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(''); setProgress(0);
    const config = { ...settings, seed: Number(seedText) };
    try {
      const results: ConditionResult[] = [];
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => window.setTimeout(resolve, 20));
        results.push(runCondition(config, i)); setProgress(i + 1);
      }
      setReport(assembleReport(config, results, navigator.userAgent, import.meta.env?.VITE_COMMIT_SHA || 'local-unversioned'));
      setConditionIndex(0); setSettings(config);
    } catch (e) { setError(e instanceof Error ? e.message : 'The comparison could not finish.'); }
    finally { setProgress(null); }
  }
  return <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
    <header className="border-b border-border pb-6">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-strand-a"><FlaskConical className="size-4" />Braid Memory · Retrieval experiment</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">Find the right memory.</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">One history records observations. The other contains later updates with missing clues. Can connecting their order help find the observation behind each update?</p>
    </header>
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className={panel}>
        <p className="text-xs uppercase tracking-widest text-muted">The comparison</p>
        <h2 className="mt-2 text-2xl">Same records. Three ways to search.</h2>
        <div className="mt-5 space-y-4">{([
          ['ordinary', 'Match content and timing.', 'Find the best overall set of matches. Each observation can be used once.'],
          ['braid', 'Also connect the sequence.', 'Use those same clues, with an extra rule: matches must follow the order of both histories.'],
          ['scrambled', 'Scramble those connections.', 'Keep content and timing intact, but rearrange the observation order used for the connections.'],
        ] as const).map(([method, title, body], i) => <div key={method} className="flex gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs" style={{ color: colors[method] }}>0{i + 1}</span><div><p className="text-sm" style={{ color: colors[method] }}>{METHOD_LABELS[method]}</p><p className="mt-1 font-medium">{title}</p><p className="mt-1 text-sm text-muted">{body}</p></div></div>)}</div>
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted">The correct source is kept separately for scoring. Every method gets the same pair-comparison budget. A wrong answer counts as wrong, regardless of method.</p>
      </section>
      <form className={panel} onSubmit={run}>
        <fieldset disabled={busy} className="space-y-4">
          <legend className="mb-4 font-display text-2xl">Set the difficulty</legend>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm">Seed<Input id="experiment-seed" aria-label="Experiment seed" className="mt-1 w-full" type="number" min="0" max="4294967295" step="1" required value={seedText} onChange={e => setSeedText(e.target.value)} /></label>
            <label className="text-sm">Histories per condition<select aria-label="Histories per condition" className="mt-1 h-11 w-full rounded-xl border border-border bg-elevated px-3" value={settings.histories} onChange={e => setSettings(s => ({ ...s, histories: Number(e.target.value) }))}>{[10, 40, 100, 200].map(n => <option key={n} value={n}>{n} histories</option>)}</select></label></div>
          <Button type="button" size="sm" variant="ghost" onClick={() => { const words = new Uint32Array(1); crypto.getRandomValues(words); setSeedText(String(words[0])); }}><Shuffle className="size-4" />New seed</Button>
          {([
            ['missing', 'Missing clues', 0, 1, 0.05, pct(settings.missing)],
            ['distractors', 'Extra distractions', 0, 64, 1, String(settings.distractors)],
            ['jitter', 'Delay variation', 0, 30, 1, `±${settings.jitter} time units`],
          ] as const).map(([key, label, min, max, step, display]) => <label className="block text-sm" key={key}><span className="flex justify-between gap-2"><span>{label}</span><span className="font-mono text-strand-a">{display}</span></span><input aria-label={label} className="mt-2 h-5 w-full accent-[#8eb8b4]" type="range" min={min} max={max} step={step} value={settings[key]} onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))} /></label>)}
          <p className="text-xs text-muted">{settings.histories * 8} questions per condition · four conditions · generated records</p>
          <Button className="w-full" type="submit" variant="primary"><Play className="size-4" />{busy ? `Running condition ${Math.min((progress ?? 0) + 1, 4)} of 4…` : 'Run comparison'}</Button>
        </fieldset>
        <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">{busy ? `Completed ${progress} of 4 conditions.` : changed ? 'Settings changed. Run again to replace the displayed results.' : report ? 'Comparison complete. Results below.' : 'Runs in your browser. No account or API key needed.'}</p>
        {error && <p role="alert" className="mt-2 text-sm text-diverge">{error}</p>}
      </form>
    </div>
    {report && current && <div className="mt-6 space-y-5" aria-busy={busy}>
      <section className={panel} aria-labelledby="results-heading">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-muted">Results · seed {report.settings.seed}</p><h2 id="results-heading" className="mt-2 text-3xl">{report.verdict}</h2><p className="mt-2 max-w-2xl text-sm text-muted">{report.verdict === 'Exploratory benefit' ? 'At the selected settings, ordered connections cleared both comparison thresholds. Check the harder conditions to see where the gain holds.' : 'At the selected settings, ordered connections did not clear both comparison thresholds. A tie or a loss is a valid result.'}</p></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => download(JSON.stringify(report, null, 2), `memory-experiment-${report.settings.seed}.json`, 'application/json')}><ArrowDownToLine className="size-4" />Download JSON</Button><Button size="sm" onClick={() => download(reportCSV(report), `memory-experiment-${report.settings.seed}.csv`, 'text/csv')}><ArrowDownToLine className="size-4" />Download CSV</Button></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Result condition">{report.conditions.map((r, i) => <button type="button" key={r.condition.id} aria-pressed={conditionIndex === i} onClick={() => setConditionIndex(i)} className={`rounded-lg border px-3 py-2 text-sm ${conditionIndex === i ? 'border-strand-a bg-strand-a/10 text-fg' : 'border-border text-muted'}`}>{r.condition.label}</button>)}</div>
        <p className="mt-3 text-sm text-muted">{current.condition.description}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{METHODS.map(m => { const r = current.summaries[m]; return <div key={m} className="rounded-xl border border-border bg-bg p-4"><p className="text-sm" style={{ color: colors[m] }}>{METHOD_LABELS[m]}</p><p className="mt-2 font-mono text-4xl">{pct(r.accuracy)}</p><div className="mt-3 h-1.5 rounded-full bg-elevated" aria-hidden><div className="h-full rounded-full" style={{ width: pct(r.accuracy), background: colors[m] }} /></div><p className="mt-3 text-xs text-muted">{r.correct} / {r.total} correct · {r.unanswered} unanswered</p></div>; })}</div>
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-2"><p><span className="text-muted">Braid minus ordinary</span><br /><span className="font-mono text-xs">{interval(current.vsOrdinary)}</span></p><p><span className="text-muted">Braid minus scrambled</span><br /><span className="font-mono text-xs">{interval(current.vsScrambled)}</span></p></div>
        <p className="mt-3 text-xs text-muted">pp = percentage points. Intervals resample entire histories. The verdict uses Selected settings only: at least +5 pp over both controls, with both intervals above zero. All results are exploratory.</p>
      </section>
      <Replay key={`${report.createdAt}-${current.condition.id}`} result={current} active={active} />
      <section className={panel}><h2 className="text-2xl">What did it cost?</h2><p className="mt-2 text-sm text-muted">All methods score the same candidate pairs. Ranking work and elapsed time are shown separately; their algorithms do different amounts of work.</p><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-muted"><tr><th className="p-2">Method</th><th className="p-2">Pair scores</th><th className="p-2">Ranking steps</th><th className="p-2">Retrieval time</th></tr></thead><tbody>{METHODS.map(m => <tr key={m} className="border-t border-border"><td className="p-2">{METHOD_LABELS[m]}</td><td className="p-2 font-mono">{current.summaries[m].pairEvaluations.toLocaleString()}</td><td className="p-2 font-mono">{current.summaries[m].rankingSteps.toLocaleString()}</td><td className="p-2 font-mono">{current.summaries[m].elapsedMs.toFixed(1)} ms</td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-muted">Totals for {report.settings.histories} histories in this condition. Timing varies by device and browser; it is not an accuracy result.</p></section>
    </div>}
    <footer className="mt-8 border-t border-border pt-5 text-sm text-muted"><p><strong className="font-medium text-fg">What this can tell us:</strong> whether using event order helps retrieve the correct source in these generated histories. Changing delays can break that assumption.</p><p className="mt-2">This experiment uses ordinary sequence alignment. It does not run HME’s memory engine, establish a special braid mechanism, or validate QOFT as physics.</p><a className="mt-3 inline-block text-strand-a underline underline-offset-4" href="https://github.com/donaldtuttle/braid-memory/blob/main/docs/MEMORY_EXPERIMENT.md" target="_blank" rel="noreferrer">Read the protocol and scoring rules ↗</a></footer>
  </main>;
}
