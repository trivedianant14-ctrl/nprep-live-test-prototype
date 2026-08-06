import { useState } from 'react'
import { EXAM_META as DEFAULT_EXAM_META } from './examData'
import { P, PD, PL, PB, T1, T2, T3, BD, BG2 } from '../data'
import { ChevronLeft, ClockIcon, StarIcon } from '../icons'

const NAVY = '#1f3a68', NAVY_D = '#162d52'
const GRN = '#2eaa3a', REDX = '#d94a4a', PURP = '#8a4ed4'

// Two-step pre-test: (1) pick the interface mode, then (2) a General Instructions page that
// reflects the chosen mode — NPrep's friendly practice rules, or the formal NORCET/NTA
// govt-CBT rules. The "I agree" declaration lives once, on that instructions page.
export default function ExamPreTest({ onBack, onStart, meta, sectionCount = 5, sectionMinutes = 18, totalMarks, showWebPrompt = false, norcetMeta, norcetSectionCount, norcetSectionMinutes }) {
  const [step, setStep] = useState('mode')          // mode | instructions
  const [interfaceMode, setInterfaceMode] = useState('nprep')
  const [agreed, setAgreed] = useState(false)
  const [webPromptOpen, setWebPromptOpen] = useState(showWebPrompt)
  const isNPrep = interfaceMode === 'nprep'
  // Real Exam Mode runs the actual NORCET paper (different length/timing than the NPrep
  // mock) — once picked, the instructions page must describe that paper, not the mock's.
  const useNorcet = !isNPrep && norcetMeta
  const m = (useNorcet ? norcetMeta : meta) || DEFAULT_EXAM_META
  const effSectionCount = useNorcet ? norcetSectionCount : sectionCount
  const effSectionMinutes = useNorcet ? norcetSectionMinutes : sectionMinutes
  const marks = (useNorcet ? undefined : totalMarks) ?? m.totalMarks
  const totalMinutes = effSectionCount * effSectionMinutes

  const OL = { paddingLeft: 18, margin: '0 0 16px', fontSize: 11.5, color: T2, lineHeight: 1.7 }
  const LI = { marginBottom: 7 }

  // ── NPrep (Prep Mode) — friendly edtech instructions ──
  const nprepInstructions = (
    <>
      <ol style={OL}>
        <li style={LI}>The test has <b>{sectionCount} section{sectionCount === 1 ? '' : 's'} of {sectionMinutes} minutes</b> each ({totalMinutes} min total). Each section has its own countdown timer, shown at the top.</li>
        <li style={LI}>Sections are attempted in order. When a section's timer ends it closes and the next opens automatically — <b>you cannot return to a completed section</b>.</li>
        <li style={LI}>Tap one of the four options to select your answer, then tap <b>Save &amp; Next</b> to save it and move on. Use <b>Clear Response</b> to deselect.</li>
        <li style={LI}>Use <b>Mark for Review</b> to flag a question to revisit within the same section.</li>
        <li style={LI}>The <b>Question Palette</b> shows the status of every question — answered, not answered, marked for review or not visited.</li>
        <li style={LI}>Marking: <b>+{m.correctMarks}</b> for a correct answer, <b>{m.wrongMarks}</b> for a wrong answer; an unattempted question scores 0.</li>
        <li style={LI}>Tap <b>Submit</b> to end the test; it also submits automatically when time expires.</li>
        <li style={LI}><b>NPrep Mode is relaxed</b> — no full-screen lock and the keyboard is allowed, so you can step away without penalty. Same questions and rules as the real exam, in NPrep's cleaner layout.</li>
      </ol>
    </>
  )

  // ── NORCET (Real Exam Mode) — formal govt-CBT instructions ──
  const legendRow = (color, shape, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, fontSize: 11.5, color: T2 }}>
      <span style={{ width: 18, height: 18, flexShrink: 0, background: color, borderRadius: shape === 'circle' ? '50%' : shape === 'diamond' ? 2 : 3, transform: shape === 'diamond' ? 'rotate(45deg)' : 'none', border: shape === 'square-o' ? `1px solid #bbb` : 'none' }} />
      {label}
    </div>
  )
  const norcetInstructions = (
    <>
      <ol style={OL}>
        <li style={LI}>The clock is set at the server. The countdown timer at the top shows the remaining time for the <b>current section</b>. When it reaches zero, that section ends by itself.</li>
        <li style={LI}>The <b>Question Palette</b> shows the status of each question using these symbols:</li>
      </ol>
      <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', margin: '0 0 16px' }}>
        {legendRow('#ddd', 'square-o', 'Not Visited')}
        {legendRow(REDX, 'diamond', 'Not Answered')}
        {legendRow(GRN, 'square', 'Answered')}
        {legendRow(PURP, 'circle', 'Marked for Review')}
        {legendRow(PURP, 'circle', 'Answered & Marked (will be evaluated)')}
      </div>
      <ol style={{ ...OL, listStyle: 'none', paddingLeft: 0 }}>
        <li style={LI}>3. To answer, tap one of the four options. To deselect, tap it again or tap <b>Clear Response</b>. You <b>MUST</b> tap <b>Save &amp; Next</b> to save your answer.</li>
        <li style={LI}>4. Use <b>Mark for Review</b> to flag a question; a marked question that also has a selected answer is still evaluated.</li>
        <li style={LI}>5. Sections are attempted in a fixed sequence. When a section's timer ends it closes and the next opens automatically — <b>you cannot return to a completed section</b>.</li>
        <li style={LI}>6. There is no early submit — the <b>Submit</b> option only appears on the last question of the last section; the test also submits automatically when the overall time expires.</li>
        <li style={LI}>7. Marking: <b>+{m.correctMarks}</b> for a correct answer, <b>{m.wrongMarks}</b> for a wrong answer; an unattempted question scores 0.</li>
        <li style={LI}>8. <b>Real Exam Mode</b> enforces exam-day conditions: full-screen is required and the keyboard is disabled. Leaving full-screen or pressing a key counts as a warning — <b>3 warnings auto-submit your test</b>.</li>
      </ol>
      <div style={{ background: '#FFF3CD', border: '1px solid #FFC107', borderRadius: 8, padding: '10px 12px', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#856404', lineHeight: 1.6 }}><b>Note:</b> This is an NPrep practice simulation, built to mirror the actual NORCET exam-day interface so you can prepare under real conditions.</span>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px 12px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <button onClick={step === 'instructions' ? () => setStep('mode') : onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: T1, padding: 0, flexShrink: 0 }}>
          <ChevronLeft />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: T1 }}>{step === 'mode' ? 'Before you begin' : 'General Instructions'}</div>
      </div>

      {step === 'mode' ? (
        <>
          <div className="scroll" style={{ flex: 1, padding: '18px 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: PL, borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
              <span style={{ fontSize: 11.5, color: PD, lineHeight: 1.5 }}>For the best experience, browse <b>nprep.in</b> on desktop.</span>
            </div>
            <div style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 14, padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T1, marginBottom: 4 }}>{m.shortName}</div>
              <div style={{ fontSize: 11, color: T3, marginBottom: 14 }}>{m.candidate} · Nursing Officer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: T2 }}><ClockIcon size={13} />{totalMinutes} min · {effSectionCount} section{effSectionCount === 1 ? '' : 's'} × {effSectionMinutes} min</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: T2 }}><StarIcon size={13} />{marks} Marks</span>
              </div>
              <div style={{ fontSize: 11, color: T3, marginTop: 8 }}>+{m.correctMarks} correct · {m.wrongMarks} incorrect</div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 8 }}>NPrep Mode or Real Exam Mode?</div>
            <div style={{ display: 'flex', background: BG2, borderRadius: 12, padding: 4, gap: 4, marginBottom: 10 }}>
              {[{ id: 'nprep', label: 'NPrep Mode', sub: 'relaxed', color: P }, { id: 'norcet', label: 'Real Exam Mode', sub: 'NORCET · strict', color: NAVY }].map(opt => {
                const isAct = interfaceMode === opt.id
                return (
                  <button key={opt.id} onClick={() => setInterfaceMode(opt.id)} style={{ flex: 1, padding: '11px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isAct ? opt.color : 'transparent', boxShadow: isAct ? '0 2px 8px rgba(0,0,0,0.12)' : 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isAct ? 'white' : T1 }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: isAct ? 'rgba(255,255,255,0.75)' : T3, marginTop: 1 }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: T3, lineHeight: 1.6 }}>
              {isNPrep
                ? "NPrep's own clean, mobile-first exam screen — same questions, same rules, friendlier layout. No full-screen lock, so you can step away without penalty."
                : 'A faithful replica of the official government CBT portal — same layout, timer and question palette students see on exam day.'}
              {' '}You can't switch mid-exam — pick the one you want to practice on, then read its instructions.
            </div>
          </div>
          <div style={{ flexShrink: 0, padding: '12px 16px 20px', borderTop: `1px solid ${BD}` }}>
            <button onClick={() => { setStep('instructions'); setAgreed(false) }} style={{ width: '100%', padding: '14px', borderRadius: 24, background: isNPrep ? P : NAVY, color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Continue →</button>
          </div>
        </>
      ) : (
        <>
          <div className="scroll" style={{ flex: 1, padding: '16px 16px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: isNPrep ? PL : '#EAF0F8', borderRadius: 20, padding: '5px 12px', marginBottom: 14 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isNPrep ? P : NAVY }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: isNPrep ? P : NAVY }}>{isNPrep ? 'NPrep Mode' : 'Real Exam Mode · NORCET'}</span>
            </div>
            {isNPrep ? nprepInstructions : norcetInstructions}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: T2, lineHeight: 1.6, cursor: 'pointer', marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${BD}` }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
              I have read and understood all the instructions and agree to abide by the exam rules. Once started, section timers cannot be paused.
            </label>
          </div>
          <div style={{ flexShrink: 0, padding: '12px 16px 20px', borderTop: `1px solid ${BD}` }}>
            <button disabled={!agreed} onClick={() => agreed && onStart(interfaceMode)} style={{ width: '100%', padding: '14px', borderRadius: 24, background: agreed ? (isNPrep ? P : NAVY) : BG2, color: agreed ? 'white' : T3, border: 'none', fontSize: 14, fontWeight: 600, cursor: agreed ? 'pointer' : 'default' }}>I am ready to begin</button>
          </div>
        </>
      )}

      {webPromptOpen && (
        <div className="popup-overlay">
          <div className="popup" style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F1F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T1, marginBottom: 8 }}>Experience the actual exam</div>
            <div style={{ fontSize: 13, color: T2, lineHeight: 1.65, marginBottom: 18 }}>You can also attend this test in the actual exam mode — open it on the web. The web version runs full-screen with the keyboard locked, exactly like exam day.</div>
            <button onClick={() => window.open('https://web-test-screen.vercel.app', '_blank', 'noopener')} style={{ width: '100%', padding: '12px', borderRadius: 24, background: NAVY, color: 'white', border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>Open on Web</button>
            <button onClick={() => setWebPromptOpen(false)} style={{ width: '100%', padding: '11px', borderRadius: 24, background: 'white', color: T2, border: `1px solid ${BD}`, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Continue on App</button>
          </div>
        </div>
      )}
    </div>
  )
}
