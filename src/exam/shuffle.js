// The "bucket" anti-cheating shuffle: two students attempting the same test see the same
// questions in a different order, and each question's options in a different order, so
// answers can't be shared by position ("pick option 3"). The underlying question bank
// (QUESTIONS array) is never mutated — only the per-attempt presentation order is.
function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function shuffleForAttempt(questions, sections) {
  const shuffledQuestions = questions.map(q => {
    const order = shuffled(q.options.map((_, i) => i))
    const nq = { ...q, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) }
    if (q.hi?.options) nq.hi = { ...q.hi, options: order.map(i => q.hi.options[i]) } // keep bilingual options aligned
    return nq
  })
  const shuffledSections = sections.map(sec => ({ ...sec, ids: shuffled(sec.ids) }))
  return { questions: shuffledQuestions, sections: shuffledSections }
}
