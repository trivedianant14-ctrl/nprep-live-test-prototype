import { useState, useEffect } from 'react'
import {
  QUESTIONS as DEFAULT_QUESTIONS,
  SECTIONS as DEFAULT_SECTIONS,
  EXAM_META as DEFAULT_EXAM_META,
} from '../exam/examData'
import { LIVE_TEST, P, PD, PL, G, GL, T1, T2, T3, BD, BG2 } from '../data'
import { ordinal } from '../utils/format'
import { shuffleForAttempt } from '../exam/shuffle'
import { practiceTags, optionStats, explanationFor } from '../exam/practiceContent'

const GREEN = '#189A57', GREEN_L = '#E9F8F0', GREEN_B = '#BDE8D2'
const RED = '#E5484D', RED_L = '#FDECED', RED_B = '#F5C6C8'
const AMBER = '#C98A1B'
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const REVISION_TAGS = ['Guess', 'Ran out of time', 'Need Revision', 'Important', 'Got it Wrong']

const estimatePercentile = (acc) => Math.min(99, Math.max(1, Math.round(100 * (1 - Math.exp(-acc / 32)))))

// NPrep "Prep Mode" — a clean practice interface with immediate feedback, cohort option
// stats, explanations and a personal revision list. The relaxed counterpart to the strict
// NORCET CBT: answer, learn why, move on — no section lock.
export default function DesktopExamNPrep({ onExit, onFinish, customQuestions, customSections, customMeta }) {
  const META = customMeta || DEFAULT_EXAM_META
  const [{ questions: QUESTIONS, sections: SECTIONS }] = useState(() =>
    shuffleForAttempt(customQuestions || DEFAULT_QUESTIONS, customSections || DEFAULT_SECTIONS)
  )
  const [curSec, setCurSec] = useState(0)
  const [curQLocal, setCurQLocal] = useState(0)
  const [answers, setAnswers] = useState(() => Array(QUESTIONS.length).fill(null))
  const [revealed, setRevealed] = useState(() => new Set())
  const [visited, setVisited] = useState(() => new Set())
  const [revision, setRevision] = useState({})
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState('quiz')
  const [results, setResults] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)

  const section = SECTIONS[curSec]
  const gIdx = section.ids[curQLocal]
  const q = QUESTIONS[gIdx]
  const chosen = answers[gIdx]
  const isRevealed = revealed.has(gIdx)
  const globalNum = curSec * 20 + curQLocal + 1
  const total = QUESTIONS.length
  const isLast = curSec === SECTIONS.length - 1 && curQLocal === section.ids.length - 1

  useEffect(() => {
    if (phase !== 'quiz') return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => { setVisited(prev => prev.has(gIdx) ? prev : new Set(prev).add(gIdx)); setMenuOpen(false) }, [gIdx])

  const answer = (i) => {
    if (isRevealed) return
    setAnswers(prev => { const n = [...prev]; n[gIdx] = i; return n })
    setRevealed(prev => new Set(prev).add(gIdx))
  }
  const goNext = () => {
    if (isLast) return finish()
    if (curQLocal < section.ids.length - 1) setCurQLocal(l => l + 1)
    else { setCurSec(s => s + 1); setCurQLocal(0) }
  }
  const goPrev = () => {
    if (curQLocal > 0) setCurQLocal(l => l - 1)
    else if (curSec > 0) { const ps = curSec - 1; setCurSec(ps); setCurQLocal(SECTIONS[ps].ids.length - 1) }
  }
  const jumpTo = (localIdx) => { setCurQLocal(localIdx); setGridOpen(false) }
  const setRevisionTag = (tag) => { setRevision(prev => ({ ...prev, [gIdx]: tag })); setMenuOpen(false) }
  const removeRevision = () => { setRevision(prev => { const n = { ...prev }; delete n[gIdx]; return n }); setMenuOpen(false) }

  function finish() {
    let correct = 0, wrong = 0, unattempted = 0
    const sectionStats = SECTIONS.map(sec => ({ name: sec.name, correct: 0, wrong: 0, unattempted: 0 }))
    QUESTIONS.forEach((qi, i) => {
      const si = SECTIONS.findIndex(s => s.ids.includes(i))
      if (answers[i] === null) { unattempted++; sectionStats[si].unattempted++ }
      else if (answers[i] === qi.answer) { correct++; sectionStats[si].correct++ }
      else { wrong++; sectionStats[si].wrong++ }
    })
    const score = parseFloat((correct * META.correctMarks + wrong * META.wrongMarks).toFixed(2))
    const accuracy = Math.round((correct / total) * 100)
    const percentile = estimatePercentile(accuracy)
    const air = Math.max(1, Math.round(((100 - percentile) / 100) * LIVE_TEST.enrolled) + 1)
    const weakestSection = [...sectionStats].sort((a, b) => a.correct - b.correct)[0]
    const r = { correct, wrong, unattempted, score, accuracy, timeTaken: elapsed, sectionStats, percentile, air, weakestSection, testName: META.shortName }
    setResults(r); setPhase('results'); onFinish?.(r)
  }

  const pillStatus = (localIdx) => {
    const gi = section.ids[localIdx]
    if (revision[gi]) return 'marked'
    if (revealed.has(gi)) return answers[gi] === QUESTIONS[gi].answer ? 'correct' : 'wrong'
    if (visited.has(gi)) return 'visited'
    return 'unvisited'
  }
  const pillColors = {
    correct:   { bg: GREEN, fg: '#fff', bd: GREEN },
    wrong:     { bg: RED,   fg: '#fff', bd: RED },
    marked:    { bg: AMBER, fg: '#fff', bd: AMBER },
    visited:   { bg: '#fff', fg: T2, bd: BD },
    unvisited: { bg: BG2, fg: T3, bd: BD },
  }
  const Pill = ({ localIdx, size = 30 }) => {
    const st = pillStatus(localIdx), c = pillColors[st], active = localIdx === curQLocal
    return (
      <button onClick={() => jumpTo(localIdx)} style={{
        width: size, height: size, borderRadius: 8, flexShrink: 0, fontSize: 12.5, fontWeight: 600,
        background: c.bg, color: c.fg, border: `1.5px solid ${active ? PD : c.bd}`,
        outline: active ? `2px solid ${PD}33` : 'none', cursor: 'pointer',
      }}>{curSec * 20 + localIdx + 1}</button>
    )
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const r = results, ac = r.accuracy >= 60 ? GREEN : r.accuracy >= 40 ? AMBER : RED
    return (
      <div style={{ position: 'fixed', inset: 0, background: BG2, overflowY: 'auto', fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={onExit} style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 20, padding: '7px 14px', cursor: 'pointer', color: T2, fontSize: 12.5, fontWeight: 600 }}>← Back to Tests</button>
            <div style={{ fontSize: 18, fontWeight: 700, color: T1 }}>Practice Complete</div>
          </div>
          <div style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 16, padding: '26px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Your Score</div>
            <div><span style={{ fontSize: 44, fontWeight: 700, color: PD }}>{r.score}</span><span style={{ fontSize: 18, color: T3 }}> / {META.totalMarks}</span></div>
            <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 700, color: ac }}>{r.accuracy}% Accuracy · {fmt(r.timeTaken)} taken</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[{ l: 'Correct', v: r.correct, c: GREEN }, { l: 'Wrong', v: r.wrong, c: RED }, { l: 'Skipped', v: r.unattempted, c: T3 }].map(s => (
              <div key={s.l} style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.c }}>{s.v}</div><div style={{ fontSize: 11, color: T3, marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: PD }}>{r.percentile}{ordinal(r.percentile)}</div><div style={{ fontSize: 11, color: T3, marginTop: 3 }}>Est. Percentile</div>
            </div>
            <div style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: PD }}>~{r.air.toLocaleString()}</div><div style={{ fontSize: 11, color: T3, marginTop: 3 }}>Est. All-India Rank</div>
            </div>
          </div>
          {Object.keys(revision).length > 0 && (
            <div style={{ background: PL, borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 12.5, color: T1 }}>
              <span style={{ fontWeight: 700 }}>{Object.keys(revision).length} question{Object.keys(revision).length > 1 ? 's' : ''}</span> saved to your Revision List.
            </div>
          )}
          <button onClick={onExit} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 24, background: P, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Back to Tests</button>
        </div>
      </div>
    )
  }

  const tags = practiceTags(gIdx)
  const stats = optionStats(q, gIdx)
  const expl = explanationFor(q)
  const correctLetter = LETTERS[q.answer]
  const isCorrect = isRevealed && chosen === q.answer

  // ── Quiz ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: BG2, display: 'flex', flexDirection: 'column', fontFamily: "'Poppins', sans-serif", color: T1 }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${BD}`, background: '#fff' }}>
        <button onClick={onExit} title="Exit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T2, display: 'flex', padding: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: PD, fontStyle: 'italic' }}>{META.shortName?.split('—')[0]?.trim() || 'Practice'}</span>
        <div style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: T2 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {fmt(elapsed)}
        </span>
        <button onClick={() => setGridOpen(o => !o)} title="Question grid" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T2, display: 'flex', padding: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        </button>
      </div>

      {/* Palette row */}
      <div style={{ flexShrink: 0, borderBottom: `1px solid ${BD}`, background: '#fff' }}>
        <div className="scroll" style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 6, padding: '12px 20px', overflowX: 'auto', alignItems: 'center' }}>
          {section.ids.map((_, i) => <Pill key={i} localIdx={i} />)}
        </div>
      </div>

      {/* Question body */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', background: BG2 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 40px' }}>
          <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, padding: '22px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T1 }}>Question {globalNum}/{total}</span>
            {tags.map(t => <span key={t} style={{ fontSize: 10, fontWeight: 600, color: AMBER, background: '#FDF4E3', padding: '3px 8px', borderRadius: 6 }}>{t}</span>)}
            <div style={{ flex: 1 }} />
            <button onClick={() => setMenuOpen(o => !o)} title="Save to revision list" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: revision[gIdx] ? P : T3, display: 'flex', padding: 2 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill={revision[gIdx] ? P : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
            </button>
          </div>

          {/* Revision menu */}
          {menuOpen && (
            <div style={{ position: 'relative', zIndex: 5 }}>
              <div style={{ position: 'absolute', right: 0, top: -4, background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.14)', padding: 6, minWidth: 190 }}>
                {REVISION_TAGS.map(t => {
                  const isGotWrong = t === 'Got it Wrong'
                  return (
                    <button key={t} onClick={() => setRevisionTag(t)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', background: revision[gIdx] === t ? PL : 'none', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: isGotWrong ? RED : T1, textAlign: 'left' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={isGotWrong ? RED : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>{q.text}</p>
          {q.image && <img src={q.image} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ maxWidth: q.imageLarge ? '100%' : 320, maxHeight: q.imageLarge ? 360 : 220, border: `1px solid ${BD}`, borderRadius: 8, marginBottom: 18, display: 'block' }} />}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => {
              const isCorrectOpt = i === q.answer
              const isChosen = chosen === i
              let bg = '#fff', bd = BD, fg = T1
              if (isRevealed) {
                if (isCorrectOpt) { bg = GREEN_L; bd = GREEN_B; fg = GREEN }
                else if (isChosen) { bg = RED_L; bd = RED_B; fg = RED }
              } else if (isChosen) { bg = PL; bd = P; fg = P }
              return (
                <button key={i} onClick={() => answer(i)} disabled={isRevealed} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                  background: bg, border: `1.5px solid ${bd}`, cursor: isRevealed ? 'default' : 'pointer', textAlign: 'left',
                }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${isRevealed && (isCorrectOpt || isChosen) ? fg : BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: isRevealed && (isCorrectOpt || isChosen) ? fg : T2, flexShrink: 0 }}>{LETTERS[i]}</span>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: fg }}>{opt}</span>
                  {isRevealed && <span style={{ fontSize: 12.5, fontWeight: 600, color: T3 }}>{stats[i]}%</span>}
                </button>
              )
            })}
          </div>

          {/* Feedback + explanation */}
          {isRevealed && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, padding: '11px 14px', borderRadius: 12, background: isCorrect ? GREEN_L : RED_L, color: isCorrect ? GREEN : RED, fontSize: 13.5, fontWeight: 600 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  {isCorrect ? <polyline points="20 6 9 17 4 12" /> : <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>}
                </svg>
                {isCorrect ? 'Correct!' : `Not Quite! You picked ${LETTERS[chosen]}, Correct is ${correctLetter}`}
              </div>

              {revision[gIdx] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', borderRadius: 12, border: `1px solid ${BD}`, fontSize: 12.5, color: T2 }}>
                  <span style={{ fontWeight: 600, color: T1 }}>Added to Revision List:</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: revision[gIdx] === 'Got it Wrong' ? RED : P }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>{revision[gIdx]}
                  </span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', color: P, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Change</button>
                  <button onClick={removeRevision} style={{ background: 'none', border: 'none', color: T3, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: P, marginBottom: 8 }}>Explanation</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: T2 }}>{expl.text}</p>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${BD}`, background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
          <button onClick={goPrev} disabled={globalNum === 1} style={{ width: 46, height: 46, borderRadius: '50%', border: `1px solid ${BD}`, background: '#fff', cursor: globalNum === 1 ? 'default' : 'pointer', color: globalNum === 1 ? T3 : T1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button onClick={goNext} style={{ flex: 1, padding: '14px', borderRadius: 12, background: PD, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>

      {/* Full grid overlay */}
      {gridOpen && (
        <div onClick={() => setGridOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 20, maxWidth: 420, width: '90%', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T1, marginBottom: 12 }}>{section.fullName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, justifyItems: 'center' }}>
              {section.ids.map((_, i) => <Pill key={i} localIdx={i} size={36} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
