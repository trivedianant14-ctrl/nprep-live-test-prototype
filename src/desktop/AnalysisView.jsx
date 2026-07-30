import { useState } from 'react'
import { P, PD, PL, G, GL, A, T1, T2, T3, BD, BG2 } from '../data'
import { ordinal } from '../utils/format'
import { explanationFor } from '../exam/practiceContent'

const RED = '#E5484D', RED_L = '#FDECED', GREEN = '#189A57', GREEN_L = '#E9F8F0', YEL = '#E3B71E'
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
// NORCET CBT palette (faithful to web-test-screen.vercel.app)
const NAVY = '#1a3a6b', NGREEN = '#25a943', NRED = '#e4474d', RED_TXT = '#cc0000'
// Review palette glyph — reuses the NORCET convention: correct = green house, incorrect
// = red diamond, unattempted = grey square; current question gets an orange outline.
function ReviewCell({ result, num, active, onClick }) {
  const base = { width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, userSelect: 'none', outline: active ? '2.5px solid #ff8800' : 'none', outlineOffset: 1 }
  if (result === 'correct') return <div onClick={onClick} style={{ ...base, background: NGREEN, color: '#fff', clipPath: 'polygon(0 30%,50% 0,100% 30%,100% 100%,0 100%)' }}>{num}</div>
  if (result === 'incorrect') return <div onClick={onClick} style={{ ...base, background: NRED, color: '#fff', clipPath: 'polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)' }}>{num}</div>
  return <div onClick={onClick} style={{ ...base, background: '#ddd', color: '#222', border: '1px solid #aaa' }}>{num}</div>
}
const SELF_TAGS = ['Good Shot', 'Unforced Error', 'Missed Opportunity', 'Risky Shot', 'Well Left', 'Double Negative']

