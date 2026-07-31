// The "bucket" anti-cheating shuffle: two students attempting the same test see the same
// questions in a different order, and each question's options in a different order, so
// answers can't be shared by position ("pick option 3"). The underlying question bank
// (QUESTIONS array) is never mutated — only the per-attempt presentation order is.
//
// The shuffle can be SEEDED: passing a numeric seed reproduces the exact same order, which
// lets a saved/paused attempt resume with answers still aligned to the same questions.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Keep questions that belong to the same case (shared `caseId`) contiguous and in
// `caseIndex` order, so a case scenario and its linked questions are never split apart.
function groupCases(ids, questions) {
  const seen = new Set(), out = []
  for (const id of ids) {
    const cid = questions[id]?.caseId
    if (cid == null) { out.push(id); continue }
    if (seen.has(cid)) continue
    seen.add(cid)
    out.push(...ids.filter(x => questions[x]?.caseId === cid).sort((a, b) => (questions[a].caseIndex || 0) - (questions[b].caseIndex || 0)))
  }
  return out
}

export function shuffleForAttempt(questions, sections, seed) {
  const rng = seed == null ? Math.random : mulberry32(seed >>> 0)
  const shuffledQuestions = questions.map(q => {
    const order = shuffled(q.options.map((_, i) => i), rng)
    const nq = { ...q, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) }
    if (q.hi?.options) nq.hi = { ...q.hi, options: order.map(i => q.hi.options[i]) } // keep bilingual options aligned
    return nq
  })
  const shuffledSections = sections.map(sec => ({ ...sec, ids: groupCases(shuffled(sec.ids, rng), questions) }))
  return { questions: shuffledQuestions, sections: shuffledSections }
}
