import { useState, useEffect, useRef } from 'react'
import {
  QUESTIONS as DEFAULT_QUESTIONS,
  SECTIONS as DEFAULT_SECTIONS,
  SECTION_DURATION,
  EXAM_META as DEFAULT_EXAM_META,
} from '../exam/examData'
import { LIVE_TEST, P, PD, PL, G, GL, A, AL, T1, T2, T3, BD, BG2 } from '../data'
import { ordinal } from '../utils/format'
import { shuffleForAttempt } from '../exam/shuffle'

const RED = '#E5484D', RED_L = '#FDECED'
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const fmt = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`
}
const estimatePercentile = (acc) => Math.min(99, Math.max(1, Math.round(100 * (1 - Math.exp(-acc / 32)))))

// Palette status glyph — NPrep palette only (green answered, red not-answered, amber
// marked, grey not-visited); answered+marked = green with an amber dot.
function PaletteCell({ status, num, active, onClick }) {
  const map = {
    answered: { bg: G, fg: '#fff', bd: G },
    notanswered: { bg: RED, fg: '#fff', bd: RED },
    marked: { bg: A, fg: '#fff', bd: A },
    answeredmarked: { bg: G, fg: '#fff', bd: G },
    notvisited: { bg: '#fff', fg: T2, bd: BD },
  }
  const c = map[status] || map.notvisited
  return (
    <button onClick={onClick} style={{
      position: 'relative', width: 34, height: 34, borderRadius: 8, fontSize: 12.5, fontWeight: 600,
      background: c.bg, color: c.fg, border: `1.5px solid ${active ? PD : c.bd}`,
      outline: active ? `2px solid ${PD}33` : 'none', cursor: 'pointer', flexShrink: 0,
    }}>
      {num}
      {status === 'answeredmarked' && <span style={{ position: 'absolute', bottom: -2, right: -2, width: 11, height: 11, background: A, borderRadius: '50%', border: '2px solid #fff' }} />}
    </button>
  )
}

// NPrep full-mock interface — the lenient, free-navigation counterpart to the NORCET CBT.
// Jump between any section/question, one total timer, submit → summary → thank-you. Keyboard
// is allowed; leaving the test does not pause it — it auto-submits (unanswered left blank).
export default function DesktopExamNPrepMock({ onExit, onFinish, customQuestions, customSections, customMeta }) {
  const META = customMeta || DEFAULT_EXAM_META
  const provider = META.provider || 'NPrep'
  const seriesName = META.series || META.shortName || 'NASHTA'
  const stageName = META.stage || 'Full Mock'
  const [{ questions: QUESTIONS, sections: SECTIONS }] = useState(() =>
    shuffleForAttempt(customQuestions || DEFAULT_QUESTIONS, customSections || DEFAULT_SECTIONS)
  )
  const secDur = META.sectionSeconds || SECTION_DURATION
  const TOTAL = SECTIONS.length * secDur

  const [curSec, setCurSec] = useState(0)
  const [curQLocal, setCurQLocal] = useState(0)
  const [answers, setAnswers] = useState(() => Array(QUESTIONS.length).fill(null))
  const [marked, setMarked] = useState(() => Array(QUESTIONS.length).fill(false))
  const [visited, setVisited] = useState(() => Array(QUESTIONS.length).fill(false))
  const [timeLeft, setTimeLeft] = useState(TOTAL)
  const [phase, setPhase] = useState('exam') // exam | submitted | results
  const [showSubmit, setShowSubmit] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [results, setResults] = useState(null)

  const section = SECTIONS[curSec]
  const gIdx = section.ids[curQLocal]
  const q = QUESTIONS[gIdx]
  const chosen = answers[gIdx]
  const globalNum = SECTIONS.slice(0, curSec).reduce((n, s) => n + s.ids.length, 0) + curQLocal + 1
  const total = QUESTIONS.length
  const isLast = curSec === SECTIONS.length - 1 && curQLocal === section.ids.length - 1

  const status = (i) => {
    const ans = answers[i] !== null, mk = marked[i]
    if (ans && mk) return 'answeredmarked'
    if (ans) return 'answered'
    if (mk) return 'marked'
    if (visited[i]) return 'notanswered'
    return 'notvisited'
  }
  const counts = { answered: 0, notanswered: 0, marked: 0, answeredmarked: 0, notvisited: 0 }
  QUESTIONS.forEach((_, i) => { counts[status(i)]++ })

  const finalize = () => {
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
    const r = { correct, wrong, unattempted, score, accuracy, timeTaken: TOTAL - timeLeft, sectionStats, percentile, air, weakestSection, testName: `${seriesName} ${stageName}` }
    setResults(r); setShowSubmit(false); setPhase('submitted'); onFinish?.(r)
  }
  const finalizeRef = useRef(finalize); finalizeRef.current = finalize

  // One total timer. Auto-submits when it hits zero — the test never pauses.
  useEffect(() => {
    if (phase !== 'exam') return
    const id = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(id); finalizeRef.current(); return 0 }
      return t - 1
    }), 1000)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => { setVisited(prev => { if (prev[gIdx]) return prev; const n = [...prev]; n[gIdx] = true; return n }) }, [gIdx])

  const goNext = () => {
    if (!isLast) {
      if (curQLocal < section.ids.length - 1) setCurQLocal(l => l + 1)
      else { setCurSec(s => s + 1); setCurQLocal(0) }
    }
  }
  const goPrev = () => {
    if (curQLocal > 0) setCurQLocal(l => l - 1)
    else if (curSec > 0) { const ps = curSec - 1; setCurSec(ps); setCurQLocal(SECTIONS[ps].ids.length - 1) }
  }
  const select = (i) => setAnswers(prev => { const n = [...prev]; n[gIdx] = i; return n })
  const clear = () => setAnswers(prev => { const n = [...prev]; n[gIdx] = null; return n })
  const markNext = () => { setMarked(prev => { const n = [...prev]; n[gIdx] = !n[gIdx]; return n }); goNext() }
  const saveNext = () => goNext()
  const jumpTo = (localIdx) => setCurQLocal(localIdx)
  const switchSection = (i) => { setCurSec(i); setCurQLocal(0) } // free navigation
  const answeredIn = (sec) => sec.ids.filter(id => answers[id] !== null).length

  const btn = (x = {}) => ({ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: `1px solid ${BD}`, background: '#fff', color: T1, cursor: 'pointer', ...x })

  // ── Thank-you / summary ────────────────────────────────────────────────────
  if (phase === 'submitted') {
    const attempted = counts.answered + counts.answeredmarked
    return (
      <div style={{ position: 'fixed', inset: 0, background: BG2, overflowY: 'auto', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 560, background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '30px 32px 22px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: GL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: PD, marginBottom: 6 }}>Thank you for submitting!</div>
            <div style={{ fontSize: 13.5, color: T2, lineHeight: 1.6 }}>Your <strong style={{ color: T1 }}>{seriesName} {stageName}</strong> attempt has been recorded.</div>
          </div>
          <div style={{ padding: '0 24px 20px' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[{ l: 'Attempted', v: attempted, c: G }, { l: 'Marked', v: counts.marked + counts.answeredmarked, c: A }, { l: 'Unattempted', v: total - attempted, c: RED }].map(s => (
                <div key={s.l} style={{ flex: 1, background: BG2, borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10.5, color: T3, marginTop: 3 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', background: BG2, padding: '9px 12px', fontSize: 11, fontWeight: 600, color: T2 }}>
                <span>Section</span><span style={{ textAlign: 'center' }}>Attempted</span><span style={{ textAlign: 'center' }}>Marked</span><span style={{ textAlign: 'center' }}>Left</span>
              </div>
              {SECTIONS.map(s => {
                const at = s.ids.filter(id => answers[id] !== null).length
                const mk = s.ids.filter(id => marked[id]).length
                return (
                  <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', padding: '9px 12px', fontSize: 12, borderTop: `1px solid ${BD}` }}>
                    <span style={{ color: T1, fontWeight: 500 }}>Section {s.id}</span>
                    <span style={{ textAlign: 'center', color: G, fontWeight: 600 }}>{at}</span>
                    <span style={{ textAlign: 'center', color: A, fontWeight: 600 }}>{mk}</span>
                    <span style={{ textAlign: 'center', color: T3 }}>{s.ids.length - at}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onExit} style={{ ...btn({ flex: 1, padding: '13px' }) }}>Back to Tests</button>
              <button onClick={() => setPhase('results')} style={{ flex: 1, padding: '13px', borderRadius: 24, background: P, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>View Result</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const r = results, ac = r.accuracy >= 60 ? G : r.accuracy >= 40 ? A : RED
    return (
      <div style={{ position: 'fixed', inset: 0, background: BG2, overflowY: 'auto', fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <button onClick={onExit} style={{ ...btn({ borderRadius: 20, padding: '7px 14px', color: T2 }) }}>← Back to Tests</button>
            <div style={{ fontSize: 18, fontWeight: 700, color: T1 }}>Result — {seriesName} {stageName}</div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, padding: '26px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Your Score</div>
            <div><span style={{ fontSize: 44, fontWeight: 700, color: PD }}>{r.score}</span><span style={{ fontSize: 18, color: T3 }}> / {META.totalMarks}</span></div>
            <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 700, color: ac }}>{r.accuracy}% Accuracy · {fmt(r.timeTaken)} taken</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[{ l: 'Correct', v: r.correct, c: G }, { l: 'Wrong', v: r.wrong, c: RED }, { l: 'Skipped', v: r.unattempted, c: T3 }].map(s => (
              <div key={s.l} style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.c }}>{s.v}</div><div style={{ fontSize: 11, color: T3, marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: PD }}>{r.percentile}{ordinal(r.percentile)}</div><div style={{ fontSize: 11, color: T3, marginTop: 3 }}>Est. Percentile</div>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: PD }}>~{r.air.toLocaleString()}</div><div style={{ fontSize: 11, color: T3, marginTop: 3 }}>Est. All-India Rank</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T2, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Section Performance</div>
          {r.sectionStats.map(s => {
            const tt = s.correct + s.wrong + s.unattempted, pct = tt ? Math.round((s.correct / tt) * 100) : 0
            const fg = pct >= 60 ? G : pct >= 40 ? A : RED
            return (
              <div key={s.name} style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span style={{ fontWeight: 600 }}>{s.name}</span><span style={{ fontWeight: 700, color: fg }}>{pct}%</span></div>
                <div style={{ height: 6, background: BG2, borderRadius: 3 }}><div style={{ height: '100%', width: `${pct}%`, background: fg, borderRadius: 3 }} /></div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const lowTime = timeLeft <= 300
  // ── Exam ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: BG2, display: 'flex', flexDirection: 'column', fontFamily: "'Poppins', sans-serif", color: T1 }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px' }}>
        <button onClick={() => setShowExit(true)} title="Exit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T2, display: 'flex', padding: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: PD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>N</div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T1 }}>{seriesName} — {stageName}</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, background: lowTime ? RED_L : BG2, color: lowTime ? RED : PD, fontSize: 14, fontWeight: 700 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {fmt(timeLeft)}
        </div>
        <button onClick={() => setShowSubmit(true)} style={{ padding: '8px 20px', borderRadius: 20, background: P, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Submit Test</button>
      </div>

      {/* Section tabs — free navigation */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BD}`, display: 'flex', gap: 4, padding: '0 16px', overflowX: 'auto' }}>
        {SECTIONS.map((s, i) => {
          const active = i === curSec
          return (
            <button key={s.id} onClick={() => switchSection(i)} style={{
              display: 'flex', flexDirection: 'column', gap: 1, padding: '10px 16px', minWidth: 130, textAlign: 'left', background: 'none', border: 'none',
              borderBottom: `2.5px solid ${active ? P : 'transparent'}`, cursor: 'pointer', flexShrink: 0,
            }}>
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? P : T2 }}>{s.name}</span>
              <span style={{ fontSize: 10.5, color: T3 }}>{answeredIn(s)}/{s.ids.length} answered</span>
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Question pane */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ maxWidth: 760 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T1 }}>Question {globalNum} <span style={{ color: T3, fontWeight: 500 }}>/ {total}</span></span>
                <span style={{ fontSize: 11.5, color: T3 }}>{section.fullName}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11.5, color: T3 }}>Marks <span style={{ color: G, fontWeight: 600 }}>+{META.correctMarks}</span> / <span style={{ color: RED, fontWeight: 600 }}>{META.wrongMarks}</span></span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.55, marginBottom: 22 }}>{q.text}</p>
              {q.image && <img src={q.image} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ maxWidth: q.imageLarge ? '100%' : 320, maxHeight: q.imageLarge ? 360 : 220, border: `1px solid ${BD}`, borderRadius: 8, marginBottom: 18, display: 'block' }} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map((opt, i) => {
                  const on = chosen === i
                  return (
                    <button key={i} onClick={() => select(i)} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                      background: on ? PL : '#fff', border: `1.5px solid ${on ? P : BD}`, cursor: 'pointer',
                    }}>
                      <span style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${on ? P : BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: on ? P : T2, flexShrink: 0 }}>{LETTERS[i]}</span>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: on ? P : T1 }}>{opt}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          {/* Footer actions */}
          <div style={{ flexShrink: 0, background: '#fff', borderTop: `1px solid ${BD}`, display: 'flex', justifyContent: 'space-between', padding: '12px 20px', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={markNext} style={btn()}>Mark for Review &amp; Next</button>
              <button onClick={clear} style={btn()}>Clear Response</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={goPrev} disabled={globalNum === 1} style={btn({ opacity: globalNum === 1 ? 0.5 : 1 })}>« Previous</button>
              <button onClick={saveNext} style={btn({ background: P, color: '#fff', border: 'none' })}>Save &amp; Next</button>
            </div>
          </div>
        </div>

        {/* Palette */}
        <aside style={{ width: 288, flexShrink: 0, background: '#fff', borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BD}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 10 }}>Question Palette</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 10px', fontSize: 11.5, color: T2 }}>
              {[['answered', 'Answered', counts.answered], ['notanswered', 'Not Answered', counts.notanswered], ['marked', 'Marked', counts.marked], ['notvisited', 'Not Visited', counts.notvisited]].map(([st, lbl, n]) => (
                <span key={st} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: st === 'answered' ? G : st === 'notanswered' ? RED : st === 'marked' ? A : '#fff', border: st === 'notvisited' ? `1.5px solid ${BD}` : 'none', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{st === 'notvisited' ? '' : n}</span>
                  {lbl}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: P, background: BG2, flexShrink: 0 }}>{section.fullName}</div>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 9, justifyItems: 'center' }}>
              {section.ids.map((id, i) => <PaletteCell key={id} status={status(id)} num={SECTIONS.slice(0, curSec).reduce((n, s) => n + s.ids.length, 0) + i + 1} active={i === curQLocal} onClick={() => jumpTo(i)} />)}
            </div>
          </div>
          <div style={{ padding: 14, borderTop: `1px solid ${BD}` }}>
            <button onClick={() => setShowSubmit(true)} style={{ width: '100%', padding: '12px', borderRadius: 24, background: P, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Submit Test</button>
          </div>
        </aside>
      </div>

      {/* Submit summary modal */}
      {showSubmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,27,99,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 8px', fontSize: 17, fontWeight: 700, color: T1 }}>Submit your test?</div>
            <div style={{ padding: '0 24px 16px', fontSize: 13, color: T2, lineHeight: 1.6 }}>You've answered <strong style={{ color: T1 }}>{counts.answered + counts.answeredmarked}</strong> of {total} questions. Once submitted you cannot change your answers.</div>
            <div style={{ display: 'flex', gap: 10, padding: '0 24px 12px' }}>
              {[['Answered', counts.answered + counts.answeredmarked, G], ['Marked', counts.marked + counts.answeredmarked, A], ['Unattempted', total - counts.answered - counts.answeredmarked, RED]].map(([l, v, c]) => (
                <div key={l} style={{ flex: 1, background: BG2, borderRadius: 10, padding: '12px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 10, color: T3, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '10px 24px 20px' }}>
              <button onClick={() => setShowSubmit(false)} style={{ ...btn({ padding: '11px 18px' }) }}>Keep attempting</button>
              <button onClick={finalize} style={{ padding: '11px 22px', borderRadius: 24, background: P, color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Submit Test</button>
            </div>
          </div>
        </div>
      )}

      {/* Exit confirm — leaving does not pause the test */}
      {showExit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,27,99,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: '24px' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T1, marginBottom: 8 }}>Leave the test?</div>
            <div style={{ fontSize: 13, color: T2, lineHeight: 1.65, marginBottom: 20 }}>
              This test won't pause — the timer keeps running in the background. If you leave now your test will be <strong style={{ color: T1 }}>submitted automatically</strong>, and any unanswered questions will be left unattempted.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowExit(false)} style={{ ...btn({ padding: '11px 18px' }) }}>Stay in test</button>
              <button onClick={() => { setShowExit(false); finalize() }} style={{ padding: '11px 20px', borderRadius: 24, background: RED, color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Leave &amp; submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
