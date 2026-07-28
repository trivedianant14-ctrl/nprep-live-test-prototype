// Supporting content for the NPrep "Prep Mode" practice interface — tags, cohort option
// stats, and explanations. Keyed by question text so it survives the per-attempt shuffle
// (which reorders questions/options but never changes q.text). Real explanations are
// provided for a representative set; everything else gets a clean, honest fallback.

const TAG_POOL = ['NORCET 2025', 'AIIMS 2021', 'PYQ 2026', 'NORCET 2024', 'AIIMS 2023', 'NORCET 2022']

// Stable pseudo-random in [0,1) from an integer seed
const seeded = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

export function practiceTags(globalIdx) {
  const count = 1 + Math.floor(seeded(globalIdx * 3.1) * 3) // 1–3 tags
  const start = Math.floor(seeded(globalIdx + 1) * TAG_POOL.length)
  return Array.from({ length: count }, (_, i) => TAG_POOL[(start + i) % TAG_POOL.length])
}

// Cohort "% who chose this option" — deterministic, correct option weighted highest, sums 100.
export function optionStats(q, globalIdx) {
  const raw = q.options.map((_, i) => 0.15 + seeded(globalIdx * 7 + i * 13))
  raw[q.answer] += 1.3
  const sum = raw.reduce((a, b) => a + b, 0)
  const pct = raw.map(r => Math.round((r / sum) * 100))
  pct[q.answer] += 100 - pct.reduce((a, b) => a + b, 0) // fix rounding drift onto the correct option
  return pct
}

// Real explanations for a representative set (mostly Section A, which a demo hits often).
const EXPLANATIONS = {
  'The best method to prevent hospital-acquired infection is:':
    'Hand hygiene is the single most effective measure to prevent healthcare-associated infections. It breaks the chain of transmission at the most common point — the hands of healthcare workers — which is why the WHO "5 Moments for Hand Hygiene" underpins every infection-control programme.',
  'The first step in the nursing process is:':
    'The nursing process runs Assessment → Diagnosis → Planning → Implementation → Evaluation (ADPIE). Assessment comes first: you must gather and analyse patient data before any diagnosis or care plan can be made.',
  'The purpose of informed consent is to:':
    'Informed consent protects patient autonomy — the ethical and legal right of a competent patient to make voluntary, informed decisions about their own care after understanding the risks, benefits and alternatives.',
  'Normal adult respiratory rate (breaths per minute) is:':
    'The normal adult resting respiratory rate is 12–20 breaths per minute. Below 12 is bradypnoea and above 20 is tachypnoea, both of which warrant assessment.',
  "Maslow's hierarchy places which of the following at the base (most basic level)?":
    "Physiological needs (air, water, food, elimination, sleep) form the base of Maslow's hierarchy. These must be met before higher needs like safety, belonging, esteem and self-actualisation can be addressed — a key principle for prioritising nursing care.",
  'Normal adult systolic blood pressure range (mmHg) is:':
    'A normal adult systolic blood pressure is 100–140 mmHg (commonly cited as <120 optimal). Persistent readings ≥140/90 indicate hypertension.',
  'The Glasgow Coma Scale (GCS) maximum score is:':
    'The GCS ranges from 3 (deep coma) to a maximum of 15 (fully alert), scoring Eye (4), Verbal (5) and Motor (6) responses. A score ≤8 generally indicates a need for airway protection.',
  "The ethical principle of 'do no harm' is referred to as:":
    "Non-maleficence is the duty to 'do no harm'. It is distinct from beneficence (actively doing good), autonomy (respecting choice) and justice (fair distribution of care).",
  'Which electrolyte is the PRIMARY intracellular cation?':
    'Potassium (K⁺) is the primary intracellular cation, whereas sodium (Na⁺) is the main extracellular cation. This gradient, maintained by the Na⁺/K⁺ pump, drives nerve and muscle activity — making potassium imbalances dangerous to the heart.',
  'A patient rates pain as 8/10 on the Numeric Rating Scale. This indicates:':
    'On the 0–10 Numeric Rating Scale, 1–3 is mild, 4–6 moderate and 7–10 severe pain. A score of 8/10 is severe and warrants prompt intervention and reassessment.',
  'Normal adult resting pulse rate (beats per minute) is:':
    'The normal adult resting pulse is 60–100 bpm. Below 60 is bradycardia and above 100 is tachycardia (in a resting adult).',
  'Normal urine output in an adult is approximately:':
    'Adequate adult urine output is ~30–50 mL/hr (about 0.5–1 mL/kg/hr). Output below 30 mL/hr (oliguria) is an early warning sign of hypovolaemia or renal compromise.',
}

// Returns { text, generic } — generic:true marks the honest placeholder used when a real
// explanation hasn't been authored for that question yet.
export function explanationFor(q) {
  const real = EXPLANATIONS[q.text]
  if (real) return { text: real, generic: false }
  return {
    text: `The correct answer is “${q.options[q.answer]}”. A detailed explanation and “why the other options are wrong” breakdown appears here in the full NPrep question bank.`,
    generic: true,
  }
}
