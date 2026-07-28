import { EXAM_META as DEFAULT_EXAM_META } from '../exam/examData'
import { P, PD, PL, T1, T2, T3, BD, BG2 } from '../data'

// Lets the student pick how they want to attempt the test on the web — NPrep's guided
// Prep Mode (instant feedback + explanations) or an authentic NORCET Real-Exam replica.
export default function DesktopExamChooser({ meta, onPick, onBack }) {
  const M = meta || DEFAULT_EXAM_META
  const OPTIONS = [
    {
      id: 'nprep', badge: 'PREP MODE', title: 'NPrep Interface',
      sub: 'Learn as you go — clean, guided practice.',
      points: ['Instant right/wrong feedback per question', 'Detailed explanations & option analytics', 'Save questions to your revision list', 'Relaxed — no section time-lock'],
      icon: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></>,
      accent: P, tint: PL,
    },
    {
      id: 'norcet', badge: 'REAL EXAM MODE', title: 'NORCET Interface',
      sub: 'The authentic AIIMS CBT — exam-day conditions.',
      points: ['Exact AIIMS NORCET CBT layout', 'Section-locked: 18 min each, in sequence', 'No feedback until you submit', 'No going back to a closed section'],
      icon: <><rect x="3" y="4" width="18" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="18" x2="12" y2="21" /></>,
      accent: PD, tint: '#EEF1FB',
    },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: BG2, overflowY: 'auto', fontFamily: "'Poppins', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' }}>
      <div style={{ width: '100%', maxWidth: 820 }}>
        <button onClick={onBack} style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 20, padding: '7px 14px', cursor: 'pointer', color: T2, fontSize: 12.5, fontWeight: 600, marginBottom: 26 }}>← Back to Tests</button>
        <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 24, fontWeight: 700, color: T1 }}>Choose your interface</div>
        <div style={{ textAlign: 'center', marginBottom: 30, fontSize: 14, color: T2 }}>
          <span style={{ fontWeight: 600, color: T1 }}>{M.shortName}</span> · {M.totalMarks} marks · same questions, two ways to attempt.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {OPTIONS.map(o => (
            <button key={o.id} onClick={() => onPick(o.id)} style={{
              textAlign: 'left', background: 'white', border: `1px solid ${BD}`, borderRadius: 16, padding: '22px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = o.accent)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BD)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: o.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={o.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{o.icon}</svg>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: o.accent }}>{o.badge}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: T1 }}>{o.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: T2, lineHeight: 1.5 }}>{o.sub}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
                {o.points.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: T1 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={o.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
                    {p}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 24, background: o.accent, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                  Start in {o.title.split(' ')[0]} →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
