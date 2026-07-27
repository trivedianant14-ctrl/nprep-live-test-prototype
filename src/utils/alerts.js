// Derives the home-screen "actionable alerts" from existing test data — no new data
// model. Each alert is time-sensitive and carries one clear action. Sorted most-urgent
// first; callers cap how many they show and track dismissals.
//
// Alert kinds:
//   reg    — registration for an unregistered test closes soon (≤2 days)  → Register
//   daily  — today's daily test is live and not yet attempted             → Attempt
//   start  — a test you're registered for starts soon (≤2 days)           → info
export function computeAlerts({ upcoming, registeredIds, dailyLive, userTier }) {
  const when = (d) => (d <= 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`)
  const alerts = []

  upcoming.forEach(t => {
    // Free-tier diagnostics register over WhatsApp, not in-app — skip those reg alerts.
    if (userTier === 'free' && t.type === 'diagnostic') return
    if (!registeredIds.has(t.id) && t.regCloses <= 2) {
      alerts.push({
        id: `reg-${t.id}`, kind: 'reg', test: t,
        tone: t.regCloses <= 1 ? 'red' : 'amber',
        urgency: t.regCloses, // lower = sooner
        message: `Registration for ${t.fullName} closes ${when(t.regCloses)}`,
      })
    }
    if (registeredIds.has(t.id) && t.daysOut <= 2) {
      alerts.push({
        id: `start-${t.id}`, kind: 'start', test: t, tone: 'blue',
        urgency: 5 + t.daysOut,
        message: `${t.fullName} starts ${when(t.daysOut)} — you're registered`,
      })
    }
  })

  if (dailyLive) {
    alerts.push({ id: 'daily-live', kind: 'daily', tone: 'red', urgency: 1.5, message: `Today's daily test is live now` })
  }

  return alerts.sort((a, b) => a.urgency - b.urgency)
}
