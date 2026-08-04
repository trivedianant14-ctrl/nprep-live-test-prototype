import { useState } from 'react'
import { EXAM_META as DEFAULT_EXAM_META } from './examData'
import { P, PD, PL, PB, T1, T2, T3, BD, BG2 } from '../data'
import { ChevronLeft, ClockIcon, StarIcon } from '../icons'

const NAVY = '#1f3a68', NAVY_D = '#162d52'

// meta/sectionCount/sectionMinutes default to the official live test, but a
// student-created test (see CreateTest.jsx) passes its own — same pretest screen,
// same interface choice, different content underneath.
export default function ExamPreTest({ onBack, onStart, meta, sectionCount = 5, sectionMinutes = 18, totalMarks, showWebPrompt = false }) {
  const [interfaceMode, setInterfaceMode] = useState('nprep')
  const [agreed, setAgreed] = useState(false)
  // Shown once when a major live test opens — the spec's exact prompt, offering the
  // web version (full-screen, keyboard-locked) for the most exam-authentic run.
  const [webPromptOpen, setWebPromptOpen] = useState(showWebPrompt)
  const m = meta || DEFAULT_EXAM_META
  const marks = totalMarks ?? m.totalMarks
  const totalMinutes = sectionCount * sectionMinutes

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 16px 12px', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:T1, padding:0, flexShrink:0 }}>
          <ChevronLeft />
        </button>
        <div style={{ fontSize:16, fontWeight:700, color:T1 }}>Before you begin</div>
      </div>

      <div className="scroll" style={{ flex:1, padding:'18px 16px 24px' }}>
        {/* Desktop nudge — the exam is fuller on a large screen */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:9, background:PL, borderRadius:10, padding:'10px 12px', marginBottom:16 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <span style={{ fontSize:11.5, color:PD, lineHeight:1.5 }}>For the best experience, browse <b>nprep.in</b> on desktop.</span>
        </div>
        <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:14, padding:'16px', marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:4 }}>{m.shortName}</div>
          <div style={{ fontSize:11, color:T3, marginBottom:14 }}>{m.candidate} · Nursing Officer</div>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, color:T2 }}><ClockIcon size={13} />{totalMinutes} min · {sectionCount} section{sectionCount === 1 ? '' : 's'} × {sectionMinutes} min</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, color:T2 }}><StarIcon size={13} />{marks} Marks</span>
          </div>
          <div style={{ fontSize:11, color:T3, marginTop:8 }}>+{m.correctMarks} correct · {m.wrongMarks} incorrect</div>
        </div>

        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:8 }}>Prep Mode or Real Exam Mode?</div>
        <div style={{ display:'flex', background:BG2, borderRadius:12, padding:4, gap:4, marginBottom:10 }}>
          {[
            { id:'nprep',  label:'Prep Mode',      sub:'NPrep · relaxed', color:P },
            { id:'norcet', label:'Real Exam Mode', sub:'NORCET · strict', color:NAVY },
          ].map(opt => {
            const isAct = interfaceMode === opt.id
            return (
              <button key={opt.id} onClick={() => setInterfaceMode(opt.id)} style={{
                flex:1, padding:'11px 8px', borderRadius:10, border:'none', cursor:'pointer',
                background: isAct ? opt.color : 'transparent',
                boxShadow: isAct ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              }}>
                <div style={{ fontSize:13, fontWeight:700, color: isAct ? 'white' : T1 }}>{opt.label}</div>
                <div style={{ fontSize:10, color: isAct ? 'rgba(255,255,255,0.75)' : T3, marginTop:1 }}>{opt.sub}</div>
              </button>
            )
          })}
        </div>
        <div style={{ fontSize:11, color:T3, lineHeight:1.6, marginBottom:16 }}>
          {interfaceMode === 'nprep'
            ? "NPrep's own clean, mobile-first exam screen — same questions, same rules, friendlier layout. No fullscreen lock, so you can step away without penalty."
            : 'A faithful replica of the official government CBT portal — same layout, timer, and question palette students see on exam day.'}
          {' '}You can't switch mid-exam — pick the one you want to practice on.
        </div>

        {interfaceMode === 'norcet' && (
          <div style={{ background:'#FFF3CD', border:'1px solid #FFC107', borderRadius:10, padding:'11px 13px', marginBottom:16 }}>
            <div style={{ fontSize:11.5, fontWeight:700, color:'#856404', marginBottom:4 }}>Real Exam Mode enforces exam-day conditions</div>
            <div style={{ fontSize:11, color:'#856404', lineHeight:1.6 }}>
              Full-screen is required and the keyboard is disabled — use your mouse or finger only.
              Pressing a key or leaving full-screen counts as a warning; <b>3 warnings auto-submits your test</b>.
              {' '}You can also take this test on a larger screen — open it on the web for the most authentic experience.
            </div>
          </div>
        )}

        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:8 }}>General Instructions</div>
        <ol style={{ paddingLeft:18, margin:'0 0 18px', fontSize:11.5, color:T2, lineHeight:1.7 }}>
          <li style={{ marginBottom:7 }}>The test has <b>{sectionCount} section{sectionCount === 1 ? '' : 's'} of {sectionMinutes} minutes</b> each ({totalMinutes} min total). Each section has its own countdown timer, shown at the top.</li>
          <li style={{ marginBottom:7 }}>Sections are attempted in a fixed order. When a section's timer ends it closes and the next opens automatically — <b>you cannot return to a completed section</b>.</li>
          <li style={{ marginBottom:7 }}>Tap one of the four options to select your answer, then tap <b>Save &amp; Next</b> to save it and move on. Use <b>Clear Response</b> to deselect.</li>
          <li style={{ marginBottom:7 }}>Use <b>Mark for Review</b> to flag a question to revisit within the same section.</li>
          <li style={{ marginBottom:7 }}>The <b>Question Palette</b> shows the status of every question — answered, not answered, marked for review or not visited.</li>
          <li style={{ marginBottom:7 }}>Marking: <b>+{m.correctMarks}</b> for a correct answer, <b>{m.wrongMarks}</b> for a wrong answer; an unattempted question scores 0.</li>
          <li style={{ marginBottom:7 }}>Tap <b>Submit</b> to end the test; it also submits automatically when time expires.</li>
          {interfaceMode === 'norcet'
            ? <li><b>Real Exam Mode:</b> full-screen is required and the keyboard is disabled. Leaving full-screen or pressing a key counts as a warning — 3 warnings auto-submit your test.</li>
            : <li><b>Prep Mode:</b> no full-screen lock and the keyboard is allowed — you can step away without penalty.</li>}
        </ol>

        <label style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:12, color:T2, lineHeight:1.6, cursor:'pointer' }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop:2, flexShrink:0 }} />
          I have read all the instructions and agree to abide by the exam rules. Once started, section timers cannot be paused.
        </label>
      </div>

      <div style={{ flexShrink:0, padding:'12px 16px 20px', borderTop:`1px solid ${BD}` }}>
        <button
          disabled={!agreed}
          onClick={() => agreed && onStart(interfaceMode)}
          style={{ width:'100%', padding:'14px', borderRadius:24, background: agreed ? P : BG2, color: agreed ? 'white' : T3, border:'none', fontSize:14, fontWeight:600, cursor: agreed ? 'pointer' : 'default' }}>
          I am ready to begin
        </button>
      </div>

      {webPromptOpen && (
        <div className="popup-overlay">
          <div className="popup" style={{ textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'#F1F4FF', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:8 }}>Experience the actual exam</div>
            <div style={{ fontSize:13, color:T2, lineHeight:1.65, marginBottom:18 }}>
              You can also attend this test to experience it in the actual exam mode — open it on the web.
              The web version runs full-screen with the keyboard locked, exactly like exam day.
            </div>
            <button
              onClick={() => window.open('https://web-test-screen.vercel.app', '_blank', 'noopener')}
              style={{ width:'100%', padding:'12px', borderRadius:24, background:NAVY, color:'white', border:'none', fontSize:13.5, fontWeight:600, cursor:'pointer', marginBottom:8 }}>
              Open on Web
            </button>
            <button
              onClick={() => setWebPromptOpen(false)}
              style={{ width:'100%', padding:'11px', borderRadius:24, background:'white', color:T2, border:`1px solid ${BD}`, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Continue on App
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
