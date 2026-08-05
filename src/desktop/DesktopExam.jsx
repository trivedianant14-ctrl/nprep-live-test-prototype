import { useState, useEffect, useRef } from 'react'
import {
  QUESTIONS as DEFAULT_QUESTIONS,
  SECTIONS as DEFAULT_SECTIONS,
  SECTION_DURATION,
  EXAM_META as DEFAULT_EXAM_META,
} from '../exam/examData'
import { LIVE_TEST } from '../data'
import { shuffleForAttempt } from '../exam/shuffle'
import AnalysisView from './AnalysisView'

// ── AIIMS NORCET CBT portal palette (faithful to web-test-screen.vercel.app) ──
const NAVY = '#1a3a6b', NAVY_D = '#0f2347', NAVY_L = '#2a5298'
const CYAN = '#27b7cd', CYAN_D = '#17829a'
const GREEN = '#25a943', RED = '#e4474d', PURPLE = '#8c5bd3'
const RED_TXT = '#cc0000'

const estimatePercentile = (accuracy) => Math.min(99, Math.max(1, Math.round(100 * (1 - Math.exp(-accuracy / 32)))))
const fmtSec = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// Question-palette status glyphs — the exact NORCET convention (grey square / green
// house / red diamond / purple circle / purple circle + green tick), numbers upright.
function PaletteCell({ status, num, isCurrent, onClick }) {
  const base = {
    width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, position: 'relative',
    userSelect: 'none', outline: isCurrent ? '2.5px solid #ff8800' : 'none', outlineOffset: 1,
  }
  if (status === 'answered')
    return <div onClick={onClick} style={{ ...base, background: GREEN, color: '#fff', clipPath: 'polygon(0 30%,50% 0,100% 30%,100% 100%,0 100%)' }}>{num}</div>
  if (status === 'notanswered')
    return <div onClick={onClick} style={{ ...base, background: RED, color: '#fff', clipPath: 'polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)' }}>{num}</div>
  if (status === 'marked')
    return <div onClick={onClick} style={{ ...base, background: PURPLE, color: '#fff', borderRadius: '50%' }}>{num}</div>
  if (status === 'answeredmarked')
    return (
      <div onClick={onClick} style={{ ...base, background: PURPLE, color: '#fff', borderRadius: '50%' }}>
        {num}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, background: GREEN, borderRadius: '50%', border: '1.5px solid #fff' }} />
      </div>
    )
  return <div onClick={onClick} style={{ ...base, background: '#ddd', color: '#222', border: '1px solid #aaa' }}>{num}</div>
}

const legendItems = [
  { cls: 'notvisited',   label: 'Not Visited' },
  { cls: 'notanswered',  label: 'Not Answered' },
  { cls: 'answered',     label: 'Answered' },
  { cls: 'marked',       label: 'Marked for Review' },
  { cls: 'answeredmarked', label: 'Answered & Marked (will be evaluated)' },
]

const cbtBtn = (x = {}) => ({ padding: '9px 16px', fontSize: 13, fontWeight: 600, border: '1px solid #999', background: 'linear-gradient(#fafafa,#dcdcdc)', cursor: 'pointer', borderRadius: 3, color: '#1a1a1a', ...x })

