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

function chunkSections(questions, count) {
  const per = Math.ceil(questions.length / count)
  const ids = questions.map((_, i) => i)
  return Array.from({ length: count }, (_, i) => {
    const letter = ['A', 'B', 'C', 'D', 'E'][i]
    return { id: letter, name: `Section ${letter}`, fullName: `Section ${letter}`, ids: ids.slice(i * per, (i + 1) * per) }
  }).filter(s => s.ids.length)
}

export function buildMainsConfig() {
  return {
    questions: MAINS_QUESTIONS,
    sections: chunkSections(MAINS_QUESTIONS, 5),
    meta: {
      provider: 'NPrep', series: 'NASHTA', stage: 'Mains',
      candidate: 'Anant Trivedi', examDate: '13-Jun-2026',
      totalMarks: MAINS_QUESTIONS.length, correctMarks: 1, wrongMarks: -0.33,
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
