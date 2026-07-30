import { useState } from 'react'
import { P, PD, PL, G, GL, T1, T2, T3, BD, BG2 } from '../data'
import { explanationFor } from '../exam/practiceContent'

const RED = '#E5484D', RED_L = '#FDECED', GREEN = '#189A57', GREEN_L = '#E9F8F0'
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// Post-test answer review. Its look mirrors the interface the test was attempted in —
// 'nprep' (clean edtech) or 'norcet' (govt CBT). A toggle lets you switch styles to
// compare (a prototype reference affordance).
export default function SolutionView({ questions, sections, answers, meta, interface: initialStyle = 'nprep', onBack }) {
  const [style, setStyle] = useState(initialStyle)
  const isNprep = style === 'nprep'
  const testName = meta?.series ? `${meta.series} ${meta.stage || ''}`.trim() : (meta?.shortName || 'Test')

  // Section label for a global question index
  const secOf = (gi) => sections.find(s => s.ids.includes(gi))
  // Ordered by section then position
  const ordered = sections.flatMap((s, si) => s.ids.map((gi, li) => ({ gi, si, num: sections.slice(0, si).reduce((n, x) => n + x.ids.length, 0) + li + 1 })))

  let correctN = 0, wrongN = 0, skipN = 0
  ordered.forEach(({ gi }) => {
    if (answers[gi] === null) skipN++
    else if (answers[gi] === questions[gi].answer) correctN++
    else wrongN++
  })

  // ── Theme ────────────────────────────────────────────────────────────────
  const th = isNprep
    ? { font: "'Poppins', sans-serif", pageBg: BG2, card: '#fff', cardBd: BD, radius: 14, navy: PD, accent: P, headBg: '#fff', headColor: T1, muted: T2, faint: T3, qChip: PD }
    : { font: 'Arial, sans-serif', pageBg: '#eef2f6', card: '#fff', cardBd: '#dde3ea', radius: 6, navy: '#1a3a6b', accent: '#1a3a6b', headBg: '#1a3a6b', headColor: '#fff', muted: '#555', faint: '#888', qChip: '#1a3a6b' }

  const optRow = (opt, i, q, chosen) => {
    const isCorrect = i === q.answer
    const isChosenWrong = chosen === i && chosen !== q.answer
    let bg = th.card, bd = th.cardBd, fg = T1, badge = th.faint
    if (isCorrect) { bg = GREEN_L; bd = isNprep ? '#BDE8D2' : GREEN; fg = GREEN; badge = GREEN }
    else if (isChosenWrong) { bg = RED_L; bd = isNprep ? '#F5C6C8' : RED; fg = RED; badge = RED }
    return (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: isNprep ? 10 : 4, background: bg, border: `1.5px solid ${bd}`, fontSize: 14.5 }}>
        <span style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${badge}`, color: badge, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>{LETTERS[i]}</span>
        <span style={{ flex: 1, color: fg, fontWeight: isCorrect || isChosenWrong ? 600 : 400 }}>{opt}</span>
        {isCorrect && <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>✓ Correct</span>}
        {isChosenWrong && <span style={{ fontSize: 11, fontWeight: 700, color: RED }}>Your answer</span>}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: th.pageBg, overflowY: 'auto', fontFamily: th.font, color: T1 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: th.headBg, color: th.headColor, padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${isNprep ? BD : '#12294d'}` }}>
        <button onClick={onBack} style={{ background: isNprep ? '#fff' : 'rgba(255,255,255,0.15)', border: isNprep ? `1px solid ${BD}` : 'none', borderRadius: 20, padding: '6px 13px', cursor: 'pointer', color: isNprep ? T2 : '#fff', fontSize: 12.5, fontWeight: 600 }}>← Back</button>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Solutions — {testName}</div>
        <div style={{ flex: 1 }} />
        {/* Reference toggle (prototype) */}
        <span style={{ fontSize: 11, color: isNprep ? T3 : 'rgba(255,255,255,0.7)' }}>Reference:</span>
        <div style={{ display: 'inline-flex', background: isNprep ? BG2 : 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 3, gap: 2 }}>
          {[{ id: 'nprep', l: 'NPrep' }, { id: 'norcet', l: 'NORCET' }].map(o => {
            const active = style === o.id
            return (
              <button key={o.id} onClick={() => setStyle(o.id)} style={{
                padding: '5px 14px', borderRadius: 15, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? (isNprep ? P : '#fff') : 'transparent', color: active ? (isNprep ? '#fff' : '#1a3a6b') : (isNprep ? T2 : 'rgba(255,255,255,0.85)'),
              }}>{o.l}</button>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 20px 60px' }}>
        {/* Score strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[{ l: 'Correct', v: correctN, c: GREEN }, { l: 'Wrong', v: wrongN, c: RED }, { l: 'Skipped', v: skipN, c: th.faint }].map(s => (
            <div key={s.l} style={{ flex: 1, background: th.card, border: `1px solid ${th.cardBd}`, borderRadius: th.radius, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: th.faint, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {ordered.map(({ gi, num }) => {
          const q = questions[gi]
          const chosen = answers[gi]
          const expl = explanationFor(q)
          const sec = secOf(gi)
          const verdict = chosen === null ? 'skip' : chosen === q.answer ? 'right' : 'wrong'
          const vColor = verdict === 'right' ? GREEN : verdict === 'wrong' ? RED : th.faint
          return (
            <div key={gi} style={{ background: th.card, border: `1px solid ${th.cardBd}`, borderRadius: th.radius, padding: '20px 22px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: th.qChip, padding: '3px 11px', borderRadius: isNprep ? 20 : 4 }}>Q{num}</span>
                <span style={{ fontSize: 11.5, color: th.faint }}>Section {sec?.id}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: vColor }}>{verdict === 'right' ? 'Correct' : verdict === 'wrong' ? 'Incorrect' : 'Not answered'}</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginBottom: 16 }}>{q.text}</p>
              {q.image && <img src={q.image} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ maxWidth: q.imageLarge ? '100%' : 320, maxHeight: q.imageLarge ? 300 : 200, border: `1px solid ${th.cardBd}`, borderRadius: 8, marginBottom: 16, display: 'block' }} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {q.options.map((opt, i) => optRow(opt, i, q, chosen))}
              </div>
              <div style={{ background: isNprep ? PL : '#f3f7fb', borderRadius: isNprep ? 10 : 4, padding: '13px 16px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: th.accent, marginBottom: 5 }}>Explanation</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: th.muted }}>{expl.text}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
