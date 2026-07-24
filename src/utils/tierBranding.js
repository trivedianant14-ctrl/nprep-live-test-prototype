// The same Diagnostic test is two different products depending on who's looking at it:
// a free member sees it as a "Scholarship Test" delivered only over WhatsApp (no in-app
// exam), while a paid member sees it as the real in-app "Diagnostic Test". Nothing about
// the underlying test changes — only its name, subtitle, delivery channel, and report
// card label do. Applied once here rather than special-cased in every screen that
// happens to render a diagnostic-type test.
export function brandForTier(test, tier) {
  if (test.type !== 'diagnostic') return test
  if (tier !== 'free') return { ...test, reportLabel: 'Diagnostic Report' }

  const n = (test.fullName.match(/(\d+)/) || [])[1]
  return {
    ...test,
    fullName: n ? `Scholarship Test ${n}` : 'Scholarship Test',
    subtitle: 'Free eligibility screening · Sent via WhatsApp',
    deliveryChannel: 'whatsapp',
    reportLabel: 'Scholarship Report',
  }
}

export function brandListForTier(list, tier) {
  return list.map(t => brandForTier(t, tier))
}
