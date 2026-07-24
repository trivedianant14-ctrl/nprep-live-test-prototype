// Builds a real, downloadable .ics calendar event for an upcoming test — the
// "sync to whatever calendar app the student already lives in" pattern that
// edtech UX research flags as the highest-priority way to fight missed deadlines
// (more durable than an in-app badge, since it lives outside the app).
function pad(n) { return String(n).padStart(2, '0') }

function toIcsDate(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
}

function parseDurationMinutes(duration) {
  const m = /(\d+)/.exec(duration || '')
  return m ? parseInt(m[1], 10) : 60
}

export function downloadIcsForTest(test) {
  const start = new Date()
  start.setDate(start.getDate() + (test.daysOut ?? 1))
  start.setHours(10, 0, 0, 0) // placeholder slot — real start time isn't modeled in this prototype's data
  const end = new Date(start.getTime() + parseDurationMinutes(test.duration) * 60000)

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NPrep//Live Test//EN',
    'BEGIN:VEVENT',
    `UID:nprep-${test.id}-${Date.now()}@nprep.local`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${(test.fullName || 'NPrep Test').replace(/,/g, '\\,')}`,
    `DESCRIPTION:${(test.subtitle || 'NPrep live test').replace(/,/g, '\\,')}`,
    'LOCATION:NPrep App',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Test starts in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(test.fullName || 'nprep-test').replace(/[^a-z0-9]+/gi, '-')}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
