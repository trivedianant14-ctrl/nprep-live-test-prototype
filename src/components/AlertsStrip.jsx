import { T1, T2, T3, BD } from '../data'

const RED = '#E5484D', RED_L = '#FDECED'
const AMBER = '#C98A1B', AMBER_L = '#FDF4E3'
const BLUE = '#008DFF', BLUE_L = '#F1F4FF'

const TONES = {
  red:   { accent: RED,   chip: RED_L },
  amber: { accent: AMBER, chip: AMBER_L },
  blue:  { accent: BLUE,  chip: BLUE_L },
}

function AlertIcon({ kind, color }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (kind === 'reg') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  return <svg {...common}><path d="M12 2a7 7 0 00-7 7c0 5-3 6-3 6h20s-3-1-3-6a7 7 0 00-7-7z" /><path d="M10 21a2 2 0 004 0" /></svg>
}

// Home-screen actionable-alerts surface. One quiet white card with hairline dividers —
// urgency shows through a small tinted icon chip and the action colour, not a loud fill,
// so it sits seamlessly among the other cards on the page. Dismissals lifted to caller.
export default function AlertsStrip({ alerts, dismissed, onDismiss, onRegister, onGoDaily, max = 3, style }) {
  const visible = alerts.filter(a => !dismissed.has(a.id)).slice(0, max)
  if (visible.length === 0) return null

  return (
    <div style={{ background: 'white', border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden', ...style }}>
      {visible.map((a, i) => {
        const tone = TONES[a.tone] || TONES.blue
        return (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderTop: i ? `1px solid ${BD}` : 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: tone.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {a.kind === 'daily'
                ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone.accent, boxShadow: `0 0 0 3px ${tone.accent}22`, animation: 'livePulse 1.4s ease-in-out infinite' }} />
                : <AlertIcon kind={a.kind} color={tone.accent} />}
            </div>
            <span style={{ flex: 1, fontSize: 12, color: T1, lineHeight: 1.4 }}>{a.message}</span>
            {(a.kind === 'reg' || (a.kind === 'daily' && onGoDaily)) && (
              <button
                onClick={() => (a.kind === 'reg' ? onRegister(a.test) : onGoDaily())}
                style={{ flexShrink: 0, padding: '5px 13px', borderRadius: 20, background: 'transparent', color: tone.accent, border: `1px solid ${tone.accent}55`, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                {a.kind === 'reg' ? 'Register' : 'Attempt'}
              </button>
            )}
            <button onClick={() => onDismiss(a.id)} title="Dismiss" style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 3 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
