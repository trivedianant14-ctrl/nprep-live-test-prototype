// Live Test home banner/carousel priority — implements the Whimsical "One Cycle
// Lifecycle Flow". The hero shows ONE winning state chosen across every live/upcoming/
// past test by tier, then a tiebreak inside the tier. If nothing qualifies → zero state
// (hero hidden, Past Tests shown).
//
// Tiers (lower number = higher priority):
//   T1 attempt_now      — a test whose attempt window is live. Always wins.
//   T2 save_attempt     — registered, window live, not started (the T–2h nudge). Overrides Upcoming/Result-Out.
//   T3 result_hot       — result declared within the hot window (first N days).
//   T4 upcoming_urgent  — ≤14 days out, or after a Result-Out hot window ends.
//   T5 result_aged      — older result, scroll-only.
export const TIER = { attempt_now: 1, save_attempt: 2, result_hot: 3, upcoming_urgent: 4, result_aged: 5 }
export const RESULT_HOT_DAYS = 3
export const URGENT_DAYS = 14

// Series weight: full-length mocks dominate subject pre-boards (Full=1.0, Subject=0.25).
function seriesWeight(test) { return test?.type === 'subject_preboard' ? 0.25 : 1.0 }

// Upcoming priority score = (Date×0.7 + Reg×0.3) × SeriesWt, urgency = nearer is higher.
export function upcomingScore(test) {
  const dateUrg = 1 / (1 + (test.daysOut ?? 30))
  const regUrg = 1 / (1 + (test.regCloses ?? 30))
  return (dateUrg * 0.7 + regUrg * 0.3) * seriesWeight(test)
}

// Ranked hero candidates from the current data + user context. out[0] is what the hero
// shows; the rest are the "carousel" behind it (Live Test section can show all).
export function rankHeroCandidates({ liveTest, livePhase, liveRegistered = true, liveAttempted = false, upcoming = [], past = [] }) {
  const out = []
  if (liveTest) {
    if (livePhase === 'live') {
      // Registered-but-not-started near close is the Save-Attempt case, but Attempt-Now (T1) still wins the hero.
      out.push({ id: 'attempt_now', tier: TIER.attempt_now, test: liveTest, tie: liveTest.endAt ? liveTest.endAt.getTime() : 0 })
    } else if (livePhase === 'starting_soon') {
      out.push({ id: 'starting_soon', tier: TIER.attempt_now + 0.5, test: liveTest, tie: 0 })
    } else if (livePhase === 'ended') {
      out.push({ id: 'results_waiting', tier: TIER.result_hot + 0.4, test: liveTest, tie: 0 })
    } else if (livePhase === 'results') {
      out.push(liveAttempted
        ? { id: 'result_hot', tier: TIER.result_hot, test: liveTest, tie: 0 }
        : { id: 'missed', tier: TIER.result_aged + 0.5, test: liveTest, tie: 0 })
    }
  }
  // Upcoming — only ≤14 days is a hero candidate (T4); the rest live in the Upcoming list.
  upcoming.filter(t => (t.daysOut ?? 99) <= URGENT_DAYS)
    .forEach(t => out.push({ id: 'upcoming_urgent', tier: TIER.upcoming_urgent, test: t, tie: -upcomingScore(t) }))
  // Past attempted results — the most recent is "hot", the rest aged.
  past.filter(t => t.attempted && t.score != null)
    .forEach((t, i) => out.push(i === 0
      ? { id: 'result_hot', tier: TIER.result_hot, test: t, tie: 1 } // slightly behind a fresh live result
      : { id: 'result_aged', tier: TIER.result_aged, test: t, tie: i }))
  out.sort((a, b) => a.tier - b.tier || a.tie - b.tie)
  return out
}

// The scenarios the preview selector can force, so every state is demoable even though
// live data only naturally exercises one path at a time.
export const BANNER_SCENARIOS = [
  { id: 'auto', label: 'Auto', tier: null },
  { id: 'attempt_now', label: 'T1 · Attempt Now', tier: 1 },
  { id: 'save_attempt', label: 'T2 · Save-Attempt', tier: 2 },
  { id: 'result_hot', label: 'T3 · Result Out (hot)', tier: 3 },
  { id: 'upcoming_urgent', label: 'T4 · Upcoming-Urgent', tier: 4 },
  { id: 'result_aged', label: 'T5 · Result (aged)', tier: 5 },
  { id: 'starting_soon', label: 'Starting Soon', tier: null },
  { id: 'results_waiting', label: 'Results Waiting', tier: null },
  { id: 'registration_closed', label: 'Registration Closed', tier: null },
  { id: 'cancelled', label: 'Cancelled', tier: null },
  { id: 'paywall', label: 'Paywall Gate', tier: null },
  { id: 'missed', label: 'Missed', tier: null },
  { id: 'zero', label: 'Zero State', tier: null },
]

// Build a representative hero state for a forced preview scenario.
export function previewHeroState(scenarioId, { liveTest, upcomingSample, pastSample }) {
  if (scenarioId === 'zero') return null
  const t = liveTest
  switch (scenarioId) {
    case 'attempt_now': return { id: 'attempt_now', tier: 1, test: t }
    case 'save_attempt': return { id: 'save_attempt', tier: 2, test: t }
    case 'starting_soon': return { id: 'starting_soon', tier: 1, test: t }
    case 'results_waiting': return { id: 'results_waiting', tier: 3, test: t }
    case 'result_hot': return { id: 'result_hot', tier: 3, test: pastSample || t }
    case 'result_aged': return { id: 'result_aged', tier: 5, test: pastSample || t }
    case 'missed': return { id: 'missed', tier: 5, test: t }
    case 'upcoming_urgent': return { id: 'upcoming_urgent', tier: 4, test: upcomingSample || t }
    case 'registration_closed': return { id: 'registration_closed', tier: 4, test: upcomingSample || t }
    case 'cancelled': return { id: 'cancelled', tier: 1, test: upcomingSample || t }
    case 'paywall': return { id: 'paywall', tier: 4, test: upcomingSample || t }
    default: return null
  }
}
