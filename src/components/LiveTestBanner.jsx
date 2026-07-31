import { useEffect, useState } from 'react'
import { P, PD, PL, G, GL, A, AL, T1, T2, T3, BD, BG2 } from '../data'
import { ClockIcon, StarIcon, UsersIcon } from '../icons'
import { formatCountdown } from '../utils/lifecycle'

const RED = '#E5484D', RED_L = '#FDECED'

// The home hero. It renders ONE lifecycle state chosen by the banner-priority engine
// (utils/bannerPriority). Every state in the Whimsical lifecycle has a variant here;
// a null state means the zero state (nothing live/upcoming) and the hero is hidden.
const titleOf = t => t?.name || t?.fullName || 'Live Test'
const timeOf = t => t?.timeLabel || t?.date || ''

// A shared bordered card used by all the non-live states, with a colored left accent.
function StateCard({ accent, children }) {
  return (
    <div style={{ background: 'white', border: `1px solid ${BD}`, borderLeft: `3px solid ${accent}`, borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
      {children}
    </div>
  )
}
function Pill({ bg, color, dot = true, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, padding: '4px 10px 4px 8px', borderRadius: 20, background: bg, color }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />}
      {children}
    </span>
  )
}

export default function LiveTestBanner({ state, attempted, onJoin, onRegister, onViewResult = () => {}, isRegistered = false }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!state) return null // zero state — hero hidden, Past Tests take over below
  const { id, test } = state
  const cd = (target, fallback) => (target ? formatCountdown(target - now) : fallback)

  // ── T1 · Attempt Now (live window) — the only full navy hero ──
  if (id === 'attempt_now') {
    const endCountdown = cd(test.endAt, '45:00')
    return (
      <div style={{ background: PD, borderRadius: 14, padding: '18px 16px 16px', marginBottom: 24, boxShadow: '0 4px 16px rgba(19,27,99,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.32)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3B30', display: 'inline-block', boxShadow: '0 0 0 2px rgba(255,59,48,0.4)', animation: 'livePulse 1.4s ease-in-out infinite' }} />
            LIVE
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>Ends {endCountdown} from now</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 12, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}><ClockIcon />{test.durationLabel || test.duration}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}><StarIcon />{test.marks} Marks</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}><UsersIcon />{(test.enrolled || 0).toLocaleString()} joined</span>
        </div>
        <button onClick={() => !attempted && onJoin?.()} disabled={attempted} style={{ width: '100%', padding: '12px', borderRadius: 24, background: attempted ? GL : 'white', color: attempted ? G : PD, fontSize: 14, fontWeight: 600, border: 'none', cursor: attempted ? 'default' : 'pointer', boxShadow: attempted ? 'none' : '0 2px 8px rgba(0,0,0,0.12)' }}>
          {attempted ? '✓ Test Submitted' : 'Start Attempt'}
        </button>
      </div>
    )
  }

  // ── T2 · Save-Attempt nudge — registered, live, not started, closing soon ──
  if (id === 'save_attempt') {
    return (
      <StateCard accent={A}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={AL} color={A}>Don't lose your attempt</Pill>
          <span style={{ fontSize: 11, color: A, fontWeight: 600 }}>Closes in {cd(test.endAt, '1h 48m')}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: 8, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>You're registered but haven't started yet.</span>
          <button onClick={() => onJoin?.()} style={{ flexShrink: 0, padding: '9px 18px', borderRadius: 20, background: A, color: 'white', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Start now</button>
        </div>
      </StateCard>
    )
  }

  // ── Starting soon — countdown to the window opening ──
  if (id === 'starting_soon') {
    return (
      <StateCard accent={A}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={AL} color={A}>Countdown to Live</Pill>
          <span style={{ fontSize: 11, color: T3 }}>{timeOf(test)}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: 8, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ fontSize: 12, color: A, fontWeight: 600 }}>Begins in {cd(test.startAt, '08:42')} — get ready</div>
      </StateCard>
    )
  }

  // ── Results Waiting — window closed, processing, no CTA ──
  if (id === 'results_waiting') {
    return (
      <StateCard accent={T3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={BG2} color={T2}>Results awaited</Pill>
          <span style={{ fontSize: 11, color: T3 }}>{timeOf(test)}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: 8, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>Your responses are being processed. Results and your report card are usually declared within a few hours.</div>
      </StateCard>
    )
  }

  // ── T3 · Result Out (hot) / T5 · Result Out (aged) ──
  if (id === 'result_hot' || id === 'result_aged') {
    const hot = id === 'result_hot'
    return (
      <StateCard accent={hot ? G : T3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={hot ? GL : BG2} color={hot ? G : T3}>Result Out{hot ? '' : ' · earlier'}</Pill>
          <span style={{ fontSize: 11, color: T3 }}>{timeOf(test)}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: hot ? 10 : 8, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12, color: T2 }}>
            {test.score != null ? <>You scored <b style={{ color: T1 }}>{test.score}{test.mks ? `/${test.mks}` : ''}</b>.</> : 'Your result and report card are out.'}
          </span>
          <button onClick={() => onViewResult(test)} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, background: hot ? P : 'white', color: hot ? 'white' : P, border: hot ? 'none' : `1px solid ${P}`, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View Result</button>
        </div>
      </StateCard>
    )
  }

  // ── T4 · Upcoming-Urgent (≤14 days) ──
  if (id === 'upcoming_urgent') {
    const closingSoon = (test.regCloses ?? 99) <= 3
    return (
      <StateCard accent={P}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={closingSoon ? RED_L : PL} color={closingSoon ? RED : P}>{closingSoon ? `Registration closes in ${test.regCloses}d` : 'Registering'}</Pill>
          <span style={{ fontSize: 11, color: T3 }}>{timeOf(test)}{test.daysOut != null ? ` · in ${test.daysOut}d` : ''}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: 10, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12, color: T2 }}>{test.subtitle || 'Registration is open.'}</span>
          <button onClick={() => !isRegistered && onRegister?.(test)} style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 20, background: isRegistered ? GL : P, color: isRegistered ? G : 'white', border: 'none', fontSize: 12, fontWeight: 600, cursor: isRegistered ? 'default' : 'pointer' }}>{isRegistered ? '✓ Registered' : 'Register'}</button>
        </div>
      </StateCard>
    )
  }

  // ── Registration Closed — shown to non-registrants once the window opens ──
  if (id === 'registration_closed') {
    return (
      <StateCard accent={T3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={BG2} color={T3}>Registration Closed</Pill>
          <span style={{ fontSize: 11, color: T3 }}>{timeOf(test)}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: 8, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>Registration for this test has closed. Check Upcoming Tests for what you can still register for.</div>
      </StateCard>
    )
  }

  // ── Cancelled / Postponed — any stage ──
  if (id === 'cancelled') {
    return (
      <StateCard accent={RED}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={RED_L} color={RED}>Cancelled / Postponed</Pill>
          <span style={{ fontSize: 11, color: T3 }}>{timeOf(test)}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: 8, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>This test has been cancelled or postponed. We've notified you on WhatsApp — the new schedule will appear here once confirmed.</div>
      </StateCard>
    )
  }

  // ── Paywall gate — free-tier taps Register on a paid test ──
  if (id === 'paywall') {
    return (
      <StateCard accent={PD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={PL} color={PD} dot={false}>🔒 Premium test</Pill>
          <span style={{ fontSize: 11, color: T3 }}>{timeOf(test)}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: 10, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>Unlock to register and attempt this test.</span>
          <button onClick={() => onRegister?.(test)} style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 20, background: PD, color: 'white', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Unlock</button>
        </div>
      </StateCard>
    )
  }

  // ── Missed — closed, no-show ──
  if (id === 'missed') {
    return (
      <StateCard accent={T3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <Pill bg={BG2} color={T3}>Missed</Pill>
          <span style={{ fontSize: 11, color: T3 }}>{timeOf(test)}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T1, marginBottom: 8, lineHeight: 1.4 }}>{titleOf(test)}</div>
        <div style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>This test has closed and you didn't attempt it. It won't reopen — check Upcoming Tests for what's next.</div>
      </StateCard>
    )
  }

  return null
}
