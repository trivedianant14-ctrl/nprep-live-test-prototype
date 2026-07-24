// Computes which phase a live test is actually in right now, from real start/end
// timestamps — the homepage banner renders off this instead of a hardcoded "LIVE"
// state, so it automatically becomes accurate as the test's real lifecycle unfolds:
// registration open -> starting soon -> live -> ended -> results declared.
const STARTING_SOON_WINDOW_MS = 15 * 60000
const RESULTS_DELAY_MS = 20 * 60000 // grace period after end before "results declared"

export function getLifecyclePhase(test, now = new Date()) {
  const t = now.getTime()
  const start = test.startAt.getTime()
  const end = test.endAt.getTime()
  if (t < start - STARTING_SOON_WINDOW_MS) return 'upcoming'
  if (t < start) return 'starting_soon'
  if (t <= end) return 'live'
  if (t < end + RESULTS_DELAY_MS) return 'ended'
  return 'results'
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = n => String(n).padStart(2, '0')
  return h > 0 ? `${h}h ${pad(m)}m` : `${pad(m)}:${pad(s)}`
}
