import { P, PL, T1, T2, T3, G } from '../data'

const RED = '#E5484D', RED_L = '#FDECED', RED_B = '#F5C6C8'
const AMBER = '#C98A1B', AMBER_L = '#FDF4E3', AMBER_B = '#F0DEB4'
const BLUE = '#008DFF', BLUE_L = '#F1F4FF', BLUE_B = '#C9DDF8'

const TONES = {
  red:   { bg: RED_L,   border: RED_B,   accent: RED },
  amber: { bg: AMBER_L, border: AMBER_B, accent: AMBER },
  blue:  { bg: BLUE_L,  border: BLUE_B,  accent: BLUE },
}

// Small glyph per alert kind
function AlertIcon({ kind, color }) {
  const common = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (kind === 'reg') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg> // clock
  if (kind === 'daily') return <svg {...common} fill={color} stroke="none"><circle cx="12" cy="12" r="6" /></svg> // live dot
  return <svg {...common}><path d="M12 2a7 7 0 00-7 7c0 5-3 6-3 6h20s-3-1-3-6a7 7 0 00-7-7z" /><path d="M10 21a2 2 0 004 0" /></svg> // bell
}

// The home-screen actionable-alerts strip. Time-sensitive rows, each with one action.
// Dismissals are lifted to the caller so they persist while navigating. Shows up to `max`.
export default function AlertsStrip({ alerts, dismissed, onDismiss, onRegister, onGoDaily, max = 3, style }) {
  const visible = alerts.filter(a => !dismissed.has(a.id)).slice(0, max)
  if (visible.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {visible.map(a => {
        const tone = TONES[a.tone] || TONES.blue
        return (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 11, background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {a.kind === 'daily'
                ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone.accent, boxShadow: `0 0 0 3px ${tone.accent}33`, animation: 'livePulse 1.4s ease-in-out infinite' }} />
                : <AlertIcon kind={a.kind} color={tone.accent} />}
            </div>
            <span style={{ flex: 1, fontSize: 12, color: T1, lineHeight: 1.4 }}>{a.message}</span>
            {a.kind === 'reg' && (
              <button onClick={() => onRegister(a.test)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, background: tone.accent, color: 'white', border: 'none', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Register</button>
            )}
            {a.kind === 'daily' && onGoDaily && (
              <button onClick={onGoDaily} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, background: tone.accent, color: 'white', border: 'none', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Attempt</button>
            )}
            <button onClick={() => onDismiss(a.id)} title="Dismiss" style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
