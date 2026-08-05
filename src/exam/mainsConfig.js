import { MAINS_QUESTIONS } from './norcetMains'
import { PRELIMS_QUESTIONS } from './norcetPrelims'

// NORCET exam configs built from the actual NORCET 9 previous-year papers (PW).
//   Mains  — 100 clinical-nursing MCQs, regrouped into 5 sections of 20.
//   Prelims — 80 MCQs (nursing + a General-Ability block: GK, English, reasoning, aptitude),
//             regrouped into 4 sections of 20, in the paper's original order.
// Marking is the NORCET convention (+1 correct / −1/3 wrong). Section names aren't shown in
// the interface (it renders "Section A" etc.). 20-per-section matches DesktopExam's numbering.
export const MAINS_SECTION_SECONDS = 45 * 60
export const PRELIMS_SECTION_SECONDS = 27 * 60

// A linked case scenario (neonatal set) that leads Section A of the Mains paper — the three
// questions share a caseId so DesktopExam shows them under one "Case Study" passage. English
// only: the NORCET desktop interface renders in English.
const NEONATE_PASSAGE = "A full-term male neonate is delivered at 39 weeks by normal vaginal delivery. At 1 minute he is crying vigorously and moving all four limbs; the heart rate is 130/min, with a pink trunk and slightly bluish hands and feet. The mother is a primigravida with an uncomplicated pregnancy."
const MAINS_CASE = [
  { text: "Normal birth weight of a full-term neonate is:", options: ["1.5–2.0 kg", "2.5–4.0 kg", "4.5–5.5 kg", "5.5–6.5 kg"], answer: 1, caseId: 'neonate', caseIndex: 1, caseTotal: 3, passage: NEONATE_PASSAGE },
  { text: "An Apgar score of 7–10 at 5 minutes indicates:", options: ["Severe birth asphyxia requiring resuscitation", "Moderate asphyxia", "Good condition — routine care required", "Stillbirth"], answer: 2, caseId: 'neonate', caseIndex: 2, caseTotal: 3, passage: NEONATE_PASSAGE },
  { text: "BCG vaccine is administered at:", options: ["6 weeks of age", "At birth", "9 months", "18 months"], answer: 1, caseId: 'neonate', caseIndex: 3, caseTotal: 3, passage: NEONATE_PASSAGE },
]

function chunkSections(questions, count) {
  const per = Math.ceil(questions.length / count)
  const ids = questions.map((_, i) => i)
  return Array.from({ length: count }, (_, i) => {
    const letter = ['A', 'B', 'C', 'D', 'E'][i]
    return { id: letter, name: `Section ${letter}`, fullName: `Section ${letter}`, ids: ids.slice(i * per, (i + 1) * per) }
  }).filter(s => s.ids.length)
}

export function buildMainsConfig() {
  // Lead with the case scenario so the three linked questions land at the start of Section A,
  // then trim the tail to hold the paper at 100 questions (5 × 20) — DesktopExam's palette
  // numbering (curSec * 20 + i) assumes exactly 20 per section.
  const questions = [...MAINS_CASE, ...MAINS_QUESTIONS].slice(0, MAINS_QUESTIONS.length)
  return {
    questions,
    sections: chunkSections(questions, 5),
    meta: {
      provider: 'NPrep', series: 'NASHTA', stage: 'Mains',
      candidate: 'Anant Trivedi', examDate: '13-Jun-2026',
      totalMarks: questions.length, correctMarks: 1, wrongMarks: -0.33,
      sectionSeconds: MAINS_SECTION_SECONDS,
      shortName: 'NASHTA — Mains',
    },
  }
}

export function buildPrelimsConfig() {
  return {
    questions: PRELIMS_QUESTIONS,
    sections: chunkSections(PRELIMS_QUESTIONS, 4),
    meta: {
      provider: 'NPrep', series: 'NASHTA', stage: 'Prelims',
      candidate: 'Anant Trivedi', examDate: '13-Jun-2026',
      totalMarks: PRELIMS_QUESTIONS.length, correctMarks: 1, wrongMarks: -0.33,
      sectionSeconds: PRELIMS_SECTION_SECONDS,
      shortName: 'NASHTA — Prelims',
    },
  }
}
