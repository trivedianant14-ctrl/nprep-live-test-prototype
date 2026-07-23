import { useState, useEffect } from 'react'
import { QUESTIONS, SECTIONS, SECTION_DURATION, EXAM_META } from './examData'
import { P, PD, PL, T1, T2, T3, BD, BG2 } from '../data'

// NORCET govt.-portal theme (kept local to this screen, distinct from the app's own tokens)
const NAVY = '#1f3a68', NAVY_D = '#162d52'
const GRUN = '#2eaa3a', GRUN_L = '#d4f0d8'
const DIAM = '#d94a4a', DIAM_L = '#fbe2e2'
const PURP = '#8a4ed4'
const WRN_BG = '#fff3cd', WRN_BD = '#ffc107', WRN_C = '#856404'

// Diamond / house / circle question-status shapes — the exact NORCET palette convention
function QShape({ status, num, isCurrent, size = 34, onClick }) {
  const base = {
    width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: Math.floor(size * 0.33), fontWeight: 700, cursor: 'pointer', flexShrink: 0,
    position: 'relative', userSelect: 'none', boxSizing: 'border-box',
    outline: isCurrent ? '2.5px solid #ff8800' : 'none', outlineOffset: 1,
  }
  if (status === 'answered')
    return <div onClick={onClick} style={{ ...base, background: GRUN, color: 'white', clipPath: 'polygon(0 30%,50% 0,100% 30%,100% 100%,0 100%)' }}>{num}</div>
  if (status === 'notanswered')
    return <div onClick={onClick} style={{ ...base, background: DIAM, color: 'white', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }}>{num}</div>
  if (status === 'marked')
    return <div onClick={onClick} style={{ ...base, background: PURP, color: 'white', borderRadius: '50%' }}>{num}</div>
  if (status === 'answeredmarked')
    return (
      <div onClick={onClick} style={{ ...base, background: PURP, color: 'white', borderRadius: '50%' }}>
        {num}
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: Math.round(size * 0.28), height: Math.round(size * 0.28), background: GRUN, borderRadius: '50%', border: '1.5px solid white' }} />
      </div>
    )
  return <div onClick={onClick} style={{ ...base, background: '#ddd', color: '#555', border: '1px solid #bbb' }}>{num}</div>
}

const gBtn  = (x = {}) => ({ padding: '8px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #999', background: 'linear-gradient(#fafafa,#dcdcdc)', cursor: 'pointer', borderRadius: 2, color: T1, ...x })
const gDngr = (x = {}) => ({ ...gBtn(), background: 'linear-gradient(#e85050,#b03030)', color: 'white', border: '1px solid #903030', ...x })