export default function DesktopExam({ onExit, onBack, onFinish, durationMode = false, customQuestions, customSections, customMeta }) {
  const META = customMeta || DEFAULT_EXAM_META
  // NPrep-branded display (no AIIMS / roll number / test centre; series + friendly stage).
  const provider = META.provider || 'NPrep'
  const seriesName = META.series || META.shortName || 'NASHTA'
  const stageName = META.stage || 'Prelims'
  const examTitle = `${provider} · ${seriesName} — Nursing Officer Test (${stageName})`
  const resultDate = META.resultDate || new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const secDur = META.sectionSeconds || SECTION_DURATION      // per-section time (45 min for Mains)
  const secMin = Math.round(secDur / 60)
  const [{ questions: QUESTIONS, sections: SECTIONS }] = useState(() =>
    shuffleForAttempt(customQuestions || DEFAULT_QUESTIONS, customSections || DEFAULT_SECTIONS)
  )

  // The candidate-details landing is skipped — the flow opens on the instructions page.
  const [phase, setPhase] = useState('instructions') // instructions | exam | submitted | analysis
  const [instrStep, setInstrStep] = useState('general') // NTA-style 2-page flow: general | declaration
  const [agreed, setAgreed] = useState(false)
  const [defaultLang, setDefaultLang] = useState('English')
  const [curSec, setCurSec] = useState(0)
  const [curQLocal, setCurQLocal] = useState(0)
  const [sectionTimers, setSectionTimers] = useState(() => SECTIONS.map(() => META.sectionSeconds || SECTION_DURATION))
  const [sectionLocked, setSectionLocked] = useState(() => SECTIONS.map(() => false))
  const [answers, setAnswers] = useState(() => Array(QUESTIONS.length).fill(null))
  const [marked, setMarked] = useState(() => Array(QUESTIONS.length).fill(false))
  const [visited, setVisited] = useState(() => Array(QUESTIONS.length).fill(false))
  const [showSubmit, setShowSubmit] = useState(false)
  const [results, setResults] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [toast, setToast] = useState(null)
  const [violations, setViolations] = useState(0)      // tab-switch / leave-window count
  const [showViolation, setShowViolation] = useState(false)

  const section = SECTIONS[curSec]
  const curGlobalIdx = section.ids[curQLocal]
  const q = QUESTIONS[curGlobalIdx]
  const selected = answers[curGlobalIdx]
  const isLocked = sectionLocked[curSec]
  const isLastQInSec = curQLocal === section.ids.length - 1
  const isLastSec = curSec === SECTIONS.length - 1

  const getStatus = (gIdx) => {
    const ans = answers[gIdx] !== null, mrk = marked[gIdx]
    if (ans && mrk) return 'answeredmarked'
    if (ans) return 'answered'
    if (mrk) return 'marked'
    if (visited[gIdx]) return 'notanswered'
    return 'notvisited'
  }
  const counts = { answered: 0, notanswered: 0, marked: 0, answeredmarked: 0, notvisited: 0 }
  QUESTIONS.forEach((_, i) => { counts[getStatus(i)]++ })

  // Per-question time capture (ms per global index) for the solutions time-analysis.
  const perQTimeRef = useRef(Array(QUESTIONS.length).fill(0))
  const qTimerRef = useRef({ gIdx: null, start: Date.now() })

  const computeAndFinalize = () => {
    const p = qTimerRef.current; if (p.gIdx != null) perQTimeRef.current[p.gIdx] += Date.now() - p.start
    let correct = 0, wrong = 0, unattempted = 0
    const sectionStats = SECTIONS.map(sec => ({ name: `Section ${sec.id}`, correct: 0, wrong: 0, unattempted: 0 }))
    QUESTIONS.forEach((qi, gIdx) => {
      const si = SECTIONS.findIndex(s => s.ids.includes(gIdx))
      if (answers[gIdx] === null) { unattempted++; sectionStats[si].unattempted++ }
      else if (answers[gIdx] === qi.answer) { correct++; sectionStats[si].correct++ }
      else { wrong++; sectionStats[si].wrong++ }
    })
    const score = parseFloat((correct * META.correctMarks + wrong * META.wrongMarks).toFixed(2))
    const accuracy = Math.round((correct / QUESTIONS.length) * 100)
    const percentile = estimatePercentile(accuracy)
    const air = Math.max(1, Math.round(((100 - percentile) / 100) * LIVE_TEST.enrolled) + 1)
    const weakestSection = [...sectionStats].sort((a, b) => a.correct - b.correct)[0]
    const timeTaken = SECTIONS.length * secDur - sectionTimers.reduce((a, b) => a + b, 0)
    const r = { correct, wrong, unattempted, score, accuracy, timeTaken, sectionStats, percentile, air, weakestSection, testName: META.shortName }
    setResults(r); setShowSubmit(false); setPhase('submitted'); onFinish?.(r)
  }
  const finalizeRef = useRef(computeAndFinalize)
  finalizeRef.current = computeAndFinalize

  // Tick the active section's timer
  useEffect(() => {
    if (phase !== 'exam') return
    const id = setInterval(() => setSectionTimers(prev => {
      const next = [...prev]; if (next[curSec] > 0) next[curSec]--; return next
    }), 1000)
    return () => clearInterval(id)
  }, [curSec, phase])

  // Real NORCET rule: each section is a strict 18-minute window presented in sequence.
  // When the current section's timer expires it closes permanently and the exam
  // auto-advances to the next section (or submits after the last). No going back.
  useEffect(() => {
    if (phase !== 'exam') return
    if (sectionTimers[curSec] === 0 && !sectionLocked[curSec]) {
      setSectionLocked(prev => { const n = [...prev]; n[curSec] = true; return n })
      if (curSec < SECTIONS.length - 1) {
        const nextSec = curSec + 1
        setToast(`Time up for Section ${SECTIONS[curSec].id} — moving to Section ${SECTIONS[nextSec].id}`)
        setCurSec(nextSec); setCurQLocal(0)
      } else {
        finalizeRef.current()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionTimers, curSec, phase])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(id)
  }, [toast])

  // The real NORCET CBT runs full-screen. requestFullscreen needs a user gesture, so it
  // fires from the begin click (below), not here. These just clean up: drop out of
  // full-screen once the exam is over, and on unmount (e.g. Back to Tests).
  useEffect(() => {
    if (phase !== 'exam' && document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }, [phase])
  useEffect(() => () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}) }, [])
  const beginExam = () => {
    document.documentElement.requestFullscreen?.().catch(() => {})
    setPhase('exam')
  }

  // Proctoring: the real NORCET CBT flags navigating away. Warn on each tab-switch / minimise.
  useEffect(() => {
    if (phase !== 'exam') return
    const onHidden = () => { if (document.visibilityState === 'hidden') { setViolations(v => v + 1); setShowViolation(true) } }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [phase])

  useEffect(() => {
    setVisited(prev => { if (prev[curGlobalIdx]) return prev; const n = [...prev]; n[curGlobalIdx] = true; return n })
    const p = qTimerRef.current
    if (p.gIdx != null && p.gIdx !== curGlobalIdx) perQTimeRef.current[p.gIdx] += Date.now() - p.start
    qTimerRef.current = { gIdx: curGlobalIdx, start: Date.now() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curSec, curQLocal])

  // Advancing to the next section closes the current one for good (no going back —
  // the core NORCET rule). Reached either by finishing the section or the timer expiring.
  const advanceSection = () => {
    setSectionLocked(prev => { const n = [...prev]; n[curSec] = true; return n })
    setCurSec(s => Math.min(s + 1, SECTIONS.length - 1)); setCurQLocal(0)
  }
  const goNext = () => {
    if (!isLastQInSec) setCurQLocal(l => Math.min(l + 1, section.ids.length - 1))
    // Real exam (NORCET): no manual move to the next section — it advances only when the section timer ends.
  }
  // Previous is confined to the current section — a closed section can't be revisited.
  const goPrev = () => { if (curQLocal > 0) setCurQLocal(l => l - 1) }
  const selectOption = (i) => { if (!isLocked) setAnswers(prev => { const n = [...prev]; n[curGlobalIdx] = i; return n }) }
  const clearResponse = () => { if (!isLocked) setAnswers(prev => { const n = [...prev]; n[curGlobalIdx] = null; return n }) }
  const markNext = () => { if (!isLocked) setMarked(prev => { const n = [...prev]; n[curGlobalIdx] = !n[curGlobalIdx]; return n }); goNext() }
  const saveNext = () => { if (isLastQInSec && isLastSec) setShowSubmit(true); else goNext() }
  const jumpTo = (gIdx) => { const li = section.ids.indexOf(gIdx); if (li >= 0) setCurQLocal(li) } // within current section only

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 1 — General instructions (candidate-details landing is skipped)
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'instructions') {
    const totalMin = SECTIONS.length * secMin
    const isDecl = instrStep === 'declaration'
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#f3f8fb', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', color: '#1a1a1a' }}>
        <div style={{ background: NAVY, color: '#fff', padding: '12px 40px', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{examTitle}</div>
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 40px' }}>
            {!isDecl ? (
              <>
                <h2 style={{ fontSize: 20, color: NAVY, marginBottom: 16 }}>General Instructions:</h2>
                <p style={{ fontSize: 13.5, color: '#444', marginBottom: 14 }}>Please read the instructions carefully.</p>
                <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: '#333' }}>
                  <li style={{ marginBottom: 10 }}>The total duration of the examination is <strong>{totalMin} minutes</strong>, divided across {SECTIONS.length} sections of {secMin} minutes each.</li>
                  <li style={{ marginBottom: 10 }}>The clock has been set at the server. The countdown timer at the top of the screen will display the remaining time available for the <strong>current section</strong>. When the timer reaches zero, that section will end by itself — you are not required to end or submit it.</li>
                  <li style={{ marginBottom: 10 }}>The Question Palette on the right side of the screen shows the status of each question using one of the following symbols:</li>
                </ol>
                <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '14px 18px', margin: '12px 0 18px' }}>
                  {legendItems.map(it => (
                    <div key={it.cls} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', fontSize: 13.5, color: '#333' }}>
                      <PaletteCell status={it.cls} num="" isCurrent={false} onClick={() => {}} />
                      {it.label}
                    </div>
                  ))}
                </div>
                <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: '#333' }} start={4}>
                  <li style={{ marginBottom: 8 }}>The <strong>Marked for Review</strong> status simply acts as a reminder that you have set to look at the question again. If an answer is selected for a question that is Marked for Review, that answer <strong>will be considered</strong> in the final evaluation.</li>
                </ol>
                <h3 style={{ fontSize: 15, color: NAVY, margin: '18px 0 8px' }}>Answering a Question:</h3>
                <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: '#333' }} start={5}>
                  <li style={{ marginBottom: 8 }}>To select your answer, click on one of the four option bubbles (A–D).</li>
                  <li style={{ marginBottom: 8 }}>To deselect a chosen answer, click the selected bubble again or click <strong>Clear Response</strong>. To change it, click the bubble of another option.</li>
                  <li style={{ marginBottom: 8 }}>To save your answer, you <strong>MUST</strong> click <strong>Save &amp; Next</strong>. Merely selecting an option without clicking Save &amp; Next will not save it.</li>
                  <li style={{ marginBottom: 8 }}>To mark a question for review, click <strong>Mark for Review &amp; Next</strong>. A marked question that also has a selected answer is still evaluated.</li>
                  <li style={{ marginBottom: 8 }}>To go to a question, click its number in the Question Palette. Note that this does <strong>not</strong> save your answer to the current question — always use Save &amp; Next.</li>
                </ol>
                <h3 style={{ fontSize: 15, color: NAVY, margin: '18px 0 8px' }}>Navigating through Sections:</h3>
                <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: '#333' }} start={10}>
                  <li style={{ marginBottom: 8 }}>The sections are displayed on the top bar of the screen. Only the <strong>current</strong> section is active and highlighted.</li>
                  <li style={{ marginBottom: 8 }}>Sections are attempted in a fixed sequence. When the current section's {secMin}-minute timer ends it closes and the next section opens automatically. <strong>You cannot return to a completed section.</strong></li>
                  <li style={{ marginBottom: 8 }}>The section summary (answered / not answered counts) is shown above the Question Palette.</li>
                </ol>
                <h3 style={{ fontSize: 15, color: NAVY, margin: '18px 0 8px' }}>Submitting the Test:</h3>
                <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: '#333' }} start={13}>
                  <li style={{ marginBottom: 8 }}>There is no manual submit. Each section closes when its timer ends, and the test is submitted automatically once the final section's time expires.</li>
                  <li style={{ marginBottom: 8 }}>In case of any technical issue during the examination, contact the invigilator immediately.</li>
                </ol>
                <p style={{ color: RED_TXT, fontSize: 13.5, marginTop: 14 }}><strong>Important:</strong> This is an {provider} practice simulation of the {seriesName} test, built to mirror the actual NORCET exam-day interface so you can prepare under real conditions.</p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 20, color: NAVY, marginBottom: 16 }}>Other Important Instructions:</h2>
                <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: '#333' }}>
                  <li style={{ marginBottom: 8 }}>The examination must be attempted on your own. Impersonation is a serious offence.</li>
                  <li style={{ marginBottom: 8 }}>You must not possess, wear or carry any prohibited item — mobile phone, calculator, smart watch, electronic device, notes or study material — during the examination.</li>
                  <li style={{ marginBottom: 8 }}>Navigating away from the test window, switching tabs or exiting full screen is recorded and may be treated as a violation of exam conduct.</li>
                  <li style={{ marginBottom: 8 }}>Any candidate found using unfair means will be disqualified from the examination.</li>
                  <li style={{ marginBottom: 8 }}>All the computer hardware allotted to you should be in proper working condition. Report any issue before you begin.</li>
                </ol>
              </>
            )}
          </div>

          <aside style={{ width: 220, flexShrink: 0, background: '#fff', borderLeft: '1px solid #ddd', padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: 6, margin: '0 auto 14px', background: `radial-gradient(circle at 50% 35%, #1b3a6b 0 14%, transparent 15%), linear-gradient(135deg,#5bb8d4 0%,#1b5f8f 44%,#f5efec 45%,#c07a50 100%)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 30 }}>{META.candidate?.[0] || 'A'}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{META.candidate}</div>
            <div style={{ fontSize: 12.5, color: '#666', marginTop: 2 }}>Nursing Officer · {stageName}</div>
          </aside>
        </div>

        <div style={{ flexShrink: 0, background: '#fff', borderTop: '2px solid #ccc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 40px', fontSize: 12, color: '#555', borderBottom: '1px solid #eee', flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ fontSize: 12.5 }}>{examTitle}</strong>
            <span style={{ display: 'flex', gap: 16 }}>
              <span>Total Questions: <strong>{QUESTIONS.length}</strong></span>
              <span>Duration: <strong>{totalMin} Min</strong></span>
              <span>Max Marks: <strong>{META.totalMarks}</strong></span>
              <span style={{ color: '#1a8c36' }}>+ve: <strong>{META.correctMarks}</strong></span>
              <span style={{ color: RED_TXT }}>–ve: <strong>{Math.abs(META.wrongMarks)}</strong></span>
            </span>
          </div>
          {isDecl && (
            <div style={{ padding: '12px 40px 6px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <label style={{ fontSize: 13, color: '#333' }}>Choose your default language:</label>
                <select value={defaultLang} onChange={e => setDefaultLang(e.target.value)} style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, padding: '4px 10px', border: '1px solid #b8cde4', borderRadius: 3, background: '#fff', color: NAVY }}>
                  <option>English</option>
                </select>
                <span style={{ fontSize: 12, color: '#888' }}>All questions will appear in your default language.</span>
              </div>
              <div style={{ background: '#f7f8fa', border: '1px solid #ddd', borderRadius: 4, padding: '10px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Declaration</div>
                <p style={{ fontSize: 12.5, lineHeight: 1.65, color: '#333' }}>I have read and understood the instructions. All computer hardware allotted to me is in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like a mobile phone, Bluetooth device, etc., or any prohibited material into the examination hall. I agree that in case of not adhering to these instructions, I shall be liable to be debarred from this test and/or to disciplinary action, which may include a ban from future tests / examinations and/or civil / criminal proceedings against me.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 16, height: 16 }} />
                I have read all the instructions carefully and I agree to abide by the terms of the declaration above.
              </label>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: isDecl ? '10px 40px 16px' : '14px 40px 16px' }}>
            {!isDecl
              ? <button onClick={onBack || onExit} style={{ ...cbtBtn(), background: '#e0eaf4', color: NAVY, border: '1px solid #b8cde4' }}>← Back</button>
              : <button onClick={() => setInstrStep('general')} style={{ ...cbtBtn(), background: '#e0eaf4', color: NAVY, border: '1px solid #b8cde4' }}>← Previous</button>}
            {!isDecl
              ? <button onClick={() => setInstrStep('declaration')} style={{ padding: '11px 26px', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 4, cursor: 'pointer', color: '#fff', background: `linear-gradient(135deg,${CYAN} 0%,${CYAN_D} 100%)` }}>Next ▸</button>
              : <button disabled={!agreed} onClick={beginExam} style={{ padding: '11px 26px', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 4, cursor: agreed ? 'pointer' : 'not-allowed', color: '#fff', background: agreed ? `linear-gradient(135deg,${CYAN} 0%,${CYAN_D} 100%)` : '#d4d8dc' }}>I am ready to begin</button>}
          </div>
        </div>
      </div>
    )
  }

  // ── Analysis (Career-Launcher-style tabbed review, NORCET-styled) ──────────
  if (phase === 'analysis') {
    return <AnalysisView questions={QUESTIONS} sections={SECTIONS} answers={answers} marked={marked} meta={META} results={results} perQTime={perQTimeRef.current} interface="norcet" onBack={onExit} />
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 4 — Submitted / analysis
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'submitted') {
    {
      const attempted = answers.filter(a => a !== null).length
      const markedCount = marked.filter(Boolean).length
      // Duration-mode tests run over several days — the result is declared later, so the
      // candidate sees a recorded-response declaration (attempted/marked counts) and a
      // date to return for their result, not an immediate score.
      if (durationMode) {
        return (
          <div style={{ position: 'fixed', inset: 0, background: '#e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 8, maxWidth: 520, width: '100%', overflow: 'hidden', boxShadow: '0 6px 30px rgba(0,0,0,0.15)' }}>
              <div style={{ background: NAVY, color: '#fff', padding: '14px 24px', fontSize: 15, fontWeight: 700 }}>Response Submitted</div>
              <div style={{ padding: '28px 32px', textAlign: 'center' }}>
                <div style={{ width: 66, height: 66, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, margin: '0 auto 18px' }}>✓</div>
                <h2 style={{ fontSize: 20, color: '#1a1a1a', marginBottom: 8 }}>Your responses have been recorded</h2>
                <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 18 }}>
                  Thank you, <strong>{META.candidate}</strong>. Your attempt for the <strong>{seriesName} ({stageName})</strong> test has been submitted successfully.
                </p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                  {[{ l: 'Answered', v: attempted, c: GREEN }, { l: 'Marked for Review', v: markedCount, c: PURPLE }, { l: 'Not Answered', v: QUESTIONS.length - attempted, c: RED }].map(s => (
                    <div key={s.l} style={{ flex: 1, background: '#f5f7fa', borderRadius: 8, padding: '14px 8px' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 10.5, color: '#666', marginTop: 3 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#eef4fb', border: `1px solid #cddff0`, borderRadius: 8, padding: '14px 16px', textAlign: 'left', marginBottom: 18 }}>
                  <div style={{ fontSize: 13, color: '#1a3a6b', lineHeight: 1.6 }}>
                    This test is conducted over multiple days. Your <strong>result and detailed analysis</strong> will be declared on <strong>{resultDate}</strong>. Please return to NPrep on or after this date to view your result and rank.
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: '#888', lineHeight: 1.6, marginBottom: 20 }}>
                  I confirm that the responses submitted above are my own final attempt for this test.
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={onExit} style={{ padding: '12px 24px', border: 'none', borderRadius: 4, background: NAVY, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Back to Tests</button>
                  <button onClick={() => setPhase('analysis')} style={{ ...cbtBtn({ padding: '12px 20px', fontSize: 13 }) }}>Preview result (prototype)</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '44px 48px', textAlign: 'center', maxWidth: 480, boxShadow: '0 6px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 74, height: 74, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px' }}>✓</div>
            <h2 style={{ fontSize: 22, color: '#1a1a1a', marginBottom: 10 }}>Test Submitted Successfully</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>Your {seriesName} ({stageName}) responses have been recorded.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setPhase('analysis')} style={{ padding: '12px 22px', border: 'none', borderRadius: 4, background: NAVY, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>View Detailed Analysis</button>
              <button onClick={onExit} style={{ ...cbtBtn({ padding: '12px 22px', fontSize: 14 }) }}>Back to Tests</button>
            </div>
          </div>
        </div>
      )
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 3 — Exam
  // ─────────────────────────────────────────────────────────────────────────
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F']
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: 'Arial, sans-serif', color: '#1a1a1a' }}>
      {/* Title bar */}
      <div style={{ background: NAVY, color: '#fff', padding: '9px 18px', fontSize: 14, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span>{examTitle}</span>
      </div>

      {/* Candidate strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 18px', background: '#fafafa', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
        <div style={{ width: 52, height: 60, background: '#e6e6e6', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#888' }}>Photo</div>
        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>
          <div><strong>Candidate Name:</strong> {META.candidate}</div>
          <div><strong>Subject:</strong> Nursing Officer &nbsp;&nbsp; <strong>Test:</strong> {seriesName} ({stageName})</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 13, lineHeight: 1.6 }}>
          <div><strong>Section Time Remaining:</strong> <span style={{ color: RED_TXT, fontWeight: 700, fontSize: 15 }}>{fmtSec(sectionTimers[curSec])}</span></div>
          <div><strong>Exam Date:</strong> {META.examDate}</div>
        </div>
      </div>

      {/* Section tabs — non-clickable status indicators. Sections are attempted in strict
          sequence: current section is active with its live timer, completed sections show
          "Completed", and upcoming sections show "Not started". */}
      <div style={{ display: 'flex', height: 50, background: '#d0d0d0', borderBottom: '1px solid #b0b0b0', flexShrink: 0, overflowX: 'auto' }}>
        {SECTIONS.map((s, i) => {
          const active = i === curSec
          const past = i < curSec, future = i > curSec
          const bg = active ? '#fff' : past ? '#d6ecd6' : '#d0d0d0'
          const nameColor = past ? '#2a6e2a' : future ? '#8a8a8a' : '#111'
          return (
            <div key={s.id} title={active ? 'Current section — attempt all questions' : past ? 'Completed — this section cannot be revisited' : 'Opens after the current section ends'} style={{
              flex: 1, minWidth: 130, borderRight: '1px solid #b0b0b0', textAlign: 'left', padding: '4px 12px', cursor: 'default',
              background: bg, color: nameColor, fontWeight: active ? 700 : 500,
              boxShadow: active ? `inset 0 -3px 0 ${NAVY}` : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
            }}>
              <span style={{ fontSize: 12 }}>Section {s.id}</span>
              <span style={{ fontSize: 12, color: past ? '#2a6e2a' : future ? '#8a8a8a' : RED_TXT, fontWeight: 700 }}>
                {past ? 'Completed' : future ? 'Not started' : fmtSec(sectionTimers[i])}
              </span>
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Question pane */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #c0c0c0', overflow: 'hidden' }}>
          <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', borderBottom: '1px solid #e0e0e0', fontSize: 14, background: '#fafafa', flexShrink: 0 }}>
            <span>Question No. <strong>{curSec * 20 + curQLocal + 1}</strong></span>
            <span style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: '#555' }}>Question Type: <strong>Multiple Choice</strong></span>
              <span>Marks: <span style={{ color: '#1a8c36', fontWeight: 700 }}>+{META.correctMarks}</span> | <span style={{ color: RED_TXT, fontWeight: 700 }}>{META.wrongMarks}</span></span>
            </span>
          </div>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Section {section.id}</div>
            {q.passage && (
              <div style={{ marginBottom: 18, border: '1px solid #d3dae2', background: '#f7f8fa', borderRadius: 4, padding: '12px 16px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#444', marginBottom: 6 }}>Case Study{q.caseTotal ? ` (Question ${q.caseIndex} of ${q.caseTotal})` : ''}</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#333' }}>{q.passage}</p>
              </div>
            )}
            <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 22 }}>{q.text}</p>
            {q.image && (
              <img src={q.image} alt="" style={{ maxWidth: q.imageLarge ? '100%' : 340, maxHeight: q.imageLarge ? 380 : 240, border: '1px solid #ddd', borderRadius: 4, marginBottom: 20, display: 'block' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {q.options.map((opt, i) => (
                <label key={i} onClick={() => selectOption(i)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, minHeight: 50, padding: '8px 12px', cursor: isLocked ? 'default' : 'pointer',
                  borderRadius: 4, fontSize: 16, background: selected === i ? '#eaf4fb' : 'transparent',
                }}>
                  <input type="radio" checked={selected === i} readOnly style={{ width: 16, height: 16, accentColor: NAVY, cursor: 'pointer' }} />
                  <span style={{ fontWeight: 600, color: '#555', minWidth: 18 }}>{optionLetters[i]}.</span>
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {isLocked && <div style={{ marginTop: 16, color: RED_TXT, fontSize: 13, fontWeight: 600 }}>This section's time has ended — responses are locked.</div>}
          </div>
        </div>

        {/* Palette collapse strip */}
        <button onClick={() => setPaletteOpen(o => !o)} title="Toggle Question Palette" style={{ width: 16, flexShrink: 0, border: 'none', borderLeft: '1px solid #b8b8b8', background: '#d8d8d8', cursor: 'pointer', color: '#444', fontSize: 9 }}>
          {paletteOpen ? '▶' : '◀'}
        </button>

        {/* Palette */}
        {paletteOpen && (
          <aside style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#f0f0f0' }}>
            {/* Legend — the exact 5 NTA states, with shaped count chips */}
            <div style={{ padding: '11px 12px', background: '#fff', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#333' }}><b style={{ minWidth: 21, height: 21, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: GREEN, color: '#fff', clipPath: 'polygon(0 30%,50% 0,100% 30%,100% 100%,0 100%)' }}>{counts.answered}</b> Answered</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#333' }}><b style={{ minWidth: 21, height: 21, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: PURPLE, color: '#fff', borderRadius: '50%' }}>{counts.marked}</b> Marked</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#333' }}><b style={{ minWidth: 21, height: 21, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: '#fff', color: '#222', border: '1px solid #999', borderRadius: 2 }}>{counts.notvisited}</b> Not Visited</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#333' }}>
                  <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                    <b style={{ minWidth: 21, height: 21, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: PURPLE, color: '#fff', borderRadius: '50%' }}>{counts.answeredmarked}</b>
                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, background: GREEN, borderRadius: '50%', border: '1.5px solid #fff' }} />
                  </span> Marked and answered
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#333' }}><b style={{ minWidth: 21, height: 21, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: RED, color: '#fff', clipPath: 'polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)' }}>{counts.notanswered}</b> Not Answered</span>
              </div>
            </div>
            <div style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#333', background: '#e6ebf2', flexShrink: 0, letterSpacing: 0.4 }}>SECTION : {section.id}</div>
            <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, justifyItems: 'center' }}>
                {section.ids.map((gIdx, li) => (
                  <PaletteCell key={gIdx} status={getStatus(gIdx)} num={curSec * 20 + li + 1} isCurrent={li === curQLocal} onClick={() => jumpTo(gIdx)} />
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Section auto-advance toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 120, background: '#1a1a1a', color: '#fff', padding: '11px 20px', borderRadius: 6, fontSize: 13.5, fontWeight: 600, boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}>
          ⏱ {toast}
        </div>
      )}

      {/* Proctoring violation warning — flags navigating away from the test window */}
      {showViolation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 6, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 10px 44px rgba(0,0,0,0.35)' }}>
            <div style={{ background: RED, color: '#fff', padding: '12px 20px', fontSize: 15, fontWeight: 700 }}>⚠ Warning {violations}</div>
            <div style={{ padding: '18px 22px' }}>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#222', marginBottom: 10 }}>You navigated away from the test window. This activity has been <strong>recorded</strong>.</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#666', marginBottom: 18 }}>Do not switch tabs, minimise the window, or leave full screen during the exam. Repeated violations may lead to disqualification in the actual NORCET.</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowViolation(false); document.documentElement.requestFullscreen?.().catch(() => {}) }} style={{ padding: '10px 22px', border: 'none', borderRadius: 4, background: `linear-gradient(135deg,${CYAN} 0%,${CYAN_D} 100%)`, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Return to test</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <footer style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderTop: '1px solid #ccc', background: '#f7f7f7', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={markNext} style={cbtBtn()}>Mark for Review &amp; Next</button>
          <button onClick={clearResponse} style={cbtBtn()}>Clear Response</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={goPrev} style={cbtBtn()}>« Previous</button>
          <button onClick={saveNext} style={cbtBtn({ background: `linear-gradient(135deg,${CYAN} 0%,${CYAN_D} 100%)`, color: '#fff', border: `1px solid ${CYAN_D}` })}>Save &amp; Next</button>
        </div>
      </footer>

      {/* Submit summary modal */}
      {showSubmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 6, width: '100%', maxWidth: 620, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ background: NAVY, color: '#fff', padding: '12px 20px', fontSize: 15, fontWeight: 700 }}>Exam Summary — Confirm Submission</div>
            <div style={{ padding: '18px 22px' }}>
              <p style={{ fontSize: 14, marginBottom: 14 }}>You have chosen to <strong>End the Test</strong>. Are you sure you want to submit?</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f2f4f6' }}>
                    {['Section', 'Total', 'Answered', 'Not Ans.', 'Marked', 'Not Visited'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', border: '1px solid #ddd', textAlign: 'center', fontSize: 11.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTIONS.map(s => {
                    const ans = s.ids.filter(i => answers[i] !== null && !marked[i]).length
                    const am = s.ids.filter(i => answers[i] !== null && marked[i]).length
                    const na = s.ids.filter(i => answers[i] === null && visited[i] && !marked[i]).length
                    const mk = s.ids.filter(i => answers[i] === null && marked[i]).length
                    const nv = s.ids.filter(i => !visited[i] && answers[i] === null && !marked[i]).length
                    return (
                      <tr key={s.id}>
                        <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>Section {s.id}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #eee', textAlign: 'center' }}>{s.ids.length}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #eee', textAlign: 'center', color: GREEN, fontWeight: 700 }}>{ans + am}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #eee', textAlign: 'center', color: RED, fontWeight: 700 }}>{na}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #eee', textAlign: 'center', color: PURPLE, fontWeight: 700 }}>{mk}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #eee', textAlign: 'center', color: '#888' }}>{nv}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p style={{ color: RED_TXT, fontSize: 13, marginTop: 14 }}>Once submitted, you will not be able to modify your answers.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 22px', borderTop: '1px solid #eee' }}>
              <button onClick={() => setShowSubmit(false)} style={{ ...cbtBtn({ padding: '10px 18px' }) }}>No, Continue Test</button>
              <button onClick={computeAndFinalize} style={{ padding: '10px 20px', border: 'none', borderRadius: 3, background: GREEN, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Yes, Submit Test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
