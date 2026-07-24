// ─── Design tokens (shared across screens) ─────────────────────────────────
export const P = '#534AB7', PL = '#EEEDFE', PB = '#AFA9EC', PD = '#3C3489'
export const G = '#3B6D11', GL = '#EAF3DE', GB = '#97C459'
export const A = '#633806', AL = '#FAEEDA', AB = '#FAC775'
export const T1 = '#1a1a2e', T2 = '#5a5a78', T3 = '#9898b0'
export const BD = '#e8e8f2', BG2 = '#f5f5fb'

// ─── Series (the top-level exam-body tiles from the wireframe) ────────────
// NORCET bundles four related test types under one tile (it's the one exam body
// with enough variety to need its own sub-filter once you drill in); RRB and KGMU
// are single-pattern bodies so they go straight to a flat list; Scholarship is a
// placeholder tile — content doesn't exist yet, so it's disabled, not empty.
export const SERIES = [
  {
    id: 'norcet', label: 'Norcet Test Series', tagline: 'Subject Preboards, Diagnostics & Full Mocks',
    bg: PL, color: PD, border: PB, hasTypes: true,
  },
  {
    id: 'rrb', label: 'RRB Test Series', tagline: 'RRB Nursing exam pattern',
    bg: AL, color: A, border: AB, hasTypes: false,
  },
  {
    id: 'kgmu', label: 'KGMU Test Series', tagline: 'KGMU recruitment pattern',
    bg: '#EAF1FF', color: '#1E3A8A', border: '#93C5FD', hasTypes: false,
  },
  {
    id: 'scholarship', label: 'Scholarship Test', tagline: 'Merit-based scholarship exam',
    bg: '#F3F3F3', color: '#6B7280', border: '#D1D5DB', hasTypes: false, comingSoon: true,
  },
]

// Sub-types within the NORCET series (this is what solves "subject and full tests
// blended together" — each type gets its own lane once a student drills into NORCET)
export const NORCET_TYPES = [
  { id: 'subject_preboard', label: 'Subject Preboard' },
  { id: 'diagnostic',       label: 'Diagnostic' },
  { id: 'third_year',       label: '3rd Year Preboard' },
  { id: 'nashta_mains',     label: 'NASHTA Mains' },
]
export const NORCET_TYPE_LABEL = NORCET_TYPES.reduce((acc, t) => { acc[t.id] = t.label; return acc }, {})

// The featured live test. Real start/end timestamps (not just a display string) so its
// homepage banner can compute its own lifecycle phase automatically — upcoming, starting
// soon, live, ended, results — instead of being hardcoded to always say "LIVE".
// Defaults to "started 10 min ago, ends in 80" so the banner opens on the live phase.
const _now = new Date()
export const LIVE_TEST = {
  id: 0,
  name: 'NORCET 10 — Stage I',
  timeLabel: 'Today, 3:00 PM – 4:30 PM',
  durationLabel: '90 min', marks: '100', enrolled: 2847,
  startAt: new Date(_now.getTime() - 10 * 60000),
  endAt: new Date(_now.getTime() + 80 * 60000),
}

// ─── Upcoming tests, grouped by series ──────────────────────────────────────
// regCloses = days until registration closes, independent of daysOut (days until the
// test itself starts). A test can be "in 38 days" and still read as urgent if the
// registration window is closing in 2 — that distinction is what creates real urgency.
export const UPCOMING = {
  norcet: [
    { id: 101, type: 'subject_preboard', recommended: true,  fullName: 'Fundamentals of Nursing',         subtitle: 'FON · NORCET Preboard',      date: 'Sun, 26 Jul', daysOut: 3,  regCloses: 1, duration: '60 min',  marks: '100', enrolled: 743,  registered: false },
    { id: 102, type: 'subject_preboard', recommended: false, fullName: 'Medical Surgical Nursing',        subtitle: 'MSN · NORCET Preboard',      date: 'Wed, 29 Jul', daysOut: 6,  regCloses: 3, duration: '60 min',  marks: '100', enrolled: 1203, registered: false },
    { id: 103, type: 'diagnostic',       recommended: true,  fullName: 'NORCET Diagnostic Test 4',        subtitle: 'Full syllabus · Baseline assessment', date: 'Thu, 6 Aug', daysOut: 14, regCloses: 4, duration: '90 min', marks: '150', enrolled: 967, registered: false },
    { id: 104, type: 'third_year',       recommended: false, fullName: '3rd Year Nursing Pre-Board 3',    subtitle: 'B.Sc Nursing · 3rd Year Preboard', date: 'Tue, 11 Aug', daysOut: 19, regCloses: 5, duration: '90 min', marks: '150', enrolled: 412, registered: false },
    { id: 105, type: 'nashta_mains',     recommended: true,  fullName: 'NASHTA 4 for NORCET',             subtitle: 'Full-length NORCET simulation · All subjects', date: 'Sat, 29 Aug', daysOut: 37, regCloses: 2, duration: '120 min', marks: '200', enrolled: 2103, registered: true },
  ],
  rrb: [
    { id: 201, recommended: true, fullName: 'RRB NASHTA 2',    subtitle: 'RRB Nursing · Full Mock', date: 'Sat, 15 Aug', daysOut: 23, regCloses: 6, duration: '120 min', marks: '200', enrolled: 1502, registered: false },
    { id: 202, recommended: false, fullName: 'RRB Grand Test 5', subtitle: 'RRB Nursing · Full Mock', date: 'Sat, 5 Sep',  daysOut: 44, regCloses: 3, duration: '120 min', marks: '200', enrolled: 987, registered: false },
  ],
  kgmu: [
    { id: 301, recommended: true, fullName: 'KGMU NASHTA 3', subtitle: 'KGMU Pattern · Full-length simulation', date: 'Sun, 9 Aug', daysOut: 17, regCloses: 4, duration: '120 min', marks: '200', enrolled: 1288, registered: false },
  ],
}

