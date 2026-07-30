import { useState, useEffect, useRef } from 'react'
import {
  QUESTIONS as DEFAULT_QUESTIONS,
  SECTIONS as DEFAULT_SECTIONS,
  SECTION_DURATION,
  EXAM_META as DEFAULT_EXAM_META,
} from '../exam/examData'
import { LIVE_TEST, P, PD, PL, G, GL, A, T1, T2, T3, BD, BG2 } from '../data'
import { ordinal } from '../utils/format'
import { shuffleForAttempt } from '../exam/shuffle'
import AnalysisView from './AnalysisView'
import nprepLogo from '../assets/nprep-logo.png'

const RED = '#E5484D', RED_L = '#FDECED'
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const fmt = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`
}
const estimatePercentile = (acc) => Math.min(99, Math.max(1, Math.round(100 * (1 - Math.exp(-acc / 32)))))

function PaletteCell({ status, num, active, onClick }) {
  const map = {
    answered: { bg: G, fg: '#fff', filled: true }, notanswered: { bg: RED, fg: '#fff', filled: true },
    marked: { bg: A, fg: '#fff', filled: true }, answeredmarked: { bg: G, fg: '#fff', filled: true },
    notvisited: { bg: '#fff', fg: T2, filled: false },
  }
  const c = map[status] || map.notvisited
  return (
    <button onClick={onClick} style={{
      position: 'relative', width: 40, height: 40, borderRadius: 12, fontSize: 13, fontWeight: 700,
      background: c.bg, color: c.fg, border: c.filled ? 'none' : `1.5px solid ${BD}`, cursor: 'pointer', flexShrink: 0,
      boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${P}` : (c.filled ? '0 1px 2px rgba(0,0,0,0.12)' : 'none'),
      transition: 'box-shadow .12s',
    }}>
      {num}
      {status === 'answeredmarked' && <span style={{ position: 'absolute', bottom: -3, right: -3, width: 13, height: 13, background: A, borderRadius: '50%', border: '2px solid #fff' }} />}
    </button>
  )
}