const fmtSec = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`
}

export default function ExamScreen({ interfaceMode = 'nprep', onExit }) {
  const isNPrep = interfaceMode === 'nprep'
  const HDR = isNPrep ? P : NAVY
  const HDR_D = isNPrep ? PD : NAVY_D
  const hPrim = (x = {}) => ({ ...gBtn(), background: `linear-gradient(${HDR},${HDR_D})`, color: 'white', border: `1px solid ${HDR_D}`, ...x })

  const [curSec, setCurSec]                       = useState(0)
  const [curQLocal, setCurQLocal]                 = useState(0)
  const [sectionTimers, setSectionTimers]         = useState(() => SECTIONS.map(() => SECTION_DURATION))
  const [sectionLocked, setSectionLocked]         = useState(() => SECTIONS.map(() => false))
  const [answers, setAnswers]                     = useState(() => Array(QUESTIONS.length).fill(null))
  const [marked, setMarked]                       = useState(() => Array(QUESTIONS.length).fill(false))
  const [visited, setVisited]                     = useState(() => Array(QUESTIONS.length).fill(false))
  const [showGrid, setShowGrid]                   = useState(false)
  const [gridSec, setGridSec]                     = useState(0)
  const [showExitConfirm, setShowExitConfirm]     = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [imageZoom, setImageZoom]                 = useState(1)
  const [phase, setPhase]                         = useState('test') // test | submitted | loading | analysis
  const [finalResults, setFinalResults]           = useState(null)

  const section      = SECTIONS[curSec]
  const curGlobalIdx = section.ids[curQLocal]
  const q            = QUESTIONS[curGlobalIdx]
  const selected     = answers[curGlobalIdx]
  const isMarked     = marked[curGlobalIdx]
  const isLocked     = sectionLocked[curSec]
  const isLastQInSec = curQLocal === section.ids.length - 1
  const isLastSec    = curSec === SECTIONS.length - 1
  const isLastQ      = isLastQInSec && isLastSec

  const totalTimeLeft = sectionTimers.reduce((a, b) => a + b, 0)
  const timerStr = fmtSec(totalTimeLeft)

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

  const computeAndFinalize = () => {
    let correct = 0, wrong = 0, unattempted = 0
    const sectionStats = SECTIONS.map(sec => ({ name: sec.name, correct: 0, wrong: 0, unattempted: 0 }))
    QUESTIONS.forEach((qi, gIdx) => {
      const si = SECTIONS.findIndex(s => s.ids.includes(gIdx))
      if (answers[gIdx] === null)       { unattempted++; sectionStats[si].unattempted++ }
      else if (answers[gIdx] === qi.answer) { correct++;    sectionStats[si].correct++ }
      else                               { wrong++;      sectionStats[si].wrong++ }
    })
    const score = parseFloat((correct * EXAM_META.correctMarks + wrong * EXAM_META.wrongMarks).toFixed(2))
    setFinalResults({ correct, wrong, unattempted, score, timeTaken: SECTIONS.length * SECTION_DURATION - totalTimeLeft, sectionStats })
    setPhase('submitted')
  }

  // Tick current section's timer
  useEffect(() => {
    if (phase !== 'test') return
    const id = setInterval(() => setSectionTimers(prev => {
      const next = [...prev]
      if (next[curSec] > 0) next[curSec]--
      return next
    }), 1000)
    return () => clearInterval(id)
  }, [curSec, phase])

  // Lock a section when its timer hits 0; auto-submit once every section has expired
  useEffect(() => {
    if (phase !== 'test') return
    let changed = false
    const next = [...sectionLocked]
    sectionTimers.forEach((t, i) => { if (t === 0 && !next[i]) { next[i] = true; changed = true } })
    if (changed) setSectionLocked(next)
    if (sectionTimers.every(t => t === 0)) computeAndFinalize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionTimers])

  useEffect(() => {
    if (phase !== 'loading') return
    const id = setTimeout(() => setPhase('analysis'), 2200)
    return () => clearTimeout(id)
  }, [phase])

  useEffect(() => {
    setVisited(prev => { if (prev[curGlobalIdx]) return prev; const next = [...prev]; next[curGlobalIdx] = true; return next })
    setImageZoom(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curSec, curQLocal])

  const goNext = () => {
    if (!isLastQInSec) setCurQLocal(l => l + 1)
    else if (!isLastSec) { setCurSec(s => s + 1); setCurQLocal(0) }
  }
  const goPrev = () => {
    if (curQLocal > 0) setCurQLocal(l => l - 1)
    else if (curSec > 0) { const ps = curSec - 1; setCurSec(ps); setCurQLocal(SECTIONS[ps].ids.length - 1) }
  }
  const handleAnswer = (optIdx) => {
    if (isLocked) return
    setAnswers(prev => { const next = [...prev]; next[curGlobalIdx] = optIdx; return next })
  }
  const handleClear = () => {
    if (isLocked) return
    setAnswers(prev => { const next = [...prev]; next[curGlobalIdx] = null; return next })
  }
  const handleMarkNext = () => {
    if (!isLocked) setMarked(prev => { const next = [...prev]; next[curGlobalIdx] = !next[curGlobalIdx]; return next })
    goNext()
  }
  const handleSaveNext = () => { if (isLastQ) setShowSubmitConfirm(true); else goNext() }
  const handleSubmit = () => { setShowSubmitConfirm(false); computeAndFinalize() }

  // ── Submitted celebration screen ─────────────────────────────────────────
  if (phase === 'submitted') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 32px', textAlign:'center' }}>
        <div style={{ width:88, height:88, borderRadius:'50%', background:GRUN_L, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:28, boxShadow:`0 0 0 12px ${GRUN_L}66` }}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={GRUN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation:'checkPop 0.4s ease both' }}>
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:T1, marginBottom:12, lineHeight:1.3 }}>Test Submitted Successfully</div>
        <div style={{ fontSize:13, color:T2, lineHeight:1.75, maxWidth:290, marginBottom:32 }}>
          Your <span style={{ fontWeight:600, color:HDR }}>{EXAM_META.shortName}</span> responses have been recorded. Results will be declared after the examination window closes.
        </div>
        {finalResults && (
          <div style={{ display:'flex', gap:1, background:BD, borderRadius:12, overflow:'hidden', marginBottom:8, width:'100%', maxWidth:280 }}>
            {[
              { label:'Attempted', value: finalResults.correct + finalResults.wrong, color: HDR },
              { label:'Correct',   value: finalResults.correct,   color: GRUN },
              { label:'Wrong',     value: finalResults.wrong,     color: DIAM },
            ].map(s => (
              <div key={s.label} style={{ flex:1, background:'white', padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:T3, marginTop:2, fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ flexShrink:0, padding:'14px 20px 28px', borderTop:`1px solid ${BD}`, display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={() => setPhase('loading')} style={{ ...hPrim({ width:'100%', padding:'14px', fontSize:14, borderRadius:10 }) }}>View Detailed Analysis</button>
        <button onClick={onExit} style={{ ...gBtn({ width:'100%', padding:'12px', fontSize:13, borderRadius:10 }) }}>Back to Live Tests</button>
      </div>
    </div>
  )

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 32px' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', border:`5px solid ${PL}`, borderTop:`5px solid ${P}`, animation:'spin 0.85s linear infinite', marginBottom:32 }} />
        <div style={{ fontSize:20, fontWeight:800, color:T1, marginBottom:8, textAlign:'center' }}>Preparing your analysis</div>
        <div style={{ fontSize:13, color:T3, textAlign:'center', lineHeight:1.6 }}>Calculating score and section performance…</div>
      </div>
    </div>
  )

  // ── Analysis ─────────────────────────────────────────────────────────────
  if (phase === 'analysis' && finalResults) {
    const r = finalResults, total = QUESTIONS.length
    const accuracy = total > 0 ? Math.round((r.correct / total) * 100) : 0
    const fmtT = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60; return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sc}s` : `${sc}s` }
    const ac = accuracy >= 60 ? GRUN : accuracy >= 40 ? '#b8860b' : DIAM
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG2 }}>
        <div style={{ background:HDR, flexShrink:0, padding:'22px 16px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onExit} style={{ background:'none', border:'none', cursor:'pointer', color:'white', padding:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'white' }}>Test Results</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1 }}>{EXAM_META.shortName}</div>
          </div>
        </div>
        <div className="scroll" style={{ flex:1, padding:'16px 16px 80px' }}>
          <div style={{ background:'white', borderRadius:12, padding:'24px 20px', marginBottom:10, textAlign:'center', border:`1px solid ${BD}` }}>
            <div style={{ fontSize:10, fontWeight:600, color:T3, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:14 }}>Your Score</div>
            <div><span style={{ fontSize:54, fontWeight:900, color:HDR }}>{r.score}</span><span style={{ fontSize:20, color:T3 }}> / {total}</span></div>
            <div style={{ marginTop:12, display:'inline-flex', alignItems:'center', background:'#f5f5f5', border:'1px solid #ddd', borderRadius:20, padding:'5px 16px' }}>
              <span style={{ fontSize:13, fontWeight:700, color:ac }}>{accuracy}% Accuracy</span>
            </div>
            <div style={{ marginTop:10, fontSize:11, color:T3 }}>⏱ {fmtT(r.timeTaken)} taken</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
            {[{ label:'Correct', value:r.correct, fg:GRUN }, { label:'Wrong', value:r.wrong, fg:DIAM }, { label:'Skipped', value:r.unattempted, fg:T3 }].map(c => (
              <div key={c.label} style={{ background:'white', border:`1px solid ${BD}`, borderRadius:10, padding:'14px 8px', textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:800, color:c.fg }}>{c.value}</div>
                <div style={{ fontSize:10, color:c.fg, fontWeight:600, marginTop:3 }}>{c.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:T2, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Section Performance</div>
          {r.sectionStats.map(s => {
            const tt = s.correct + s.wrong + s.unattempted
            const pct = tt > 0 ? Math.round((s.correct / tt) * 100) : 0
            const fg = pct >= 60 ? GRUN : pct >= 40 ? '#b8860b' : DIAM
            return (
              <div key={s.name} style={{ background:'white', borderRadius:10, padding:'14px 16px', marginBottom:8, border:`1px solid ${BD}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:T1 }}>{s.name}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:fg }}>{pct}%</span>
                </div>
                <div style={{ display:'flex', gap:5, marginBottom:8 }}>
                  <span style={{ fontSize:10, color:GRUN, background:GRUN_L, padding:'2px 8px', borderRadius:20 }}>✓ {s.correct}</span>
                  <span style={{ fontSize:10, color:DIAM, background:DIAM_L, padding:'2px 8px', borderRadius:20 }}>✗ {s.wrong}</span>
                  <span style={{ fontSize:10, color:T3, background:BG2, padding:'2px 8px', borderRadius:20 }}>— {s.unattempted}</span>
                </div>
                <div style={{ height:4, background:BG2, borderRadius:2 }}><div style={{ height:'100%', width:`${pct}%`, background:fg, borderRadius:2 }} /></div>
              </div>
            )
          })}
        </div>
        <div style={{ flexShrink:0, padding:'12px 16px 20px', borderTop:`1px solid ${BD}`, background:'white' }}>
          <button onClick={onExit} style={{ ...hPrim({ width:'100%', padding:'12px', fontSize:13 }) }}>Back to Live Tests</button>
        </div>
      </div>
    )
  }

  // ── Main test screen ─────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', position:'relative' }}>

      {/* Header */}
      <div style={{ flexShrink:0, background:HDR }}>
        <div style={{ padding:'10px 14px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:600, color:'white' }}>9:41</span>
          <div style={{ display:'flex', gap:6, alignItems:'center', color:'white' }}>
            <svg width="16" height="11" viewBox="0 0 30 20" fill="currentColor"><rect x="0" y="8" width="4" height="12" rx="1" opacity="0.6"/><rect x="7" y="5" width="4" height="15" rx="1" opacity="0.75"/><rect x="14" y="2" width="4" height="18" rx="1" opacity="0.9"/><rect x="21" y="0" width="4" height="20" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="white"/><rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="white" opacity="0.5"/><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill="white"/></svg>
          </div>
        </div>

        <div style={{ padding:'4px 12px 8px', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setShowExitConfirm(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.8)', fontSize:18, lineHeight:1, padding:0, flexShrink:0 }}>✕</button>
          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'white' }}>{isNPrep ? EXAM_META.shortName : EXAM_META.name}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:1 }}>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Total Time Remaining:</span>
              <span style={{ fontSize:14, fontWeight:900, color: totalTimeLeft <= 300 ? '#ff8080' : '#ffcc44', letterSpacing:'0.05em', fontVariantNumeric:'tabular-nums' }}>{timerStr}</span>
            </div>
          </div>
          <button onClick={() => { setGridSec(curSec); setShowGrid(true) }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.8)', flexShrink:0, display:'flex', padding:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
        </div>

        {/* Candidate strip */}
        <div style={{ background:'rgba(0,0,0,0.22)', padding:'6px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:40, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, color:'white', flexShrink:0 }}>A</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'white' }}>{EXAM_META.candidate}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Roll No: {EXAM_META.rollNo} · Nursing Officer</div>
          </div>
          <div style={{ fontSize:11, textAlign:'right', flexShrink:0 }}>
            <span style={{ color:'#7fff88', fontWeight:700 }}>+{EXAM_META.correctMarks}</span>
            <span style={{ color:'rgba(255,255,255,0.45)' }}> / </span>
            <span style={{ color:'#ff8080', fontWeight:700 }}>{EXAM_META.wrongMarks}</span>
          </div>
        </div>

        {/* Section tabs */}
        <div className="scroll" style={{ display:'flex', overflowX:'auto', borderTop:'1px solid rgba(255,255,255,0.15)' }}>
          {SECTIONS.map((sec, i) => {
            const isAct = i === curSec, isLk = sectionLocked[i], st = sectionTimers[i]
            return (
              <div key={sec.id} onClick={() => { setCurSec(i); setCurQLocal(0) }} style={{
                flexShrink:0, padding:'6px 12px 7px', cursor:'pointer',
                borderRight:'1px solid rgba(255,255,255,0.1)',
                borderBottom: isAct ? '2.5px solid #ffcc44' : '2.5px solid transparent',
                background: isAct ? 'rgba(255,255,255,0.12)' : isLk ? 'rgba(0,0,0,0.18)' : 'transparent',
              }}>
                <div style={{ fontSize:11, fontWeight:isAct?700:500, color:isLk?'rgba(255,255,255,0.35)':'white', whiteSpace:'nowrap' }}>
                  {sec.id}: {sec.name.length > 14 ? sec.name.slice(0, 14) + '…' : sec.name}
                </div>
                <div style={{ fontSize:10, marginTop:1, fontVariantNumeric:'tabular-nums', color: isLk ? '#ff8080' : st <= 120 ? '#ffcc44' : 'rgba(255,255,255,0.5)' }}>
                  {isLk ? 'Locked' : `⏱ ${fmtSec(st)}`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Question body */}
      <div className="scroll" style={{ flex:1, paddingBottom:116 }}>
        {isLocked && (
          <div style={{ background:WRN_BG, border:`1px solid ${WRN_BD}`, color:WRN_C, padding:'8px 16px', fontSize:12, lineHeight:1.5 }}>
            This section's time has expired. You can review your answers but cannot modify them.
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px 8px', borderBottom:'1px solid #eee' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T1 }}>Question No. {curQLocal + 1}</span>
            {isMarked && <span style={{ fontSize:10, fontWeight:700, background:'#f0e8ff', color:PURP, border:`1px solid ${PURP}55`, padding:'2px 7px', borderRadius:20 }}>★ Marked</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:T3 }}>Marks:</span>
            <span style={{ fontSize:11, fontWeight:700, color:GRUN }}>+{EXAM_META.correctMarks}</span>
            <span style={{ fontSize:11, color:T3 }}>/</span>
            <span style={{ fontSize:11, fontWeight:700, color:DIAM }}>{EXAM_META.wrongMarks}</span>
          </div>
        </div>

        <div style={{ padding:'14px 16px 12px', fontSize:14, color:T1, lineHeight:1.75 }}>{q.text}</div>

        {q.image && (
          <div style={{ position:'relative', borderTop:'1px solid #eee', borderBottom:'1px solid #eee', background:'#f8f8f8', height:200, overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, overflow: imageZoom > 1 ? 'auto' : 'hidden' }}>
              <img src={q.image} alt="" draggable={false} style={{ display:'block', width: imageZoom > 1 ? `${imageZoom * 100}%` : '100%', height: imageZoom > 1 ? 'auto' : '100%', objectFit: imageZoom > 1 ? undefined : 'contain', minHeight: imageZoom > 1 ? '100%' : undefined }} />
            </div>
            {imageZoom > 1 && <div style={{ position:'absolute', top:8, left:8, padding:'2px 7px', borderRadius:4, background:'rgba(255,255,255,0.92)', border:'1px solid #ddd', fontSize:10, fontWeight:700, color:T2, pointerEvents:'none', zIndex:1 }}>{imageZoom}×</div>}
            <button onClick={() => setImageZoom(z => (z >= 2 ? 1 : parseFloat((z + 0.5).toFixed(1))))} style={{ position:'absolute', bottom:8, right:8, zIndex:1, width:32, height:32, borderRadius:4, background:'rgba(255,255,255,0.94)', border:'1px solid #ddd', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>{imageZoom < 2 && <line x1="11" y1="8" x2="11" y2="14"/>}<line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
          </div>
        )}
        {q.imageLarge && (
          <p style={{ padding:'6px 16px 0', fontSize:11, color:T3, fontStyle:'italic' }}>Tap the zoom button to inspect the image closely.</p>
        )}

        <div>
          {q.options.map((opt, oi) => {
            const isSel = selected === oi
            return (
              <div key={oi} onClick={() => handleAnswer(oi)} style={{
                display:'flex', alignItems:'flex-start', gap:10, padding:'11px 16px',
                borderBottom: oi < q.options.length - 1 ? '1px solid #f0f0f0' : 'none',
                cursor: isLocked ? 'default' : 'pointer',
                background: isSel ? (isNPrep ? PL : '#eaf5ec') : 'white',
              }}>
                <input type="radio" readOnly checked={isSel} disabled={isLocked} style={{ marginTop:3, cursor: isLocked ? 'default' : 'pointer', accentColor:HDR, flexShrink:0 }} />
                <div style={{ flex:1, fontSize:14, lineHeight:1.6, color: isSel ? HDR : T1 }}>
                  <span style={{ fontWeight:700 }}>({String.fromCharCode(65 + oi)}) </span>{opt}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'#f5f5f5', borderTop:'1px solid #bbb', padding:'8px 12px 14px' }}>
        <div style={{ display:'flex', gap:6, marginBottom:6 }}>
          <button onClick={handleMarkNext} disabled={isLocked} style={{ ...gBtn({ flex:1, background: isMarked ? 'linear-gradient(#ede0ff,#c9a8f5)' : undefined, color: isMarked ? PURP : T1, opacity: isLocked ? 0.45 : 1 }) }}>
            {isMarked ? '★ Marked for Review' : 'Mark for Review & Next'}
          </button>
          <button onClick={handleClear} disabled={isLocked} style={{ ...gBtn({ opacity: isLocked ? 0.45 : 1 }) }}>Clear Response</button>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={goPrev} disabled={curSec === 0 && curQLocal === 0} style={{ ...gBtn({ flex:1, opacity: (curSec === 0 && curQLocal === 0) ? 0.4 : 1 }) }}>« Previous</button>
          <button onClick={handleSaveNext} style={{ ...hPrim({ flex:2, fontSize:13 }) }}>{isLastQ ? 'Submit Exam' : 'Save & Next »'}</button>
        </div>
      </div>

      {/* Question Palette bottom sheet */}
      {showGrid && (
        <div className="overlay" onClick={() => setShowGrid(false)}>
          <div className="sheet" style={{ maxHeight:'84%' }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ background:HDR, padding:'10px 16px 12px', flexShrink:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'white' }}>Question Palette</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{counts.answered} answered · {counts.notanswered} not answered · {counts.notvisited} not visited</div>
            </div>
            <div style={{ padding:'10px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 10px', borderBottom:'1px solid #ddd', flexShrink:0, background:'white' }}>
              {isNPrep
                ? [['answered', GRUN, 'Answered'], ['notanswered', DIAM, 'Not Answered'], ['notvisited', '#ccc', 'Not Visited'], ['marked', P, 'Marked for Review'], ['answeredmarked', P, 'Answered & Marked']].map(([st, col, label], li) => (
                    <div key={st} style={{ display:'flex', alignItems:'center', gap:6, gridColumn: li === 4 ? '1 / span 2' : undefined }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:col, flexShrink:0 }} />
                      <span style={{ fontSize:11, color:T2 }}>{label}</span>
                    </div>
                  ))
                : [['answered', 'Answered'], ['notanswered', 'Not Answered'], ['notvisited', 'Not Visited'], ['marked', 'Marked for Review'], ['answeredmarked', 'Answered & Marked']].map(([st, label], li) => (
                    <div key={st} style={{ display:'flex', alignItems:'center', gap:6, gridColumn: li === 4 ? '1 / span 2' : undefined }}>
                      <QShape status={st} num="" size={22} />
                      <span style={{ fontSize:11, color:T2 }}>{label}</span>
                    </div>
                  ))
              }
            </div>
            <div className="scroll" style={{ display:'flex', overflowX:'auto', borderBottom:'1px solid #ddd', background:'#f5f5f5', flexShrink:0 }}>
              {SECTIONS.map((sec, i) => (
                <div key={sec.id} onClick={() => setGridSec(i)} style={{
                  flexShrink:0, padding:'7px 12px', cursor:'pointer', whiteSpace:'nowrap',
                  fontSize:11, fontWeight: gridSec === i ? 700 : 500, color: gridSec === i ? HDR : T2,
                  borderBottom: gridSec === i ? `2px solid ${HDR}` : '2px solid transparent',
                }}>
                  {sec.id}: {sec.name.length > 14 ? sec.name.slice(0, 14) + '…' : sec.name}
                </div>
              ))}
            </div>
            <div className="scroll" style={{ flex:1, padding:'12px 16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, justifyItems:'center' }}>
                {SECTIONS[gridSec].ids.map((gIdx, localIdx) => {
                  const st = getStatus(gIdx)
                  const isC = gridSec === curSec && localIdx === curQLocal
                  if (isNPrep) {
                    const bg = st === 'answered' ? GRUN : st === 'notanswered' ? DIAM : (st === 'marked' || st === 'answeredmarked') ? P : '#ccc'
                    return (
                      <div key={gIdx} onClick={() => { setCurSec(gridSec); setCurQLocal(localIdx); setShowGrid(false) }}
                        style={{ width:36, height:36, borderRadius:'50%', background:bg, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, cursor:'pointer', outline: isC ? '2.5px solid #ff8800' : 'none', outlineOffset:1 }}>
                        {localIdx + 1}
                      </div>
                    )
                  }
                  return <QShape key={gIdx} status={st} num={localIdx + 1} isCurrent={isC} size={36} onClick={() => { setCurSec(gridSec); setCurQLocal(localIdx); setShowGrid(false) }} />
                })}
              </div>
            </div>
            <div style={{ padding:'10px 16px 20px', borderTop:'1px solid #ddd', flexShrink:0, display:'flex', gap:8 }}>
              <button onClick={() => setShowGrid(false)} style={{ ...gBtn({ flex:1 }) }}>Resume</button>
              <button onClick={() => { setShowGrid(false); setShowSubmitConfirm(true) }} style={{ ...hPrim({ flex:2 }) }}>Submit Exam</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit confirm */}
      {showSubmitConfirm && (
        <div className="popup-overlay">
          <div className="popup" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ background:HDR, padding:'11px 16px' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'white', textAlign:'center' }}>Submit Exam</div>
            </div>
            <div style={{ padding:'12px 16px 4px', fontSize:13, color:T1, lineHeight:1.6 }}>Are you sure? Once submitted, you cannot make changes.</div>
            <div style={{ margin:'8px 16px', background:'#f5f5f5', border:'1px solid #ddd' }}>
              {[['Answered', counts.answered, GRUN], ['Not Answered', counts.notanswered, DIAM], ['Marked for Review', counts.marked, PURP], ['Answered & Marked', counts.answeredmarked, PURP], ['Not Visited', counts.notvisited, T3], ['Total Questions', QUESTIONS.length, T1]].map(([label, value, color]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 12px', borderBottom:'1px solid #ddd' }}>
                  <span style={{ fontSize:12, color:T2 }}>{label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'10px 16px 16px', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={() => setShowSubmitConfirm(false)} style={{ ...gBtn() }}>Cancel</button>
              <button onClick={handleSubmit} style={{ ...gDngr() }}>Yes, Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Exit confirm */}
      {showExitConfirm && (
        <div className="popup-overlay">
          <div className="popup">
            <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:10 }}>Exit Exam?</div>
            <div style={{ fontSize:13, color:T2, lineHeight:1.7, marginBottom:20 }}>Your responses will be saved. You can return anytime within the live test window.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{ ...gBtn({ flex:1 }) }}>Continue</button>
              <button onClick={() => { setShowExitConfirm(false); onExit() }} style={{ ...gDngr({ flex:1 }) }}>Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