// ─── Past tests, grouped by series ─────────────────────────────────────────
export const PAST = {
  norcet: [
    { id: 501, type: 'nashta_mains',     fullName: 'NORCET 9 — Stage I',      subtitle: 'Full Mock · Pre-Stage Simulation', date: '3 Jul 2026',  ts: new Date('2026-07-03'), dur: '90 min',  mks: '100', score: '81',  attempted: true  },
    { id: 502, type: 'subject_preboard', fullName: 'Fundamentals of Nursing', subtitle: 'FON · NORCET Preboard',            date: '25 Jun 2026', ts: new Date('2026-06-25'), dur: '60 min',  mks: '100', score: null,  attempted: false },
    { id: 503, type: 'nashta_mains',     fullName: 'NASHTA 3 for NORCET',     subtitle: 'Full-length NORCET simulation',    date: '10 Jun 2026', ts: new Date('2026-06-10'), dur: '120 min', mks: '200', score: '158', attempted: true  },
    { id: 504, type: 'diagnostic',       fullName: 'NORCET Diagnostic Test 3', subtitle: 'Full syllabus · Baseline assessment', date: '2 Jun 2026', ts: new Date('2026-06-02'), dur: '90 min', mks: '150', score: '112', attempted: true },
    { id: 505, type: 'subject_preboard', fullName: 'Community Health Nursing', subtitle: 'CHN · NORCET Preboard',           date: '20 May 2026', ts: new Date('2026-05-20'), dur: '60 min',  mks: '100', score: '74',  attempted: true  },
    { id: 506, type: 'third_year',       fullName: '3rd Year Nursing Pre-Board 2', subtitle: 'B.Sc Nursing · 3rd Year Preboard', date: '12 May 2026', ts: new Date('2026-05-12'), dur: '90 min', mks: '150', score: null, attempted: false },
    { id: 507, type: 'subject_preboard', fullName: 'Medical Surgical Nursing', subtitle: 'MSN · NORCET Preboard',           date: '3 May 2026',  ts: new Date('2026-05-03'), dur: '60 min',  mks: '100', score: '82',  attempted: true  },
    { id: 508, type: 'subject_preboard', fullName: 'Obstetrics & Gynecology Nursing', subtitle: 'OBG · NORCET Preboard',   date: '25 Apr 2026', ts: new Date('2026-04-25'), dur: '60 min',  mks: '100', score: null,  attempted: false },
    { id: 509, type: 'nashta_mains',     fullName: 'NASHTA 2 for NORCET',     subtitle: 'Full-length NORCET simulation',    date: '18 Apr 2026', ts: new Date('2026-04-18'), dur: '120 min', mks: '200', score: '146', attempted: true  },
    { id: 510, type: 'diagnostic',       fullName: 'NORCET Diagnostic Test 2', subtitle: 'Full syllabus · Baseline assessment', date: '5 Apr 2026', ts: new Date('2026-04-05'), dur: '90 min', mks: '150', score: null, attempted: false },
    { id: 511, type: 'third_year',       fullName: '3rd Year Nursing Pre-Board 1', subtitle: 'B.Sc Nursing · 3rd Year Preboard', date: '22 Mar 2026', ts: new Date('2026-03-22'), dur: '90 min', mks: '150', score: null, attempted: false },
  ],
  rrb: [
    { id: 601, fullName: 'RRB NASHTA 1',    subtitle: 'RRB Nursing · Full Mock', date: '14 Jun 2026', ts: new Date('2026-06-14'), dur: '120 min', mks: '200', score: '164', attempted: true },
    { id: 602, fullName: 'RRB Grand Test 4', subtitle: 'RRB Nursing · Full Mock', date: '3 May 2026',  ts: new Date('2026-05-03'), dur: '120 min', mks: '200', score: null,  attempted: false },
  ],
  kgmu: [
    { id: 701, fullName: 'KGMU NASHTA 2', subtitle: 'KGMU Pattern · Full-length simulation', date: '28 May 2026', ts: new Date('2026-05-28'), dur: '120 min', mks: '200', score: '171', attempted: true },
    { id: 702, fullName: 'KGMU NASHTA 1', subtitle: 'KGMU Pattern · Full-length simulation', date: '9 Apr 2026',  ts: new Date('2026-04-09'), dur: '120 min', mks: '200', score: null,  attempted: false },
  ],
}

export function seriesById(id) {
  return SERIES.find(s => s.id === id)
}

export function totalCount(map, id) {
  return (map[id] || []).length
}

export function attemptedCount(id) {
  return (PAST[id] || []).filter(t => t.attempted).length
}