// NPrep full-mock — a modern edtech test interface. Sections run in sequence (A→B→C→D→E,
// no jumping ahead or back); you "Submit Section" to move on, and the last section submits
// the test. Keyboard is allowed; leaving does not pause — it auto-submits.
export default function DesktopExamNPrepMock({ onExit, onFinish, customQuestions, customSections, customMeta }) {
  const META = customMeta || DEFAULT_EXAM_META
  const seriesName = META.series || META.shortName || 'NASHTA'
  const [{ questions: QUESTIONS, sections: SECTIONS }] = useState(() =>
    shuffleForAttempt(customQuestions || DEFAULT_QUESTIONS, customSections || DEFAULT_SECTIONS)
  )
  const secDur = META.sectionSeconds || SECTION_DURATION
  const TOTAL = SECTIONS.length * secDur
  const totalMin = Math.round(TOTAL / 60)

  const [phase, setPhase] = useState('instructions') // instructions | exam | submitted | results | solutions
  const [agreed, setAgreed] = useState(false)
  const [curSec, setCurSec] = useState(0)
  const [curQLocal, setCurQLocal] = useState(0)
  const [answers, setAnswers] = useState(() => Array(QUESTIONS.length).fill(null))
  const [marked, setMarked] = useState(() => Array(QUESTIONS.length).fill(false))
  const [visited, setVisited] = useState(() => Array(QUESTIONS.length).fill(false))
  const [timeLeft, setTimeLeft] = useState(TOTAL)
  const [showSubmit, setShowSubmit] = useState(false)   // submit-section confirm
  const [showExit, setShowExit] = useState(false)
  const [showSummary, setShowSummary] = useState(false) // per-section summary popover
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [results, setResults] = useState(null)
  const [lang, setLang] = useState('en')                // bilingual EN | हिं (tier-2/3 core need)
  const [timerOn, setTimerOn] = useState(true)          // hide-timer option (exam-anxiety research)
  const [eliminated, setEliminated] = useState({})      // { [gIdx]: number[] } struck-out options (UWorld pattern)
  const [showReport, setShowReport] = useState(false)   // report-question sheet
  const [reportToast, setReportToast] = useState('')

  const section = SECTIONS[curSec]
  const gIdx = section.ids[curQLocal]
  const q = QUESTIONS[gIdx]
  const chosen = answers[gIdx]
  const globalNum = SECTIONS.slice(0, curSec).reduce((n, s) => n + s.ids.length, 0) + curQLocal + 1
  const total = QUESTIONS.length
  const isLastSec = curSec === SECTIONS.length - 1

  const statusOf = (i) => {
    const ans = answers[i] !== null, mk = marked[i]
    if (ans && mk) return 'answeredmarked'
    if (ans) return 'answered'
    if (mk) return 'marked'
    if (visited[i]) return 'notanswered'
    return 'notvisited'
  }
  const counts = { answered: 0, notanswered: 0, marked: 0, answeredmarked: 0, notvisited: 0 }
  QUESTIONS.forEach((_, i) => { counts[statusOf(i)]++ })
  const attemptedTotal = counts.answered + counts.answeredmarked
  const answeredIn = (sec) => sec.ids.filter(id => answers[id] !== null).length

  const finalize = () => {
    let correct = 0, wrong = 0, unattempted = 0
    const sectionStats = SECTIONS.map(sec => ({ name: `Section ${sec.id}`, correct: 0, wrong: 0, unattempted: 0 }))
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
    const r = { correct, wrong, unattempted, score, accuracy, timeTaken: TOTAL - timeLeft, sectionStats, percentile, air, weakestSection, testName: `${seriesName} Mock` }
    setResults(r); setShowSubmit(false); setPhase('submitted'); onFinish?.(r)
  }
  const finalizeRef = useRef(finalize); finalizeRef.current = finalize

  useEffect(() => {
    if (phase !== 'exam') return
    const id = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(id); finalizeRef.current(); return 0 } return t - 1 }), 1000)
    return () => clearInterval(id)
  }, [phase])
  useEffect(() => { if (phase === 'exam') setVisited(prev => { if (prev[gIdx]) return prev; const n = [...prev]; n[gIdx] = true; return n }) }, [gIdx, phase])

  // Navigation is confined to the current section (sequential model).
  const goNext = () => { if (curQLocal < section.ids.length - 1) setCurQLocal(l => l + 1) }
  const goPrev = () => { if (curQLocal > 0) setCurQLocal(l => l - 1) }
  const select = (i) => {
    setAnswers(prev => { const n = [...prev]; n[gIdx] = i; return n })
    setEliminated(prev => { const cur = prev[gIdx] || []; return cur.includes(i) ? { ...prev, [gIdx]: cur.filter(x => x !== i) } : prev }) // picking a struck option restores it
  }
  const clear = () => setAnswers(prev => { const n = [...prev]; n[gIdx] = null; return n })
  const elimOf = (i) => (eliminated[gIdx] || []).includes(i)
  const toggleElim = (i) => {
    const cur = eliminated[gIdx] || []
    const willStrike = !cur.includes(i)
    setEliminated(prev => ({ ...prev, [gIdx]: willStrike ? [...cur, i] : cur.filter(x => x !== i) }))
    if (willStrike && chosen === i) clear() // striking your chosen option deselects it
  }
  const markNext = () => { setMarked(prev => { const n = [...prev]; n[gIdx] = !n[gIdx]; return n }); goNext() }
  const L = (en, hi) => (lang === 'hi' ? hi : en)          // interface translation helper
  const submitReport = (reason) => { setShowReport(false); setReportToast(L('Thanks — reported. Our team will review it.', 'धन्यवाद — रिपोर्ट भेज दी गई। हमारी टीम समीक्षा करेगी।')); setTimeout(() => setReportToast(''), 2600) }
  const jumpTo = (localIdx) => setCurQLocal(localIdx)
  // Submitting a section moves to the next; the last section submits the whole test.
  const submitSection = () => {
    if (isLastSec) { finalize(); return }
    setShowSubmit(false); setCurSec(s => s + 1); setCurQLocal(0)
  }

  const btn = (x = {}) => ({ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: `1px solid ${BD}`, background: '#fff', color: T1, cursor: 'pointer', ...x })
  const pillBtn = (x = {}) => ({ padding: '11px 22px', fontSize: 13.5, fontWeight: 600, borderRadius: 24, border: 'none', cursor: 'pointer', ...x })

  // ── Instructions ───────────────────────────────────────────────────────────
  if (phase === 'instructions') {
    const info = [{ l: 'Questions', v: total }, { l: 'Duration', v: `${totalMin} min` }, { l: 'Sections', v: SECTIONS.length }, { l: 'Marking', v: `+${META.correctMarks} / ${META.wrongMarks}` }]
    // NTA-style palette states, each with a descriptive line (kept to what the mock actually uses)
    const legend = [
      ['notvisited', 'Not Visited', '#fff', 'You have not visited the question yet.'],
      ['notanswered', 'Not Answered', RED, 'You have visited but not answered the question.'],
      ['answered', 'Answered', G, 'You have answered the question.'],
      ['marked', 'Marked for Review', A, 'You have flagged the question to look at again.'],
    ]
    const rules = [
      `The total duration of the test is ${totalMin} minutes. The countdown timer at the top runs continuously and does not pause; when it reaches 00:00 the test is submitted automatically, whether or not you have finished.`,
      'The Question Palette on the right of the screen shows the status of each question using the symbols explained below. Use it to keep track of what you have attempted.',
      'To answer a question, click one of the four options and then click Save & Next to save your response and move to the next question. Clicking a palette number moves you within the section but does not save the current answer.',
      'To leave a question for later, click Mark for Review; to remove your selected option, click Clear Response.',
      `Marking scheme: every correct answer is awarded +${META.correctMarks} mark, every wrong answer carries ${META.wrongMarks} (negative marking), and an unattempted question scores 0. Answer only when you are reasonably sure, since a wrong response reduces your total.`,
      'Sections are attempted strictly in order (A → B → C → D → E). Once you click Submit Section you move to the next section and cannot return to a completed one.',
      'Submitting the last section submits the whole test. A summary of your attempt is shown before it is final.',
    ]
    return (
      <div style={{ position: 'fixed', inset: 0, background: BG2, overflowY: 'auto', fontFamily: "'Poppins', sans-serif", color: T1, display: 'flex', flexDirection: 'column', padding: '20px 26px 26px' }}>
        <button onClick={onExit} style={{ ...btn({ borderRadius: 20, padding: '7px 14px', color: T2, marginBottom: 16, alignSelf: 'flex-start' }) }}>← Back to Tests</button>
        <div style={{ flex: 1, minHeight: 0, background: '#fff', border: `1px solid ${BD}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: `linear-gradient(135deg, ${PD}, #1e2a7a)`, color: '#fff', padding: '22px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', background: '#fff', padding: '6px 12px', borderRadius: 12, marginBottom: 12 }}>
                <img src={nprepLogo} alt="NPrep" style={{ height: 30, width: 'auto', display: 'block' }} />
              </div>
              <div style={{ fontSize: 23, fontWeight: 700, marginBottom: 4 }}>{seriesName} — Full Mock Test</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>Please read all the instructions carefully before you begin.</div>
            </div>
            <div style={{ display: 'flex', gap: 26 }}>
              {info.map((it) => (
                <div key={it.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 19, fontWeight: 700 }}>{it.v}</div>
                  <div style={{ fontSize: 10.5, opacity: 0.8, marginTop: 2 }}>{it.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column body fills the width so there's no long scroll */}
          <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.15fr 0.85fr' }}>
            <div style={{ padding: '22px 32px', overflowY: 'auto', borderRight: `1px solid ${BD}` }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T1, marginBottom: 14 }}>General Instructions</div>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                {rules.map((r, i) => <li key={i} style={{ fontSize: 13, color: T2, lineHeight: 1.6, marginBottom: 13 }}>{r}</li>)}
              </ol>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ flex: 1, padding: '22px 30px', overflowY: 'auto' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T1, marginBottom: 6 }}>The Question Palette</div>
                <div style={{ fontSize: 12.5, color: T2, lineHeight: 1.6, marginBottom: 16 }}>Each question in the palette carries one of the following symbols:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {legend.map(([st, lbl, col, desc]) => (
                    <div key={st} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 12.5, color: T2 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 6, background: col, border: st === 'notvisited' ? `1.5px solid ${BD}` : 'none', flexShrink: 0, marginTop: 1 }} />
                      <div><span style={{ fontWeight: 700, color: T1 }}>{lbl}</span> — {desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Declaration gate pinned at the bottom of the right column */}
              <div style={{ background: PL, borderTop: `1px solid ${BD}`, padding: '16px 30px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 12.5, color: T2, lineHeight: 1.55, marginBottom: 14 }}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 18, height: 18, accentColor: P, marginTop: 1, flexShrink: 0, cursor: 'pointer' }} />
                  <span>I have read and understood all the instructions above. I am ready to begin and understand the timer runs continuously once I start.</span>
                </label>
                <button onClick={() => agreed && setPhase('exam')} disabled={!agreed} style={{ ...pillBtn({ width: '100%', padding: '14px', fontSize: 15, background: agreed ? P : '#B9C4E0', color: '#fff' }), cursor: agreed ? 'pointer' : 'not-allowed' }}>I'm ready — Start Test →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Analysis (Career-Launcher-style tabbed review) ─────────────────────────
  if (phase === 'analysis') {
    return <AnalysisView questions={QUESTIONS} sections={SECTIONS} answers={answers} marked={marked} meta={META} results={results} interface="nprep" onBack={onExit} />
  }

  // ── Thank-you / summary ────────────────────────────────────────────────────
  if (phase === 'submitted') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: BG2, overflowY: 'auto', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 560, background: '#fff', border: `1px solid ${BD}`, borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '26px 32px 22px', textAlign: 'center' }}>
            <img src={nprepLogo} alt="NPrep" style={{ height: 30, margin: '0 auto 20px', display: 'block' }} />
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: GL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: PD, marginBottom: 6 }}>Thank you for submitting!</div>
            <div style={{ fontSize: 13.5, color: T2, lineHeight: 1.6 }}>Your <strong style={{ color: T1 }}>{seriesName} Mock</strong> attempt has been recorded.</div>
          </div>
          <div style={{ padding: '0 24px 20px' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[{ l: 'Attempted', v: attemptedTotal, c: G }, { l: 'Marked', v: counts.marked + counts.answeredmarked, c: A }, { l: 'Unattempted', v: total - attemptedTotal, c: RED }].map(s => (
                <div key={s.l} style={{ flex: 1, background: BG2, borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div><div style={{ fontSize: 10.5, color: T3, marginTop: 3 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', background: BG2, padding: '9px 12px', fontSize: 11, fontWeight: 600, color: T2 }}>
                <span>Section</span><span style={{ textAlign: 'center' }}>Attempted</span><span style={{ textAlign: 'center' }}>Marked</span><span style={{ textAlign: 'center' }}>Left</span>
              </div>
              {SECTIONS.map(s => {
                const at = s.ids.filter(id => answers[id] !== null).length, mk = s.ids.filter(id => marked[id]).length
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
              <button onClick={() => setPhase('analysis')} style={{ ...pillBtn({ flex: 1, padding: '13px', background: P, color: '#fff' }) }}>View Analysis</button>
            </div>
          </div>
        </div>
      </div>
    )
  }


  const lowTime = timeLeft <= 300
  const answeredPct = Math.round((attemptedTotal / total) * 100)
  const secAttempted = section.ids.filter(id => answers[id] !== null).length
  const secMarked = section.ids.filter(id => marked[id]).length
  // ── Exam ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: BG2, display: 'flex', flexDirection: 'column', fontFamily: "'Poppins', sans-serif", color: T1 }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', gap: 14, padding: '11px 22px', position: 'relative' }}>
        <img src={nprepLogo} alt="NPrep" style={{ height: 34, width: 'auto', display: 'block' }} />
        <div style={{ width: 1, height: 26, background: BD }} />
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T1 }}>{seriesName} — Full Mock</div>
        <div style={{ flex: 1 }} />
        {/* Language toggle — bilingual is the core need for Hindi-medium tier-2/3 aspirants */}
        <div style={{ display: 'inline-flex', background: BG2, borderRadius: 20, padding: 3 }}>
          {[['en', 'EN'], ['hi', 'हिं']].map(([id, l]) => {
            const on = lang === id
            return <button key={id} onClick={() => setLang(id)} style={{ padding: '5px 13px', borderRadius: 15, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: on ? 700 : 500, background: on ? P : 'transparent', color: on ? '#fff' : T2 }}>{l}</button>
          })}
        </div>
        {/* Per-section summary */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowSummary(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, background: BG2, color: T1, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></svg>
            {L('Summary', 'सारांश')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showSummary ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {showSummary && (
            <div style={{ position: 'absolute', top: 42, right: 0, width: 250, background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.14)', padding: '12px 14px', zIndex: 30 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T1, marginBottom: 10 }}>{L('Attempted per section', 'हर सेक्शन में हल किए')}</div>
              {SECTIONS.map((s, i) => {
                const at = answeredIn(s), pct = Math.round((at / s.ids.length) * 100)
                const state = i < curSec ? 'done' : i === curSec ? 'active' : 'upcoming'
                return (
                  <div key={s.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                      <span style={{ color: state === 'active' ? P : T2, fontWeight: state === 'active' ? 600 : 500 }}>{L('Section', 'सेक्शन')} {s.id}{state === 'done' ? ' ✓' : state === 'upcoming' ? L(' · locked', ' · बंद') : ''}</span>
                      <span style={{ color: T3 }}>{at}/{s.ids.length}</span>
                    </div>
                    <div style={{ height: 5, background: BG2, borderRadius: 3 }}><div style={{ height: '100%', width: `${pct}%`, background: state === 'upcoming' ? BD : G, borderRadius: 3 }} /></div>
                  </div>
                )
              })}
              <div style={{ borderTop: `1px solid ${BD}`, marginTop: 4, paddingTop: 8, fontSize: 11.5, color: T2, display: 'flex', justifyContent: 'space-between' }}>
                <span>{L('Total answered', 'कुल हल किए')}</span><span style={{ fontWeight: 700, color: T1 }}>{attemptedTotal}/{total}</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: timerOn ? (lowTime ? RED : PD) : T3, fontSize: 15, fontWeight: 700 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {timerOn
            ? <span style={{ minWidth: 72, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>{fmt(timeLeft)}</span>
            : <span style={{ minWidth: 72, textAlign: 'right', fontSize: 12.5, fontWeight: 600 }}>{L('Hidden', 'छिपा हुआ')}</span>}
          <button onClick={() => setTimerOn(t => !t)} title={timerOn ? L('Hide timer', 'टाइमर छिपाएँ') : L('Show timer', 'टाइमर दिखाएँ')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 2 }}>
            {timerOn
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>}
          </button>
        </div>
      </div>
      <div style={{ flexShrink: 0, height: 3, background: BG2 }}><div style={{ height: '100%', width: `${answeredPct}%`, background: P, transition: 'width 0.3s' }} /></div>

      {/* Section bar — 5 equal soft-edged boxes filling the width (sequential status; non-clickable) */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BD}`, display: 'flex', gap: 8, padding: '12px 22px' }}>
        {SECTIONS.map((s, i) => {
          const active = i === curSec, done = i < curSec
          return (
            <div key={s.id} title={active ? 'Current section' : done ? 'Completed' : 'Opens after you submit the current section'} style={{
              flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 12px', borderRadius: 10, cursor: 'default',
              background: active ? P : done ? GL : BG2, color: active ? '#fff' : done ? G : T3, border: `1px solid ${active ? P : 'transparent'}`, fontSize: 12.5, fontWeight: 600,
            }}>
              {done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              {L('Section', 'सेक्शन')} {s.id}
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Question pane */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', background: '#fff', padding: '28px 44px' }}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 15 }}>
                <span style={{ width: 3, height: 15, borderRadius: 2, background: P }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: 'uppercase', color: P }}>{L('Question', 'प्रश्न')} {globalNum}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => setShowReport(true)} title={L('Report a problem with this question', 'इस प्रश्न में समस्या बताएँ')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T3, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                  {L('Report', 'रिपोर्ट')}
                </button>
              </div>
              <p style={{ fontSize: 18.5, fontWeight: 600, lineHeight: 1.5, color: PD, marginBottom: 22 }}>{lang === 'hi' && q.hi?.text ? q.hi.text : q.text}</p>
              {q.image && <img src={q.image} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ maxWidth: q.imageLarge ? '100%' : 340, maxHeight: q.imageLarge ? 360 : 220, border: `1px solid ${BD}`, borderRadius: 6, marginBottom: 20, display: 'block' }} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, i) => {
                  const on = chosen === i, struck = elimOf(i)
                  const label = lang === 'hi' && q.hi?.options ? q.hi.options[i] : opt
                  return (
                    <div key={i} onClick={() => select(i)} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                      background: on ? PL : (struck ? '#FAFBFC' : '#fff'), border: `1px solid ${on ? P : '#E4E8F1'}`, boxShadow: on ? `inset 3px 0 0 ${P}` : 'none',
                      transition: 'background .12s, border-color .12s', opacity: struck && !on ? 0.6 : 1,
                    }}>
                      <span style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: on ? P : '#F1F3F9', color: on ? '#fff' : T2 }}>{LETTERS[i]}</span>
                      <span style={{ flex: 1, fontSize: 15.5, fontWeight: on ? 600 : 500, color: on ? PD : '#2A3244', textDecoration: struck ? 'line-through' : 'none', textDecorationColor: '#C0392B' }}>{label}</span>
                      <button onClick={(e) => { e.stopPropagation(); toggleElim(i) }} title={struck ? L('Bring back', 'वापस लाएँ') : L('Cross out', 'काटें')} style={{ background: struck ? '#FDE7E4' : 'none', borderRadius: 6, border: 'none', cursor: 'pointer', color: struck ? '#C0392B' : '#B7BECC', display: 'flex', padding: 5, flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 15, fontSize: 12, color: T3, lineHeight: 1.6 }}>
                {L('Tip: cross out (–) the options you\'ve ruled out to focus on the rest.', 'सुझाव: जिन विकल्पों को हटाना हो उन्हें (–) से काटें ताकि बाकी विकल्पों पर ध्यान दे सकें।')}
              </div>
            </div>
          </div>
          {/* Footer actions */}
          <div style={{ flexShrink: 0, background: '#fff', borderTop: `1px solid ${BD}`, display: 'flex', justifyContent: 'space-between', padding: '12px 22px', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={markNext} style={btn()}>{L('Mark for Review', 'समीक्षा हेतु चिह्नित')}</button>
              <button onClick={clear} style={btn()}>{L('Clear Response', 'उत्तर हटाएँ')}</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={goPrev} disabled={curQLocal === 0} style={btn({ opacity: curQLocal === 0 ? 0.5 : 1 })}>« {L('Previous', 'पिछला')}</button>
              <button onClick={goNext} disabled={curQLocal === section.ids.length - 1} style={{ ...pillBtn({ padding: '10px 24px', background: P, color: '#fff', opacity: curQLocal === section.ids.length - 1 ? 0.5 : 1 }) }}>{L('Save & Next', 'सेव और आगे')} »</button>
            </div>
          </div>
        </div>

        {/* Palette collapse toggle */}
        <button onClick={() => setPaletteOpen(o => !o)} title={paletteOpen ? L('Hide palette', 'सूची छिपाएँ') : L('Show palette', 'सूची दिखाएँ')} style={{ width: 22, flexShrink: 0, border: 'none', borderLeft: `1px solid ${BD}`, background: '#F5F8FF', cursor: 'pointer', color: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: paletteOpen ? 'none' : 'rotate(180deg)' }}><polyline points="9 6 15 12 9 18" /></svg>
        </button>

        {/* Palette */}
        {paletteOpen && (
        <aside style={{ width: 292, flexShrink: 0, background: '#fff', borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 18px 15px', borderBottom: `1px solid ${BD}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T1, marginBottom: 13 }}>{L('Question Palette', 'प्रश्न सूची')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px 14px' }}>
              {[['answered', L('Answered', 'हल किए'), counts.answered, G, GL], ['notanswered', L('Not Answered', 'नहीं किए'), counts.notanswered, RED, '#FDECED'], ['marked', L('Marked', 'चिह्नित'), counts.marked, A, '#FBF4DE'], ['notvisited', L('Not Visited', 'नहीं देखे'), counts.notvisited, '#C7CEDD', BG2]].map(([st, lbl, n, col, soft]) => (
                <span key={st} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: T2 }}>
                  <span style={{ minWidth: 24, textAlign: 'center', background: soft, color: st === 'notvisited' ? T2 : col, fontSize: 11, fontWeight: 700, borderRadius: 7, padding: '2px 6px', border: st === 'notvisited' ? `1px solid ${BD}` : 'none' }}>{n}</span>
                  {lbl}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '15px 18px 6px', flexShrink: 0 }}>
            <span style={{ width: 3, height: 14, borderRadius: 2, background: P }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: PD, textTransform: 'uppercase' }}>{L('Section', 'सेक्शन')} {section.id}</span>
          </div>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 11, justifyItems: 'center' }}>
              {section.ids.map((id, i) => <PaletteCell key={id} status={statusOf(id)} num={SECTIONS.slice(0, curSec).reduce((n, s) => n + s.ids.length, 0) + i + 1} active={i === curQLocal} onClick={() => jumpTo(i)} />)}
            </div>
          </div>
          <div style={{ padding: 14, borderTop: `1px solid ${BD}` }}>
            <button onClick={() => setShowSubmit(true)} style={{ ...pillBtn({ width: '100%', padding: '13px', background: isLastSec ? G : P, color: '#fff' }) }}>{isLastSec ? L('Submit Test', 'टेस्ट सबमिट करें') : L('Submit Section', 'सेक्शन सबमिट करें')}</button>
          </div>
        </aside>
        )}
      </div>

      {/* Report-question sheet */}
      {showReport && (
        <div onClick={() => setShowReport(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(19,27,99,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 4px', fontSize: 16, fontWeight: 700, color: T1 }}>{L('Report a problem', 'समस्या बताएँ')}</div>
            <div style={{ padding: '0 22px 14px', fontSize: 12.5, color: T2, lineHeight: 1.55 }}>{L('What’s wrong with this question? Your feedback helps us fix it.', 'इस प्रश्न में क्या गलत है? आपकी प्रतिक्रिया से हम इसे ठीक करेंगे।')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 22px 18px' }}>
              {[['wrong', L('Wrong answer', 'उत्तर गलत है')], ['unclear', L('Question is unclear', 'प्रश्न स्पष्ट नहीं है')], ['typo', L('Typo / spelling', 'वर्तनी / टाइपो')], ['image', L('Image / option issue', 'चित्र / विकल्प में समस्या')]].map(([id, l]) => (
                <button key={id} onClick={() => submitReport(id)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: `1px solid ${BD}`, background: '#fff', color: T1, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 22px 18px' }}>
              <button onClick={() => setShowReport(false)} style={{ ...btn({ padding: '9px 16px' }) }}>{L('Cancel', 'रद्द करें')}</button>
            </div>
          </div>
        </div>
      )}
      {reportToast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 120, background: PD, color: '#fff', padding: '12px 20px', borderRadius: 24, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>{reportToast}</div>
      )}

      {/* Submit-section confirm */}
      {showSubmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,27,99,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px 6px', fontSize: 17, fontWeight: 700, color: T1 }}>{isLastSec ? 'Submit the test?' : `Submit Section ${section.id}?`}</div>
            <div style={{ padding: '0 24px 16px', fontSize: 13, color: T2, lineHeight: 1.6 }}>
              {isLastSec ? 'This is the last section — submitting will end the test and you cannot change any answers.' : `You've answered ${secAttempted} of ${section.ids.length} in this section. You won't be able to return to Section ${section.id} after this.`}
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '0 24px 14px' }}>
              {[['Answered', secAttempted, G], ['Marked', secMarked, A], ['Left', section.ids.length - secAttempted, RED]].map(([l, v, c]) => (
                <div key={l} style={{ flex: 1, background: BG2, borderRadius: 12, padding: '12px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 10, color: T3, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '8px 24px 20px' }}>
              <button onClick={() => setShowSubmit(false)} style={{ ...btn({ padding: '11px 18px' }) }}>Keep attempting</button>
              <button onClick={submitSection} style={{ ...pillBtn({ padding: '11px 22px', background: isLastSec ? G : P, color: '#fff' }) }}>{isLastSec ? 'Submit Test' : `Submit Section ${section.id}`}</button>
            </div>
          </div>
        </div>
      )}

      {/* Exit confirm */}
      {showExit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,27,99,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, padding: '24px' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T1, marginBottom: 8 }}>Leave the test?</div>
            <div style={{ fontSize: 13, color: T2, lineHeight: 1.65, marginBottom: 20 }}>
              This test won't pause — the timer keeps running in the background. If you leave now your test will be <strong style={{ color: T1 }}>submitted automatically</strong>, and any unanswered questions will be left unattempted.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowExit(false)} style={{ ...btn({ padding: '11px 18px' }) }}>Stay in test</button>
              <button onClick={() => { setShowExit(false); finalize() }} style={{ ...pillBtn({ padding: '11px 20px', background: RED, color: '#fff' }) }}>Leave &amp; submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
