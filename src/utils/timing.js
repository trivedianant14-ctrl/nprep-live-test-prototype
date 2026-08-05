// Per-question time analysis for the solutions review (Testbook/Toppr pattern: your time
// vs the average/topper time on each question). The student's time is captured for real
// during the attempt; the topper time is synthesised (no real cohort in the prototype) but
// scales with question length, so image/scenario questions read as legitimately slower.
export function topperSeconds(q, gIdx = 0) {
  const len = (q?.text?.length || 60) + (q?.passage?.length || 0) + ((q?.options || []).reduce((a, o) => a + (o?.length || 0), 0))
  const base = 20 + Math.round(len / 11)
  const jitter = ((gIdx * 37) % 14) - 5
  return Math.max(14, Math.min(95, base + jitter))
}

export function fmtDur(sec) {
  sec = Math.max(0, Math.round(sec))
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60), s = sec % 60
  return s ? `${m}m ${s}s` : `${m}m`
}

// Colour signal for the pace vs the topper. Green ≈ on/faster, amber = a bit slow, red = well over.
export function paceColor(yourSec, topSec) {
  if (yourSec <= topSec * 1.15) return '#189A57'
  if (yourSec <= topSec * 2) return '#C98A1B'
  return '#E5484D'
}
