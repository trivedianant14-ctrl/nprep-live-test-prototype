// Syllabus content for the "View Syllabus" sheet on test cards (the PW/Unacademy pattern).
// A subject test shows just its own subject's topics; a full mock / diagnostic shows the
// whole NORCET syllabus, subject by subject.

export const SUBJECT_NAMES = {
  FON: 'Fundamentals of Nursing',
  MSN: 'Medical-Surgical Nursing',
  CHN: 'Community Health Nursing',
  OBG: 'Obstetrics & Gynaecology',
  CHILD: 'Child Health Nursing',
  MHN: 'Mental Health Nursing',
  PHARMA: 'Pharmacology',
  ANAT: 'Anatomy & Physiology',
  GK: 'GK, Aptitude & Reasoning',
}

export const SUBJECT_TOPICS = {
  FON: ['Nursing process & documentation', 'Vital signs & health assessment', 'Infection control & asepsis', 'Hygiene, comfort & safety', 'Nutrition & fluid–electrolyte balance', 'Medication administration', 'Wound care & bandaging'],
  MSN: ['Cardiovascular disorders', 'Respiratory disorders', 'GI & hepatobiliary', 'Renal & genitourinary', 'Endocrine & metabolic', 'Neurological disorders', 'Oncology & palliative care', 'Perioperative nursing'],
  CHN: ['Concepts of community health', 'Epidemiology & biostatistics', 'National health programmes', 'Immunization & UIP', 'Environmental health & sanitation', 'Family health & demography'],
  OBG: ['Antenatal care', 'Labour & delivery', 'Postnatal care', 'High-risk pregnancy', 'Family planning & contraception', 'Neonatal care', 'Gynaecological disorders'],
  CHILD: ['Growth & development', 'Neonatal care & IMNCI', 'Immunization schedule', 'Common childhood illnesses', 'Nutritional deficiencies', 'Paediatric emergencies'],
  MHN: ['Concepts of mental health', 'Schizophrenia & psychotic disorders', 'Mood & anxiety disorders', 'Substance-use disorders', 'Psychiatric emergencies', 'Therapeutic communication'],
  PHARMA: ['General pharmacology', 'Autonomic & cardiovascular drugs', 'Antimicrobials', 'CNS drugs', 'Drug calculations & safety'],
  ANAT: ['Cell, tissues & systems overview', 'Musculoskeletal', 'Cardiovascular & respiratory', 'Nervous system', 'Endocrine & reproductive'],
  GK: ['Current affairs', 'General science', 'Quantitative aptitude', 'Logical reasoning'],
}

// Order used when a test covers the whole syllabus (mocks / diagnostics).
const FULL_ORDER = ['FON', 'MSN', 'CHILD', 'CHN', 'OBG', 'MHN', 'PHARMA', 'GK']

function detectSubject(text) {
  const t = text.toLowerCase()
  if (/\bfon\b|fundamental/.test(t)) return 'FON'
  if (/\bmsn\b|medical.?surg/.test(t)) return 'MSN'
  if (/\bchn\b|community health/.test(t)) return 'CHN'
  if (/\bobg\b|obstetric|gynaec|gynec/.test(t)) return 'OBG'
  if (/child|p[ae]diatric/.test(t)) return 'CHILD'
  if (/mental|psychiatr/.test(t)) return 'MHN'
  if (/pharma/.test(t)) return 'PHARMA'
  if (/anatomy|physiolog/.test(t)) return 'ANAT'
  return null
}

// Returns { scope: 'subject' | 'full', groups: [{ code, subject, topics }] }
export function syllabusFor(test) {
  const hay = `${test.fullName || ''} ${test.subtitle || ''}`
  const single = detectSubject(hay)
  const isSubjectTest = test.type === 'subject_preboard' || (single && !/full|mock|nashta|diagnostic|grand|simulation|3rd year|third/i.test(hay))
  if (single && isSubjectTest) {
    return { scope: 'subject', groups: [{ code: single, subject: SUBJECT_NAMES[single], topics: SUBJECT_TOPICS[single] }] }
  }
  return { scope: 'full', groups: FULL_ORDER.map(code => ({ code, subject: SUBJECT_NAMES[code], topics: SUBJECT_TOPICS[code] })) }
}
