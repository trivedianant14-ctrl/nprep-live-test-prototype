import { useState } from 'react'
import { P, PD, PL, G, GL, A, T1, T2, T3, BD, BG2 } from '../data'
import { ordinal } from '../utils/format'
import { explanationFor } from '../exam/practiceContent'

const RED = '#E5484D', RED_L = '#FDECED', GREEN = '#189A57', GREEN_L = '#E9F8F0', YEL = '#E3B71E'
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
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
  const [showAnswer, setShowAnswer] = useState(false)   // reveal correct answer + solution
  const [showResponse, setShowResponse] = useState(false) // reveal the student's picked answer
  const isNprep = style === 'nprep'
  const testName = meta?.series ? `${meta.series} ${meta.stage || ''}`.trim() : (meta?.shortName || 'Test')

  const resultOf = (gi) => answers[gi] === null ? 'skipped' : answers[gi] === questions[gi].answer ? 'correct' : 'incorrect'
  const ordered = sections.flatMap((s, si) => s.ids.map((gi, li) => ({ gi, si, sec: s, num: sections.slice(0, si).reduce((n, x) => n + x.ids.length, 0) + li + 1 })))
  const numOf = (gi) => ordered.find(o => o.gi === gi)?.num ?? 0

  const th = isNprep
    ? { font: "'Poppins', sans-serif", pageBg: BG2, pane: '#fff', bd: BD, radius: 12, head: '#fff', headFg: T1, chip: PD, accent: P, muted: T2, faint: T3 }
    : { font: 'Arial, sans-serif', pageBg: '#eef2f6', pane: '#fff', bd: '#d3dae2', radius: 5, head: '#1a3a6b', headFg: '#fff', chip: '#1a3a6b', accent: '#1a3a6b', muted: '#555', faint: '#888' }

  const NAV = [['scorecard', 'Scorecard'], ['accuracy', 'Accuracy'], ['solutions', 'Solutions'], ['bookmarks', 'Bookmarks']]

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

  // Toggle switch (reveal correct answer / reveal the student's own answer)
  const Switch = ({ on, set, label }) => (
    <button onClick={() => set(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: on ? T1 : th.muted, fontWeight: on ? 600 : 500 }}>
      <span style={{ width: 38, height: 22, borderRadius: 12, background: on ? th.accent : BD, position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
      </span>
      {label}
    </button>
  )

  // ── Solutions — the exam attempt screen itself (no palette, no exam buttons,
  //    just Next); the answer & the student's own response are gated behind toggles. ──
  const solutions = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Section tabs */}
      <div style={{ flexShrink: 0, background: th.pane, borderBottom: `1px solid ${th.bd}`, display: 'flex', gap: 8, padding: '12px 22px', overflowX: 'auto' }}>
        {sections.map((s, i) => {
          const active = i === curSec
          return <button key={s.id} onClick={() => { setCurSec(i); setCur(s.ids[0]) }} style={{ padding: '8px 18px', borderRadius: 22, border: `1px solid ${active ? th.accent : 'transparent'}`, background: active ? th.accent : BG2, color: active ? '#fff' : th.muted, fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer', flexShrink: 0 }}>Section {s.id}</button>
        })}
      </div>
      {/* Centered question card */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '22px 26px', boxShadow: isNprep ? '0 1px 3px rgba(0,0,0,0.04)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: th.chip, padding: '4px 12px', borderRadius: isNprep ? 20 : 4 }}>Q{curNum}</span>
              <span style={{ fontSize: 11.5, color: th.faint }}>of {ordered.length} · Section {sections[curSec].id}</span>
              <div style={{ flex: 1 }} />
              <Switch on={showResponse} set={setShowResponse} label="Your answer" />
              <Switch on={showAnswer} set={setShowAnswer} label="Correct answer" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.55, marginBottom: 20 }}>{q.text}</p>
            {q.image && <img src={q.image} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ maxWidth: q.imageLarge ? '100%' : 340, maxHeight: q.imageLarge ? 340 : 220, border: `1px solid ${th.bd}`, borderRadius: 8, marginBottom: 18, display: 'block' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answer, isChosen = chosen === i
                const revealC = showAnswer && isCorrect, revealMine = showResponse && isChosen
                let bg = th.pane, bd = th.bd, fg = T1, badge = null
                if (revealC) { bg = GREEN_L; bd = isNprep ? '#BDE8D2' : GREEN; fg = GREEN; badge = <span style={{ fontSize: 11.5, fontWeight: 700, color: GREEN }}>✓ Correct{revealMine ? ' · Your answer' : ''}</span> }
                else if (revealMine) {
                  if (isCorrect) { bg = PL; bd = P; fg = P; badge = <span style={{ fontSize: 11.5, fontWeight: 700, color: P }}>Your answer</span> }
                  else { bg = RED_L; bd = isNprep ? '#F5C6C8' : RED; fg = RED; badge = <span style={{ fontSize: 11.5, fontWeight: 700, color: RED }}>{showAnswer ? '✕ ' : ''}Your answer</span> }
                }
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: isNprep ? 12 : 4, background: bg, border: `1.5px solid ${bd}`, fontSize: 15 }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${revealC || revealMine ? fg : th.bd}`, color: revealC || revealMine ? fg : th.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{LETTERS[i]}</span>
                    <span style={{ flex: 1, color: fg, fontWeight: revealC || revealMine ? 600 : 400 }}>{opt}</span>{badge}
                  </div>
                )
              })}
            </div>
            {showResponse && chosen === null && <div style={{ marginTop: 12, fontSize: 12.5, color: th.faint }}>You did not attempt this question.</div>}
            {showAnswer && (
              <div style={{ marginTop: 18, background: isNprep ? PL : '#f3f7fb', borderRadius: isNprep ? 10 : 4, padding: '14px 16px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: th.accent, marginBottom: 5 }}>Solution</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: th.muted }}>{expl.text}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Footer — only Previous + Next */}
      <div style={{ flexShrink: 0, background: th.pane, borderTop: `1px solid ${th.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
        <button onClick={() => goToPos(-1)} disabled={curPos === 0} style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: isNprep ? 10 : 4, padding: '10px 18px', fontSize: 13, fontWeight: 600, color: T1, cursor: curPos === 0 ? 'default' : 'pointer', opacity: curPos === 0 ? 0.5 : 1 }}>« Previous</button>
        <span style={{ fontSize: 12, color: th.faint }}>Question {curNum} of {ordered.length}</span>
        <button onClick={() => goToPos(1)} disabled={curPos === ordered.length - 1} style={{ background: th.accent, border: 'none', borderRadius: isNprep ? 10 : 4, padding: '10px 26px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: curPos === ordered.length - 1 ? 'default' : 'pointer', opacity: curPos === ordered.length - 1 ? 0.6 : 1 }}>Next »</button>
      </div>
    </div>
  )

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
