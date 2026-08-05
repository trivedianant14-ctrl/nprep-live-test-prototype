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
const SESSION_KEY = 'nprep_mock_session_v1' // silent auto-save key (stands in for the backend)
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
// the test. The attempt auto-saves silently (localStorage, standing in for the backend) and
// the timer is deadline-based, so it keeps running even if the tab is closed: on return, the
// student resumes if time is left, or the test is auto-submitted if the clock ran out.
export default function DesktopExamNPrepMock({ onExit, onFinish, customQuestions, customSections, customMeta }) {
  const META = customMeta || DEFAULT_EXAM_META
  const seriesName = META.series || META.shortName || 'NASHTA'

  // Silent auto-save / resume. A saved seed reproduces the identical shuffle so restored answers stay aligned.
  const [saved] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(SESSION_KEY)); return s && typeof s.seed === 'number' ? s : null } catch { return null }
  })
  const [seed] = useState(() => saved?.seed ?? ((Math.random() * 2 ** 31) >>> 0))
  const [{ questions: QUESTIONS, sections: SECTIONS }] = useState(() =>
    shuffleForAttempt(customQuestions || DEFAULT_QUESTIONS, customSections || DEFAULT_SECTIONS, seed)
  )
  const secDur = META.sectionSeconds || SECTION_DURATION
  const TOTAL = SECTIONS.length * secDur
  const totalMin = Math.round(TOTAL / 60)

  const resumable = !!saved && saved.deadline > Date.now()   // in-progress, time still left
  const expired = !!saved && saved.deadline <= Date.now()    // clock ran out while away → auto-submit

  const [phase, setPhase] = useState(resumable ? 'exam' : expired ? 'submitted' : 'instructions')
  const [agreed, setAgreed] = useState(!!saved)
  const [curSec, setCurSec] = useState(saved?.curSec ?? 0)
  const [curQLocal, setCurQLocal] = useState(saved?.curQLocal ?? 0)
  const [answers, setAnswers] = useState(() => saved?.answers ?? Array(QUESTIONS.length).fill(null))
  const [marked, setMarked] = useState(() => saved?.marked ?? Array(QUESTIONS.length).fill(false))
  const [guessed, setGuessed] = useState(() => saved?.guessed ?? Array(QUESTIONS.length).fill(false)) // "not sure" tagging
  const [visited, setVisited] = useState(() => saved?.visited ?? Array(QUESTIONS.length).fill(false))
  const [eliminated, setEliminated] = useState(() => saved?.eliminated ?? {}) // { [gIdx]: number[] } struck-out options
  const [deadline, setDeadline] = useState(saved?.deadline ?? null)           // absolute epoch ms; set on start
  const [timeLeft, setTimeLeft] = useState(() => saved ? Math.max(0, Math.round((saved.deadline - Date.now()) / 1000)) : TOTAL)
  const [showSubmit, setShowSubmit] = useState(false)   // item-review + submit confirm
  const [showExit, setShowExit] = useState(false)
  const [showSummary, setShowSummary] = useState(false) // per-section summary popover
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [results, setResults] = useState(null)
  const lang = 'en'                                     // English only (bilingual toggle removed)
  const [showReport, setShowReport] = useState(false)   // report-question sheet
  const [reportToast, setReportToast] = useState('')
  const [fsExited, setFsExited] = useState(false)       // left fullscreen during the exam

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

  // Per-question time capture (ms per global index) for the solutions time-analysis.
  const perQTimeRef = useRef(Array(QUESTIONS.length).fill(0))
  const qTimerRef = useRef({ gIdx: null, start: Date.now() })
  const bankTime = () => { const p = qTimerRef.current; if (p.gIdx != null) perQTimeRef.current[p.gIdx] += Date.now() - p.start }

  const finalize = () => {
    bankTime()
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
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ } // attempt finished — clear the saved session
    setResults(r); setShowSubmit(false); setPhase('submitted'); onFinish?.(r)
  }
  const finalizeRef = useRef(finalize); finalizeRef.current = finalize

  // Deadline-based countdown: derives the remaining time from an absolute end-time, so the
  // clock keeps running while the tab is closed and expiry auto-submits on return.
  useEffect(() => {
    if (phase !== 'exam' || !deadline) return
    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setTimeLeft(left)
      if (left <= 0) finalizeRef.current()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [phase, deadline])
  // If we mounted onto an already-expired saved session, submit it right away.
  useEffect(() => { if (expired && !results) finalizeRef.current() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Silent auto-save of the in-progress attempt (stands in for the backend).
  useEffect(() => {
    if (phase !== 'exam' || !deadline) return
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ seed, deadline, answers, marked, guessed, visited, eliminated, curSec, curQLocal })) } catch { /* ignore quota */ }
  }, [phase, deadline, seed, answers, marked, guessed, visited, eliminated, curSec, curQLocal])
  useEffect(() => { if (phase === 'exam') setVisited(prev => { if (prev[gIdx]) return prev; const n = [...prev]; n[gIdx] = true; return n }) }, [gIdx, phase])
  // Bank time on the previous question whenever the active question changes.
  useEffect(() => {
    if (phase !== 'exam') return
    const p = qTimerRef.current
    if (p.gIdx != null && p.gIdx !== gIdx) perQTimeRef.current[p.gIdx] += Date.now() - p.start
    qTimerRef.current = { gIdx, start: Date.now() }
  }, [gIdx, phase])
  // Fullscreen enforcement: note when the student leaves fullscreen during the exam.
  useEffect(() => {
    const onFs = () => { if (phase === 'exam' && !document.fullscreenElement) setFsExited(true); else setFsExited(false) }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [phase])

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
  const toggleGuess = () => setGuessed(prev => { const n = [...prev]; n[gIdx] = !n[gIdx]; return n })
  const goFullscreen = () => { try { document.documentElement.requestFullscreen?.() } catch { /* not supported */ } }
  const startExam = () => { if (!agreed) return; setDeadline(Date.now() + TOTAL * 1000); goFullscreen(); setPhase('exam') }
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
                <button onClick={startExam} disabled={!agreed} style={{ ...pillBtn({ width: '100%', padding: '14px', fontSize: 15, background: agreed ? P : '#B9C4E0', color: '#fff' }), cursor: agreed ? 'pointer' : 'not-allowed' }}>I'm ready — Start Test →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Analysis (Career-Launcher-style tabbed review) ─────────────────────────
  if (phase === 'analysis') {
    return <AnalysisView questions={QUESTIONS} sections={SECTIONS} answers={answers} marked={marked} meta={META} results={results} perQTime={perQTimeRef.current} interface="nprep" onBack={onExit} />
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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: lowTime ? RED : PD, fontSize: 15, fontWeight: 700 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <span style={{ minWidth: 72, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>{fmt(timeLeft)}</span>
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
              {q.passage && (
                <div style={{ marginBottom: 18, border: `1px solid ${BD}`, borderLeft: `3px solid ${A}`, background: '#FFFBF2', borderRadius: 8, padding: '14px 18px' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: A, marginBottom: 6 }}>{L('Case scenario', 'केस परिदृश्य')}{q.caseTotal ? ` · ${L('Q', 'प्र')}${q.caseIndex}/${q.caseTotal}` : ''}</div>
                  <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#3A4152' }}>{lang === 'hi' && q.hi?.passage ? q.hi.passage : q.passage}</p>
                </div>
              )}
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
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {chosen !== null && (
                  <button onClick={toggleGuess} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: guessed[gIdx] ? '#FFF4E0' : '#fff', border: `1px solid ${guessed[gIdx] ? A : BD}`, color: guessed[gIdx] ? '#9A6B12' : T2, borderRadius: 20, padding: '6px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    {guessed[gIdx] ? L('Marked as a guess', 'अनुमान चिह्नित') : L('Mark this answer as a guess', 'इस उत्तर को अनुमान चिह्नित करें')}
                  </button>
                )}
                <span style={{ fontSize: 12, color: T3, lineHeight: 1.6 }}>
                  {L('Tip: cross out (–) the options you\'ve ruled out to focus on the rest.', 'सुझाव: जिन विकल्पों को हटाना हो उन्हें (–) से काटें ताकि बाकी विकल्पों पर ध्यान दे सकें।')}
                </span>
              </div>
            </div>
          </div>
          {/* Footer actions */}
          <div style={{ flexShrink: 0, background: '#fff', borderTop: `1px solid ${BD}`, display: 'flex', justifyContent: 'space-between', padding: '12px 22px', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={markNext} style={btn()}>{L('Mark for Review', 'समीक्षा हेतु चिह्नित')}</button>
              <button onClick={clear} disabled={chosen === null} style={btn({ opacity: chosen === null ? 0.45 : 1, cursor: chosen === null ? 'default' : 'pointer', color: chosen === null ? T3 : T1 })}>{L('Clear Response', 'उत्तर हटाएँ')}</button>
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
      {phase === 'exam' && fsExited && (
        <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 130, background: '#FFF4E0', border: `1px solid ${A}`, color: '#8a5a10', padding: '9px 10px 9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }}>
          <span>{L('You left full screen — return for the best exam experience.', 'आप फ़ुल स्क्रीन से बाहर आ गए — बेहतर अनुभव के लिए वापस जाएँ।')}</span>
          <button onClick={goFullscreen} style={{ ...pillBtn({ padding: '6px 14px', background: A, color: '#fff', fontSize: 12 }) }}>{L('Return to full screen', 'फ़ुल स्क्रीन में लौटें')}</button>
        </div>
      )}

      {/* Item Review + submit confirm */}
      {showSubmit && (() => {
        const base = SECTIONS.slice(0, curSec).reduce((n, s) => n + s.ids.length, 0)
        const locals = section.ids.map((_, i) => i)
        const notAns = locals.filter(i => answers[section.ids[i]] === null)
        const mk = locals.filter(i => marked[section.ids[i]])
        const gs = locals.filter(i => guessed[section.ids[i]])
        const chip = (i, color) => <button key={i} onClick={() => { setCurQLocal(i); setShowSubmit(false) }} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${color}`, background: '#fff', color, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{base + i + 1}</button>
        const group = (label, items, color) => items.length > 0 && (
          <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: T2, marginBottom: 9 }}>{label} · {items.length}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{items.map(i => chip(i, color))}</div>
          </div>
        )
        const allClear = notAns.length === 0 && mk.length === 0 && gs.length === 0
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,27,99,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '86vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '22px 24px 6px', fontSize: 17, fontWeight: 700, color: T1 }}>{isLastSec ? L('Review before final submit', 'अंतिम सबमिट से पहले समीक्षा') : `${L('Review Section', 'सेक्शन समीक्षा')} ${section.id}`}</div>
              <div style={{ padding: '0 24px 16px', fontSize: 13, color: T2, lineHeight: 1.6 }}>
                {isLastSec ? L('This is the last section — submitting ends the test and answers cannot be changed.', 'यह अंतिम सेक्शन है — सबमिट करने पर टेस्ट समाप्त हो जाएगा और उत्तर बदले नहीं जा सकेंगे।') : L(`You won’t be able to return to Section ${section.id} after this.`, `इसके बाद आप सेक्शन ${section.id} में वापस नहीं आ सकेंगे।`)}
              </div>
              <div style={{ display: 'flex', gap: 10, padding: '0 24px 16px' }}>
                {[[L('Answered', 'हल किए'), secAttempted, G], [L('Marked', 'चिह्नित'), secMarked, A], [L('Guessed', 'अनुमान'), gs.length, '#9A6B12'], [L('Left', 'बाकी'), notAns.length, RED]].map(([l, v, c]) => (
                  <div key={l} style={{ flex: 1, background: BG2, borderRadius: 12, padding: '12px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 10, color: T3, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div className="scroll" style={{ overflowY: 'auto', padding: '4px 24px 8px', borderTop: `1px solid ${BD}`, paddingTop: 16 }}>
                {allClear
                  ? <div style={{ fontSize: 13, color: G, fontWeight: 600, padding: '6px 0 14px' }}>✓ {L('Every question is answered, with nothing marked or guessed.', 'सभी प्रश्न हल हैं — कुछ भी चिह्नित या अनुमानित नहीं।')}</div>
                  : <>
                    <div style={{ fontSize: 12, color: T3, marginBottom: 14 }}>{L('Tap a number to jump back to that question.', 'किसी संख्या पर टैप करके उस प्रश्न पर वापस जाएँ।')}</div>
                    {group(L('Not answered', 'हल नहीं किए'), notAns, RED)}
                    {group(L('Marked for review', 'समीक्षा हेतु चिह्नित'), mk, A)}
                    {group(L('Guessed', 'अनुमान लगाए'), gs, '#9A6B12')}
                  </>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px 20px', borderTop: `1px solid ${BD}` }}>
                <button onClick={() => setShowSubmit(false)} style={{ ...btn({ padding: '11px 18px' }) }}>{L('Keep attempting', 'हल करते रहें')}</button>
                <button onClick={submitSection} style={{ ...pillBtn({ padding: '11px 22px', background: isLastSec ? G : P, color: '#fff' }) }}>{isLastSec ? L('Submit Test', 'टेस्ट सबमिट करें') : `${L('Submit Section', 'सेक्शन सबमिट करें')} ${section.id}`}</button>
              </div>
            </div>
          </div>
        )
      })()}

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
