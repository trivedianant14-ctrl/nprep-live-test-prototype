import { useState } from 'react'
import { P, PD, PL, G, GL, T1, T2, T3, BD, BG2 } from '../data'
import { explanationFor } from '../exam/practiceContent'

const RED = '#E5484D', RED_L = '#FDECED', GREEN = '#189A57', GREEN_L = '#E9F8F0'
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// Post-test review, laid out like the exam itself (question pane + palette, no timer) —
// the Career-Launcher analysis pattern. Two views: "Response" shows which option the
// student picked vs the correct one; "Solution" additionally reveals the explanation.
// The look mirrors the interface the test was taken in (NPrep / NORCET), toggle to compare.
export default function SolutionView({ questions, sections, answers, meta, interface: initialStyle = 'nprep', onBack }) {
  const [style, setStyle] = useState(initialStyle)
  const [view, setView] = useState('response') // response | solution
  const [filter, setFilter] = useState('all')   // all | correct | incorrect | skipped
  const isNprep = style === 'nprep'
  const testName = meta?.series ? `${meta.series} ${meta.stage || ''}`.trim() : (meta?.shortName || 'Test')

  const ordered = sections.flatMap((s, si) => s.ids.map((gi, li) => ({ gi, si, sec: s, num: sections.slice(0, si).reduce((n, x) => n + x.ids.length, 0) + li + 1 })))
  const resultOf = (gi) => answers[gi] === null ? 'skipped' : answers[gi] === questions[gi].answer ? 'correct' : 'incorrect'
  const matches = (o) => filter === 'all' || resultOf(o.gi) === filter
  const filtered = ordered.filter(matches)

  const [cur, setCur] = useState(0) // global question index
  const curEntry = ordered.find(o => o.gi === cur) || ordered[0]
  const q = questions[cur]
  const chosen = answers[cur]
  const res = resultOf(cur)
  const expl = explanationFor(q)

  const tallies = { correct: 0, incorrect: 0, skipped: 0 }
  ordered.forEach(o => tallies[resultOf(o.gi)]++)

  const goPos = (delta) => {
    const list = filtered.length ? filtered : ordered
    const i = list.findIndex(o => o.gi === cur)
    const ni = Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i) + delta))
    setCur(list[ni].gi)
  }
  const applyFilter = (f) => { setFilter(f); const list = f === 'all' ? ordered : ordered.filter(o => resultOf(o.gi) === f); if (list.length) setCur(list[0].gi) }

  // ── Theme ──────────────────────────────────────────────────────────────────
  const th = isNprep
    ? { font: "'Poppins', sans-serif", pageBg: BG2, pane: '#fff', bd: BD, radius: 12, head: '#fff', headFg: T1, chip: PD, accent: P, muted: T2, faint: T3, palBg: '#fff' }
    : { font: 'Arial, sans-serif', pageBg: '#eef2f6', pane: '#fff', bd: '#d3dae2', radius: 5, head: '#1a3a6b', headFg: '#fff', chip: '#1a3a6b', accent: '#1a3a6b', muted: '#555', faint: '#888', palBg: '#f7f8fa' }

  const statusLabel = res === 'correct' ? 'Correct' : res === 'incorrect' ? 'Incorrect' : 'Not answered'
  const statusColor = res === 'correct' ? GREEN : res === 'incorrect' ? RED : th.faint

  const palColors = { correct: { bg: GREEN, fg: '#fff' }, incorrect: { bg: RED, fg: '#fff' }, skipped: { bg: '#fff', fg: T2, bd: th.bd } }
  const filterChips = [['all', 'All', ordered.length], ['correct', 'Correct', tallies.correct], ['incorrect', 'Incorrect', tallies.incorrect], ['skipped', 'Skipped', tallies.skipped]]

  return (
    <div style={{ position: 'fixed', inset: 0, background: th.pageBg, display: 'flex', flexDirection: 'column', fontFamily: th.font, color: T1 }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, background: th.head, color: th.headFg, padding: '11px 22px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${isNprep ? BD : '#12294d'}` }}>
        <button onClick={onBack} style={{ background: isNprep ? '#fff' : 'rgba(255,255,255,0.15)', border: isNprep ? `1px solid ${BD}` : 'none', borderRadius: 20, padding: '6px 13px', cursor: 'pointer', color: isNprep ? T2 : '#fff', fontSize: 12.5, fontWeight: 600 }}>← Back</button>
        <div style={{ fontSize: 15.5, fontWeight: 700 }}>Solutions — {testName}</div>
        <div style={{ flex: 1 }} />
        {/* View: Response / Solution */}
        <div style={{ display: 'inline-flex', background: isNprep ? BG2 : 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 3, gap: 2 }}>
          {[{ id: 'response', l: 'Your Response' }, { id: 'solution', l: 'View Solution' }].map(o => {
            const active = view === o.id
            return (
              <button key={o.id} onClick={() => setView(o.id)} style={{
                padding: '6px 16px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? (isNprep ? P : '#fff') : 'transparent', color: active ? (isNprep ? '#fff' : '#1a3a6b') : (isNprep ? T2 : 'rgba(255,255,255,0.85)'),
              }}>{o.l}</button>
            )
          })}
        </div>
        {/* Reference style toggle (prototype) */}
        <span style={{ fontSize: 11, color: isNprep ? T3 : 'rgba(255,255,255,0.7)' }}>Ref:</span>
        <div style={{ display: 'inline-flex', background: isNprep ? BG2 : 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 3, gap: 2 }}>
          {[{ id: 'nprep', l: 'NPrep' }, { id: 'norcet', l: 'NORCET' }].map(o => {
            const active = style === o.id
            return (
              <button key={o.id} onClick={() => setStyle(o.id)} style={{
                padding: '5px 12px', borderRadius: 15, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: active ? 700 : 500,
                background: active ? (isNprep ? P : '#fff') : 'transparent', color: active ? (isNprep ? '#fff' : '#1a3a6b') : (isNprep ? T2 : 'rgba(255,255,255,0.85)'),
              }}>{o.l}</button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Question pane */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              <div style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: th.radius, padding: '22px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: th.chip, padding: '4px 12px', borderRadius: isNprep ? 20 : 4 }}>Q{curEntry.num}</span>
                  <span style={{ fontSize: 11.5, color: th.faint }}>Section {curEntry.sec.id}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
                </div>
                <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.55, marginBottom: 18 }}>{q.text}</p>
                {q.image && <img src={q.image} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ maxWidth: q.imageLarge ? '100%' : 340, maxHeight: q.imageLarge ? 340 : 220, border: `1px solid ${th.bd}`, borderRadius: 8, marginBottom: 18, display: 'block' }} />}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options.map((opt, i) => {
                    const isCorrect = i === q.answer
                    const isChosen = chosen === i
                    let bg = th.pane, bd = th.bd, fg = T1, badge = null
                    if (isCorrect) { bg = GREEN_L; bd = isNprep ? '#BDE8D2' : GREEN; fg = GREEN; badge = <span style={{ fontSize: 11.5, fontWeight: 700, color: GREEN }}>✓ Correct{isChosen ? ' · Your answer' : ''}</span> }
                    else if (isChosen) { bg = RED_L; bd = isNprep ? '#F5C6C8' : RED; fg = RED; badge = <span style={{ fontSize: 11.5, fontWeight: 700, color: RED }}>✕ Your answer</span> }
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: isNprep ? 10 : 4, background: bg, border: `1.5px solid ${bd}`, fontSize: 14.5 }}>
                        <span style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${isCorrect || isChosen ? fg : th.bd}`, color: isCorrect || isChosen ? fg : th.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{LETTERS[i]}</span>
                        <span style={{ flex: 1, color: fg, fontWeight: isCorrect || isChosen ? 600 : 400 }}>{opt}</span>
                        {badge}
                      </div>
                    )
                  })}
                </div>

                {chosen === null && (
                  <div style={{ marginTop: 12, fontSize: 12.5, color: th.faint }}>You did not attempt this question.</div>
                )}

                {view === 'solution' && (
                  <div style={{ marginTop: 18, background: isNprep ? PL : '#f3f7fb', borderRadius: isNprep ? 10 : 4, padding: '14px 16px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: th.accent, marginBottom: 5 }}>Solution</div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.65, color: th.muted }}>{expl.text}</p>
                  </div>
                )}
                {view === 'response' && (
                  <button onClick={() => setView('solution')} style={{ marginTop: 16, background: 'none', border: `1px solid ${th.accent}`, color: th.accent, borderRadius: isNprep ? 20 : 4, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>View Solution →</button>
                )}
              </div>
            </div>
          </div>
          {/* Nav footer */}
          <div style={{ flexShrink: 0, background: th.pane, borderTop: `1px solid ${th.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
            <button onClick={() => goPos(-1)} style={{ background: th.pane, border: `1px solid ${th.bd}`, borderRadius: isNprep ? 10 : 4, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: T1, cursor: 'pointer' }}>« Previous</button>
            <span style={{ fontSize: 12, color: th.faint }}>{(filtered.findIndex(o => o.gi === cur) + 1) || 1} of {filtered.length || ordered.length}{filter !== 'all' ? ` ${filter}` : ''}</span>
            <button onClick={() => goPos(1)} style={{ background: th.accent, border: 'none', borderRadius: isNprep ? 10 : 4, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Next »</button>
          </div>
        </div>

        {/* Palette */}
        <aside style={{ width: 300, flexShrink: 0, background: th.palBg, borderLeft: `1px solid ${th.bd}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 10 }}>Question Review</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {filterChips.map(([id, l, n]) => {
                const active = filter === id
                const c = id === 'correct' ? GREEN : id === 'incorrect' ? RED : id === 'skipped' ? th.faint : th.accent
                return (
                  <button key={id} onClick={() => applyFilter(id)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 16, cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
                    background: active ? (isNprep ? PL : '#e6ebf2') : (isNprep ? '#fff' : '#fff'), color: active ? c : th.muted, border: `1px solid ${active ? c : th.bd}`,
                  }}>{l} <span style={{ color: c }}>{n}</span></button>
                )
              })}
            </div>
          </div>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
            {sections.map((s, si) => {
              const cells = ordered.filter(o => o.si === si && matches(o))
              if (!cells.length) return null
              return (
                <div key={s.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: th.accent, margin: '4px 0 8px' }}>Section {s.id}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, justifyItems: 'center' }}>
                    {cells.map(o => {
                      const r = resultOf(o.gi), c = palColors[r], active = o.gi === cur
                      return (
                        <button key={o.gi} onClick={() => setCur(o.gi)} style={{
                          width: 34, height: 34, borderRadius: isNprep ? 9 : 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          background: c.bg, color: c.fg, border: `1.5px solid ${active ? th.chip : (c.bd || c.bg)}`, outline: active ? `2px solid ${th.chip}33` : 'none',
                        }}>{o.num}</button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${th.bd}`, display: 'flex', gap: 12, fontSize: 11, color: th.muted }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: GREEN }} />Correct</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: RED }} />Wrong</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#fff', border: `1px solid ${th.bd}` }} />Skipped</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
