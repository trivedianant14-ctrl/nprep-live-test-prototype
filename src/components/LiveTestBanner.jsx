import { useEffect, useState } from 'react'
import { P, PD, G, GL, A, AL, T1, T2, T3, BD, BG2 } from '../data'
import { ClockIcon, StarIcon, UsersIcon } from '../icons'
import { getLifecyclePhase, formatCountdown } from '../utils/lifecycle'

// Labels match the spec's exact lifecycle terms: Scheduled -> Registering -> Countdown to
// Live -> Live -> Result Out/Missed. ("Scheduled" — before registration opens — isn't
// modeled by this prototype's single test, which is always at least registering.)
const PHASE_META = {
  upcoming:      { label: 'Registering',       bg: '#F1F4FF', color: '#008DFF' },
  starting_soon: { label: 'Countdown to Live', bg: AL,        color: A },
  ended:         { label: 'Processing',        bg: BG2,       color: T2 },
}

// Renders whichever phase the test is actually in right now, recomputed every second —
// the banner is "automated" in the sense that nothing here is hardcoded to a phase; it's
// derived live from test.startAt/endAt, the same way the real product's banner would
// need to derive it from the test's actual schedule.
export default function LiveTestBanner({ test, onJoin, attempted, phaseOverride }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const phase = phaseOverride || getLifecyclePhase(test, now)
  // When previewing a phase the real test isn't actually in, real start/end math would
  // produce nonsense (e.g. a negative countdown for "Upcoming" on a test already live) —
  // use an illustrative countdown instead, since the point of the override is to show
  // what the copy looks like, not to fake the real schedule.
  const isPreview = !!phaseOverride && phaseOverride !== getLifecyclePhase(test, now)
  const startCountdown = isPreview ? '1d 14h' : formatCountdown(test.startAt - now)
  const soonCountdown  = isPreview ? '08:42'  : formatCountdown(test.startAt - now)
  const endCountdown   = isPreview ? '45:00'  : formatCountdown(test.endAt - now)
  const previewAttempted = phaseOverride === 'results' ? true : attempted

  if (phase === 'live') {
    return (
      <div style={{ background:PD, borderRadius:14, padding:'18px 16px 16px', marginBottom:24, boxShadow:'0 4px 16px rgba(19,27,99,0.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(255,255,255,0.18)', color:'white', border:'1px solid rgba(255,255,255,0.32)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF3B30', display:'inline-block', boxShadow:'0 0 0 2px rgba(255,59,48,0.4)', animation:'livePulse 1.4s ease-in-out infinite' }} />
            LIVE
          </span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.72)', fontWeight:500 }}>Ends {endCountdown} from now</span>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:'white', marginBottom:12, lineHeight:1.4 }}>{test.name}</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'rgba(255,255,255,0.80)', fontWeight:500 }}><ClockIcon />{test.durationLabel}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'rgba(255,255,255,0.80)', fontWeight:500 }}><StarIcon />{test.marks} Marks</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'rgba(255,255,255,0.80)', fontWeight:500 }}><UsersIcon />{test.enrolled.toLocaleString()} joined</span>
        </div>
        {/* No re-attempts on a Live Test — once submitted, the CTA retires rather than
            offering to re-enter. */}
        <button onClick={() => !attempted && onJoin()} disabled={attempted} style={{ width:'100%', padding:'12px', borderRadius:24, background: attempted ? GL : 'white', color: attempted ? G : PD, fontSize:14, fontWeight:600, border:'none', cursor: attempted ? 'default' : 'pointer', boxShadow: attempted ? 'none' : '0 2px 8px rgba(0,0,0,0.12)' }}>
          {attempted ? '✓ Test Submitted' : 'Start Attempt'}
        </button>
      </div>
    )
  }

  if (phase === 'results') {
    const meta = previewAttempted
      ? { label: 'Result Out', bg: GL, color: G }
      : { label: 'Missed',     bg: BG2, color: T3 }
    return (
      <div style={{ background:'white', border:`1px solid ${BD}`, borderLeft:`3px solid ${previewAttempted ? G : T3}`, borderRadius:14, padding:'14px 16px', marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, gap:8 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:600, padding:'4px 10px 4px 8px', borderRadius:20, background:meta.bg, color:meta.color }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:meta.color, display:'inline-block' }} />
            {meta.label}
          </span>
          <span style={{ fontSize:11, color:T3 }}>{test.timeLabel}</span>
        </div>
        <div style={{ fontSize:13.5, fontWeight:600, color:T1, marginBottom:8, lineHeight:1.4 }}>{test.name}</div>
        {previewAttempted ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
            <span style={{ fontSize:12, color:T2 }}>Results are out.</span>
            <button style={{ flexShrink:0, padding:'7px 16px', borderRadius:20, background:P, color:'white', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>View Result</button>
          </div>
        ) : (
          <div style={{ fontSize:12, color:T2, lineHeight:1.5 }}>This test has closed and you didn't attempt it. It won't reopen — check Upcoming Tests for what's next.</div>
        )}
      </div>
    )
  }

  const meta = PHASE_META[phase]
  const accent = phase === 'upcoming' ? P : phase === 'starting_soon' ? A : T3

  return (
    <div style={{ background:'white', border:`1px solid ${BD}`, borderLeft:`3px solid ${accent}`, borderRadius:14, padding:'14px 16px', marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, gap:8 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:600, padding:'4px 10px 4px 8px', borderRadius:20, background:meta.bg, color:meta.color }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:meta.color, display:'inline-block' }} />
          {meta.label}
        </span>
        <span style={{ fontSize:11, color:T3 }}>{test.timeLabel}</span>
      </div>
      <div style={{ fontSize:13.5, fontWeight:600, color:T1, marginBottom:8, lineHeight:1.4 }}>{test.name}</div>

      {phase === 'upcoming' && (
        <div style={{ fontSize:12, color:T2 }}>Starts in <b style={{ color:T1 }}>{startCountdown}</b> · registration is open</div>
      )}
      {phase === 'starting_soon' && (
        <div style={{ fontSize:12, color:A, fontWeight:600 }}>Begins in {soonCountdown} — get ready</div>
      )}
      {phase === 'ended' && (
        <div style={{ fontSize:12, color:T2, lineHeight:1.5 }}>Your responses are being processed. Results are usually declared within a few hours.</div>
      )}
    </div>
  )
}
