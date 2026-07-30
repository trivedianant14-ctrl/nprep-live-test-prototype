import { QUESTIONS } from './examData'

// NORCET Mains (Stage II) format — researched from AIIMS NORCET pattern:
//   4 sections · 160 MCQs (40 per section) · 160 marks · 180 min (45 min/section)
//   +1 correct / −1/3 wrong · case-scenario-based competency questions.
// The prototype reuses the shared 100-question bank regrouped into 4 sections (real Mains
// is 160 Q — a content gap; the interface, section structure and format are faithful).
export const MAINS_SECTION_SECONDS = 45 * 60

const MAINS_SECTION_NAMES = [
  'Clinical Nursing — Case Scenarios',
  'Medical-Surgical & Critical Care',
  'Community & Child Health',
  'Management, Research & GK',
]

export function buildMainsConfig() {
  const per = Math.ceil(QUESTIONS.length / 4)
  const ids = QUESTIONS.map((_, i) => i)
  const sections = MAINS_SECTION_NAMES.map((name, i) => {
    const letter = ['A', 'B', 'C', 'D'][i]
    return { id: letter, name, fullName: `Section ${letter} — ${name}`, ids: ids.slice(i * per, (i + 1) * per) }
  })
  const meta = {
    provider: 'NPrep', series: 'NASHTA', stage: 'Mains',
    candidate: 'Anant Trivedi', examDate: '13-Jun-2026',
    totalMarks: QUESTIONS.length, correctMarks: 1, wrongMarks: -0.33,
    sectionSeconds: MAINS_SECTION_SECONDS,
    shortName: 'NASHTA — Mains',
  }
  return { questions: QUESTIONS, sections, meta }
}
