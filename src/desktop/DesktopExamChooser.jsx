import { EXAM_META as DEFAULT_EXAM_META } from '../exam/examData'
import { P, PD, PL, T1, T2, T3, BD, BG2 } from '../data'

const OPTIONS = [
  {
    id: 'nprep-mock', badge: 'FULL MOCK', title: 'NPrep Mock Test', accent: P, tint: PL,
    sub: 'An exam-style mock in the clean NPrep interface.',
    points: ['Jump freely between sections', 'Submit → summary & result', 'Lenient — keyboard allowed'],
    icon: <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></>,
  },
  {
    id: 'norcet', badge: 'NORCET · PRELIMS', title: 'NORCET Prelims', accent: PD, tint: '#EEF1FB',
    sub: 'The authentic AIIMS CBT — Stage I, exam-day conditions.',
    points: ['5 sections × 18 min, in sequence', 'No feedback until you submit', 'Section-locked · full-screen'],
    icon: <><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
  },
  {
    id: 'norcet-mains', badge: 'NORCET · MAINS', title: 'NORCET Mains', accent: '#9A3E12', tint: '#FFF4EC',
    sub: 'The authentic AIIMS CBT — Stage II, the final merit round.',
    points: ['4 sections × 45 min · case-based', 'Section-locked, in sequence', 'Full-screen exam-day mode'],
    icon: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  },
]

// Lets the student pick how to attempt the test on the web — NPrep's guided practice or
// mock, or an authentic NORCET Prelims / Mains replica.
export default function DesktopExamChooser({ meta, onPick, onBack }) {
  const M = meta || DEFAULT_EXAM_META
  return (
    <div style={{ position: 'fixed', inset: 0, background: BG2, overflowY: 'auto', fontFamily: "'Poppins', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 940 }}>
        <button onClick={onBack} style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 20, padding: '7px 14px', cursor: 'pointer', color: T2, fontSize: 12.5, fontWeight: 600, marginBottom: 24 }}>← Back to Tests</button>
        <div style={{ textAlign: 'center', marginBottom: 6, fontSize: 24, fontWeight: 700, color: T1 }}>Choose your interface</div>
        <div style={{ textAlign: 'center', marginBottom: 28, fontSize: 14, color: T2 }}>
          <span style={{ fontWeight: 600, color: T1 }}>{M.series || 'NASHTA'}</span> · same questions, three ways to attempt.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {OPTIONS.map(o => (
            <button key={o.id} onClick={() => onPick(o.id)} style={{
              textAlign: 'left', background: 'white', border: `1px solid ${BD}`, borderRadius: 16, padding: '20px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = o.accent)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BD)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: o.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={o.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{o.icon}</svg>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: o.accent }}>{o.badge}</div>
                  <div style={{ fontSize: 16.5, fontWeight: 700, color: T1 }}>{o.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: T2, lineHeight: 1.5 }}>{o.sub}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {o.points.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: T1 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={o.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
                    {p}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 24, background: o.accent, color: '#fff', fontSize: 12.5, fontWeight: 600 }}>
                  Start →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
