import { QUESTIONS, SECTIONS, EXAM_META } from './examData'

// Builds a self-contained question/section set for a student-created test, reusing the
// same 100-question bank and the same ExamScreen engine as the official live test — a
// custom test is just a different slice of the same content, not a separate system.
export function buildCustomTest({ mode, selectedSectionIds, testName }) {
  const chosenSections = mode === 'full_mock'
    ? SECTIONS
    : SECTIONS.filter(s => selectedSectionIds.includes(s.id))

  const questions = []
  const sections = chosenSections.map(sec => {
    const startIdx = questions.length
    sec.ids.forEach(gIdx => questions.push(QUESTIONS[gIdx]))
    return { id: sec.id, name: sec.name, fullName: sec.fullName, ids: Array.from({ length: sec.ids.length }, (_, i) => startIdx + i) }
  })

  const totalQuestions = questions.length
  const totalMinutes = Math.round(totalQuestions * 0.9) // same ratio as the official exam: 100Q / 90min
  const defaultName = mode === 'full_mock' ? 'My Full Mock Test' : 'My Subject-wise Test'

  const meta = {
    ...EXAM_META,
    name: testName?.trim() || defaultName,
    shortName: testName?.trim() || defaultName,
    totalMarks: totalQuestions,
  }

  return { questions, sections, meta, totalQuestions, totalMinutes }
}