// Post-test analysis modelled on Career Launcher's CAT interface — tabbed
// (Scorecard / Accuracy / Solutions / Bookmarks), with the Solutions tab in the same
// three-column exam layout: question · answer + solution + self-assessment · circular
// palette. The visual style mirrors the interface the test was taken in (NPrep / NORCET).
export default function AnalysisView({ questions, sections, answers, marked = [], meta, results, interface: initialStyle = 'nprep', onBack }) {
  const [tab, setTab] = useState('scorecard') // scorecard | accuracy | solutions | bookmarks
  const [style, setStyle] = useState(initialStyle)
  const [curSec, setCurSec] = useState(0)
  const [cur, setCur] = useState(sections[0].ids[0])
  const [reveal, setReveal] = useState(false) // reveal the correct answer + solution (your own pick always shows)
  const isNprep = style === 'nprep'
  const testName = meta?.series ? `${meta.series} ${meta.stage || ''}`.trim() : (meta?.shortName || 'Test')

  const resultOf = (gi) => answers[gi] === null ? 'skipped' : answers[gi] === questions[gi].answer ? 'correct' : 'incorrect'
  const ordered = sections.flatMap((s, si) => s.ids.map((gi, li) => ({ gi, si, sec: s, num: sections.slice(0, si).reduce((n, x) => n + x.ids.length, 0) + li + 1 })))
  const numOf = (gi) => ordered.find(o => o.gi === gi)?.num ?? 0

  const th = isNprep
    ? { font: "'Poppins', sans-serif", pageBg: BG2, pane: '#fff', bd: BD, radius: 12, head: '#fff', headFg: T1, chip: PD, accent: P, muted: T2, faint: T3 }
    : { font: 'Arial, sans-serif', pageBg: '#eef2f6', pane: '#fff', bd: '#d3dae2', radius: 5, head: '#1a3a6b', headFg: '#fff', chip: '#1a3a6b', accent: '#1a3a6b', muted: '#555', faint: '#888' }

  const NAV = [['scorecard', 'Scorecard'], ['solutions', 'Solutions']]

  const secStats = sections.map(s => {
    const c = s.ids.filter(id => resultOf(id) === 'correct').length
    const w = s.ids.filter(id => resultOf(id) === 'incorrect').length
    const k = s.ids.filter(id => resultOf(id) === 'skipped').length
    return { id: s.id, c, w, k, total: s.ids.length, acc: (c + w) ? Math.round((c / (c + w)) * 100) : 0 }
  })

  // ── Top chrome ─────────────────────────────────────────────────────────────
  const header = (
    <div style={{ flexShrink: 0, background: th.head, color: th.headFg, borderBottom: `1px solid ${isNprep ? BD : '#12294d'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 22px' }}>
        <button onClick={onBack} style={{ background: isNprep ? '#fff' : 'rgba(255,255,255,0.15)', border: isNprep ? `1px solid ${BD}` : 'none', borderRadius: 20, padding: '6px 13px', cursor: 'pointer', color: isNprep ? T2 : '#fff', fontSize: 12.5, fontWeight: 600 }}>← Back</button>
        <div style={{ fontSize: 15.5, fontWeight: 700 }}>{testName} — Analysis</div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: isNprep ? T3 : 'rgba(255,255,255,0.7)' }}>Reference:</span>
        <div style={{ display: 'inline-flex', background: isNprep ? BG2 : 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 3, gap: 2 }}>
          {[['nprep', 'NPrep'], ['norcet', 'NORCET']].map(([id, l]) => {
            const active = style === id
            return <button key={id} onClick={() => setStyle(id)} style={{ padding: '5px 12px', borderRadius: 15, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: active ? 700 : 500, background: active ? (isNprep ? P : '#fff') : 'transparent', color: active ? (isNprep ? '#fff' : '#1a3a6b') : (isNprep ? T2 : 'rgba(255,255,255,0.85)') }}>{l}</button>
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '0 22px' }}>
        {NAV.map(([id, l]) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '10px 18px', fontSize: 13, fontWeight: active ? 700 : 500, background: 'none', border: 'none', cursor: 'pointer',
              color: active ? (isNprep ? P : '#fff') : (isNprep ? T2 : 'rgba(255,255,255,0.75)'),
              borderBottom: `2.5px solid ${active ? (isNprep ? P : '#fff') : 'transparent'}`,
            }}>{l}</button>
          )
        })}
      </div>
    </div>
  )

  // ── Scorecard ──────────────────────────────────────────────────────────────
  const scorecard = () => {
    const r = results, ac = r.accuracy >= 60 ? GREEN : r.accuracy >= 40 ? A : RED
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 50px' }}>
        <div style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '26px', textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: th.faint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Your Score</div>
          <div><span style={{ fontSize: 44, fontWeight: 700, color: th.chip }}>{r.score}</span><span style={{ fontSize: 18, color: th.faint }}> / {meta.totalMarks}</span></div>
          <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 700, color: ac }}>{r.accuracy}% Accuracy</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          {[['Correct', r.correct, GREEN], ['Wrong', r.wrong, RED], ['Skipped', r.unattempted, th.faint]].map(([l, v, c]) => (
            <div key={l} style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 11, color: th.faint, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[[`${r.percentile}${ordinal(r.percentile)}`, 'Est. Percentile'], [`~${r.air.toLocaleString()}`, 'Est. All-India Rank']].map(([v, l]) => (
            <div key={l} style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: th.chip }}>{v}</div><div style={{ fontSize: 11, color: th.faint, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: th.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Section Performance</div>
        {secStats.map(s => (
          <div key={s.id} style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '14px 18px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span style={{ fontWeight: 600 }}>Section {s.id}</span><span style={{ fontWeight: 700, color: s.acc >= 60 ? GREEN : s.acc >= 40 ? A : RED }}>{s.acc}%</span></div>
            <div style={{ height: 6, background: BG2, borderRadius: 3 }}><div style={{ height: '100%', width: `${s.acc}%`, background: s.acc >= 60 ? GREEN : s.acc >= 40 ? A : RED, borderRadius: 3 }} /></div>
          </div>
        ))}
      </div>
    )
  }

  // ── Accuracy ───────────────────────────────────────────────────────────────
  const accuracy = () => (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 50px' }}>
      <div style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '24px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: th.faint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Overall Accuracy</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: th.chip }}>{results.accuracy}%</div>
        <div style={{ fontSize: 12, color: th.faint }}>{results.correct} correct of {results.correct + results.wrong} attempted</div>
      </div>
      {secStats.map(s => (
        <div key={s.id} style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '16px 18px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10 }}><span style={{ fontWeight: 600 }}>Section {s.id}</span><span style={{ fontWeight: 700, color: s.acc >= 60 ? GREEN : s.acc >= 40 ? A : RED }}>{s.acc}% accuracy</span></div>
          <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: BG2 }}>
            <div style={{ width: `${s.c / s.total * 100}%`, background: GREEN }} title={`${s.c} correct`} />
            <div style={{ width: `${s.w / s.total * 100}%`, background: RED }} title={`${s.w} wrong`} />
            <div style={{ width: `${s.k / s.total * 100}%`, background: YEL }} title={`${s.k} skipped`} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11.5, color: th.muted }}>
            <span><b style={{ color: GREEN }}>{s.c}</b> correct</span><span><b style={{ color: RED }}>{s.w}</b> wrong</span><span><b style={{ color: '#b58a10' }}>{s.k}</b> skipped</span>
          </div>
        </div>
      ))}
    </div>
  )

  // ── Solutions (3-column, Career Launcher style) ─────────────────────────────
  const q = questions[cur]
  const chosen = answers[cur]
  const res = resultOf(cur)
  const expl = explanationFor(q)
  const curNum = numOf(cur)
  const curPos = ordered.findIndex(o => o.gi === cur)
  const goToPos = (d) => { const ni = Math.max(0, Math.min(ordered.length - 1, curPos + d)); setCur(ordered[ni].gi); setCurSec(ordered[ni].si) }

  // ── Solutions — the exam attempt screen itself, styled to match the interface the test
  //    was taken in. NPrep = edtech card + rounded grid; NORCET = faithful govt-CBT chrome
  //    (section bar, Question-No strip, radio options, Question Palette panel). Same idea in
  //    both: own answer always shown, a single "Show answer" reveals the correct option. ──
  const solutions = () => isNprep ? nprepSolutions() : norcetSolutions()

  const nprepSolutions = () => {
    const rc = ordered.filter(o => resultOf(o.gi) === 'correct').length
    const ri = ordered.filter(o => resultOf(o.gi) === 'incorrect').length
    const ru = ordered.length - rc - ri
    return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Section tabs */}
      <div style={{ flexShrink: 0, background: th.pane, borderBottom: `1px solid ${th.bd}`, display: 'flex', gap: 8, padding: '12px 22px', overflowX: 'auto' }}>
        {sections.map((s, i) => {
          const active = i === curSec
          return <button key={s.id} onClick={() => { setCurSec(i); setCur(s.ids[0]) }} style={{ padding: '8px 18px', borderRadius: isNprep ? 22 : 4, border: `1px solid ${active ? th.accent : (isNprep ? 'transparent' : th.bd)}`, background: active ? th.accent : (isNprep ? BG2 : '#e8edf3'), color: active ? '#fff' : th.muted, fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer', flexShrink: 0 }}>Section {s.id}</button>
        })}
      </div>
      {/* Body: question column + grid */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              <div style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '22px 26px', boxShadow: isNprep ? '0 1px 3px rgba(0,0,0,0.04)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: th.chip, padding: '4px 12px', borderRadius: isNprep ? 20 : 4 }}>Q{curNum}</span>
                  <span style={{ fontSize: 11.5, color: th.faint }}>of {ordered.length} · Section {sections[curSec].id}</span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setReveal(r => !r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: reveal ? (isNprep ? PL : '#e6ebf2') : 'transparent', border: `1px solid ${reveal ? th.accent : th.bd}`, color: reveal ? th.accent : th.muted, borderRadius: isNprep ? 20 : 4, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                    {reveal ? 'Hide answer' : 'Show answer'}
                  </button>
                </div>
                <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.55, marginBottom: 20 }}>{q.text}</p>
                {q.image && <img src={q.image} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ maxWidth: q.imageLarge ? '100%' : 340, maxHeight: q.imageLarge ? 340 : 220, border: `1px solid ${th.bd}`, borderRadius: 8, marginBottom: 18, display: 'block' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options.map((opt, i) => {
                    const isCorrect = i === q.answer, isChosen = chosen === i
                    let bg = th.pane, bd = th.bd, fg = T1, badge = null, lbg = '#fff', lfg = th.muted, lbd = th.bd, strong = false
                    if (reveal && isCorrect) { bg = GREEN_L; bd = isNprep ? '#BDE8D2' : GREEN; fg = GREEN; lbg = GREEN; lfg = '#fff'; lbd = GREEN; strong = true; badge = <span style={{ fontSize: 11.5, fontWeight: 700, color: GREEN }}>✓ Correct{isChosen ? ' · Your answer' : ''}</span> }
                    else if (reveal && isChosen) { bg = RED_L; bd = isNprep ? '#F5C6C8' : RED; fg = RED; lbg = RED; lfg = '#fff'; lbd = RED; strong = true; badge = <span style={{ fontSize: 11.5, fontWeight: 700, color: RED }}>✕ Your answer</span> }
                    else if (isChosen) { bd = th.accent; lbg = th.accent; lfg = '#fff'; lbd = th.accent; strong = true; badge = <span style={{ fontSize: 11, fontWeight: 600, color: th.faint }}>Your answer</span> }
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: isNprep ? 12 : 4, background: bg, border: `1.5px solid ${bd}`, fontSize: 15 }}>
                        <span style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${lbd}`, background: lbg, color: lfg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{LETTERS[i]}</span>
                        <span style={{ flex: 1, color: fg, fontWeight: strong ? 600 : 400 }}>{opt}</span>{badge}
                      </div>
                    )
                  })}
                </div>
                {reveal && chosen === null && <div style={{ marginTop: 12, fontSize: 12.5, color: th.faint }}>You did not attempt this question.</div>}
                {reveal && (
                  <div style={{ marginTop: 18, background: isNprep ? PL : '#f3f7fb', borderRadius: isNprep ? 10 : 4, padding: '14px 16px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: th.accent, marginBottom: 5 }}>Solution</div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.65, color: th.muted }}>{expl.text}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, background: th.pane, borderTop: `1px solid ${th.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
            <button onClick={() => goToPos(-1)} disabled={curPos === 0} style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: isNprep ? 10 : 4, padding: '10px 18px', fontSize: 13, fontWeight: 600, color: T1, cursor: curPos === 0 ? 'default' : 'pointer', opacity: curPos === 0 ? 0.5 : 1 }}>« Previous</button>
            <span style={{ fontSize: 12, color: th.faint }}>Question {curNum} of {ordered.length}</span>
            <button onClick={() => goToPos(1)} disabled={curPos === ordered.length - 1} style={{ background: th.accent, border: 'none', borderRadius: isNprep ? 10 : 4, padding: '10px 26px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: curPos === ordered.length - 1 ? 'default' : 'pointer', opacity: curPos === ordered.length - 1 ? 0.6 : 1 }}>Next »</button>
          </div>
        </div>
        {/* Question grid — NPrep edtech style */}
        <aside style={{ width: 264, flexShrink: 0, background: '#fff', borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column' }}>
          {/* Attempt summary */}
          <div style={{ padding: '16px 18px 15px', borderBottom: `1px solid ${BD}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T1, marginBottom: 13 }}>Your attempt</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[['Correct', GREEN, GREEN_L, rc], ['Incorrect', RED, RED_L, ri], ['Unattempted', '#B8860B', '#FBF4DE', ru]].map(([l, c, soft, n]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: T2 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{l}</span>
                  <span style={{ minWidth: 26, textAlign: 'center', background: soft, color: c, fontWeight: 700, fontSize: 12, borderRadius: 7, padding: '2px 7px' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Section pill */}
          <div style={{ padding: '13px 18px 4px', flexShrink: 0 }}>
            <span style={{ display: 'inline-block', background: PL, color: P, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '5px 14px' }}>Section {sections[curSec].id}</span>
          </div>
          {/* Grid */}
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, justifyItems: 'center' }}>
              {sections[curSec].ids.map((gi) => {
                const active = gi === cur, r = resultOf(gi)
                const filled = r === 'correct' || r === 'incorrect'
                const bg = r === 'correct' ? GREEN : r === 'incorrect' ? RED : '#FBF4DE'
                const fg = filled ? '#fff' : '#96731A'
                return (
                  <button key={gi} onClick={() => setCur(gi)} style={{
                    width: 42, height: 42, borderRadius: 13, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: bg, color: fg, border: filled ? 'none' : '1.5px solid #EAD9A6',
                    boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${P}` : (filled ? '0 1px 2px rgba(0,0,0,0.12)' : 'none'),
                    transition: 'box-shadow .12s',
                  }}>{numOf(gi)}</button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
    )
  }

  // NORCET govt-CBT styling for the solutions review — mirrors the live exam chrome.
  const norcetSolutions = () => {
    const rc = ordered.filter(o => resultOf(o.gi) === 'correct').length
    const ri = ordered.filter(o => resultOf(o.gi) === 'incorrect').length
    const ru = ordered.length - rc - ri
    const cbt = (extra = {}) => ({ padding: '8px 16px', border: '1px solid #bbb', background: '#fff', borderRadius: 3, fontSize: 13, fontWeight: 600, color: '#333', cursor: 'pointer', ...extra })
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#fff' }}>
        {/* Section bar */}
        <div style={{ display: 'flex', height: 50, background: '#d0d0d0', borderBottom: '1px solid #b0b0b0', flexShrink: 0, overflowX: 'auto' }}>
          {sections.map((s, i) => {
            const active = i === curSec
            return (
              <div key={s.id} onClick={() => { setCurSec(i); setCur(s.ids[0]) }} style={{ flex: 1, minWidth: 130, borderRight: '1px solid #b0b0b0', padding: '4px 12px', cursor: 'pointer', background: active ? '#fff' : '#d0d0d0', color: active ? '#111' : '#555', fontWeight: active ? 700 : 500, boxShadow: active ? `inset 0 -3px 0 ${NAVY}` : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                <span style={{ fontSize: 12 }}>Section {s.id}</span>
                <span style={{ fontSize: 11, color: '#888' }}>Review</span>
              </div>
            )
          })}
        </div>
        {/* Body */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Question pane */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #c0c0c0', overflow: 'hidden' }}>
            <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', borderBottom: '1px solid #e0e0e0', fontSize: 14, background: '#fafafa', flexShrink: 0 }}>
              <span>Question No. <strong>{curNum}</strong></span>
              <span style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                <span>Marks: <span style={{ color: '#1a8c36', fontWeight: 700 }}>+{meta?.correctMarks ?? 1}</span> | <span style={{ color: RED_TXT, fontWeight: 700 }}>{meta?.wrongMarks ?? -0.33}</span></span>
                <button onClick={() => setReveal(r => !r)} style={cbt({ display: 'inline-flex', alignItems: 'center', gap: 7, background: reveal ? NAVY : '#fff', color: reveal ? '#fff' : '#333', border: `1px solid ${reveal ? NAVY : '#bbb'}` })}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                  {reveal ? 'Hide answer' : 'Show answer'}
                </button>
              </span>
            </div>
            <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Section {sections[curSec].id}</div>
              <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 22, color: '#1c2b45' }}>{q.text}</p>
              {q.image && <img src={q.image} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ maxWidth: q.imageLarge ? '100%' : 340, maxHeight: q.imageLarge ? 380 : 240, border: '1px solid #ddd', borderRadius: 4, marginBottom: 20, display: 'block' }} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.answer, isChosen = chosen === i
                  let bg = 'transparent', fg = '#222', tag = null
                  if (reveal && isCorrect) { bg = '#e8f6ec'; fg = '#137a38'; tag = <span style={{ fontSize: 12, fontWeight: 700, color: '#137a38' }}>✓ Correct{isChosen ? ' · Your answer' : ''}</span> }
                  else if (reveal && isChosen) { bg = '#fde8e9'; fg = RED_TXT; tag = <span style={{ fontSize: 12, fontWeight: 700, color: RED_TXT }}>✕ Your answer</span> }
                  else if (isChosen) { bg = '#eaf4fb'; tag = <span style={{ fontSize: 11.5, fontWeight: 600, color: '#666' }}>Your answer</span> }
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 50, padding: '8px 14px', borderRadius: 4, fontSize: 16, background: bg }}>
                      <input type="radio" checked={isChosen} readOnly style={{ width: 16, height: 16, accentColor: NAVY, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: '#555', minWidth: 18 }}>{LETTERS[i]}.</span>
                      <span style={{ flex: 1, color: fg }}>{opt}</span>{tag}
                    </div>
                  )
                })}
              </div>
              {reveal && chosen === null && <div style={{ marginTop: 14, color: RED_TXT, fontSize: 13, fontWeight: 600 }}>You did not attempt this question.</div>}
              {reveal && (
                <div style={{ marginTop: 20, border: '1px solid #d3dae2', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: '#eef2f6', padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: NAVY, borderBottom: '1px solid #d3dae2' }}>Solution</div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#444', padding: '12px 14px' }}>{expl.text}</p>
                </div>
              )}
            </div>
            <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderTop: '1px solid #ccc', background: '#f7f7f7', flexShrink: 0 }}>
              <button onClick={() => goToPos(-1)} disabled={curPos === 0} style={cbt({ opacity: curPos === 0 ? 0.5 : 1, cursor: curPos === 0 ? 'default' : 'pointer' })}>« Previous</button>
              <span style={{ fontSize: 12, color: '#888' }}>Question {curNum} of {ordered.length}</span>
              <button onClick={() => goToPos(1)} disabled={curPos === ordered.length - 1} style={cbt({ background: 'linear-gradient(135deg,#27b7cd 0%,#17829a 100%)', color: '#fff', border: '1px solid #17829a', opacity: curPos === ordered.length - 1 ? 0.6 : 1, cursor: curPos === ordered.length - 1 ? 'default' : 'pointer' })}>Next »</button>
            </footer>
          </div>
          {/* Question Palette */}
          <aside style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#f0f0f0' }}>
            <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 14px', background: NAVY, color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>Question Palette</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 8px', padding: '12px', background: '#fff', borderBottom: '1px solid #ddd', fontSize: 12.5, flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><b style={{ background: NGREEN, color: '#fff', minWidth: 24, textAlign: 'center', clipPath: 'polygon(0 30%,50% 0,100% 30%,100% 100%,0 100%)', padding: '2px 0' }}>{rc}</b> Correct</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><b style={{ background: NRED, color: '#fff', minWidth: 24, textAlign: 'center', clipPath: 'polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)', padding: '2px 0' }}>{ri}</b> Incorrect</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><b style={{ background: '#ddd', color: '#222', minWidth: 24, textAlign: 'center', border: '1px solid #aaa', padding: '1px 0' }}>{ru}</b> Unattempted</span>
            </div>
            <div style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: NAVY, background: '#e6ebf2', flexShrink: 0 }}>Section {sections[curSec].id}</div>
            <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, justifyItems: 'center' }}>
                {sections[curSec].ids.map((gi) => (
                  <ReviewCell key={gi} result={resultOf(gi)} num={numOf(gi)} active={gi === cur} onClick={() => setCur(gi)} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    )
  }

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  const bookmarks = () => {
    const flagged = ordered.filter(o => marked[o.gi])
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 50px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T1, marginBottom: 4 }}>Marked for Review</div>
        <div style={{ fontSize: 12.5, color: th.faint, marginBottom: 16 }}>{flagged.length} question{flagged.length === 1 ? '' : 's'} you flagged during the test.</div>
        {flagged.length === 0 && <div style={{ background: th.pane, border: `1px dashed ${th.bd}`, borderRadius: th.radius, padding: '36px', textAlign: 'center', color: th.faint, fontSize: 13.5 }}>You didn't mark any question for review.</div>}
        {flagged.map(o => {
          const r = resultOf(o.gi)
          return (
            <button key={o.gi} onClick={() => { setCurSec(o.si); setCur(o.gi); setTab('solutions') }} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '14px 16px', marginBottom: 8, cursor: 'pointer' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: th.chip, padding: '3px 10px', borderRadius: isNprep ? 16 : 4, flexShrink: 0 }}>Q{o.num}</span>
              <span style={{ flex: 1, fontSize: 13.5, color: T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{questions[o.gi].text}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: r === 'correct' ? GREEN : r === 'incorrect' ? RED : '#b58a10', flexShrink: 0 }}>{r === 'correct' ? 'Correct' : r === 'incorrect' ? 'Wrong' : 'Skipped'}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: th.pageBg, display: 'flex', flexDirection: 'column', fontFamily: th.font, color: T1 }}>
      {header}
      {tab === 'solutions'
        ? solutions()
        : <div className="scroll" style={{ flex: 1, overflowY: 'auto' }}>{tab === 'scorecard' ? scorecard() : tab === 'accuracy' ? accuracy() : bookmarks()}</div>}
    </div>
  )
}
