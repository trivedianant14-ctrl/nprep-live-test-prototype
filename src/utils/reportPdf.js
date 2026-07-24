// A real, minimal single-page PDF built by hand (no library) — same approach used
// elsewhere in this user's prototypes for "download" actions that should actually work,
// not just simulate a click. PDF simple fonts only support Latin-1/WinAnsi glyphs, so
// text is sanitized to plain ASCII first; byte offsets in the xref table are computed
// with TextEncoder rather than .length so the file stays valid even if that ever misses
// a character.
function toAscii(str) {
  return String(str)
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, '')
}

function escPdf(str) {
  return toAscii(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

const byteLength = str => new TextEncoder().encode(str).length

export function downloadReportCard({ fileName, title, subtitle, rows }) {
  const marginX = 56
  let y = 740
  const stream = []

  stream.push(`BT /F2 20 Tf ${marginX} ${y} Td (${escPdf(title)}) Tj ET`)
  y -= 26
  if (subtitle) {
    stream.push(`BT /F1 11 Tf ${marginX} ${y} Td (${escPdf(subtitle)}) Tj ET`)
    y -= 30
  } else {
    y -= 14
  }
  stream.push(`${marginX} ${y + 10} m ${612 - marginX} ${y + 10} l S`)
  y -= 14
  rows.forEach(([label, value]) => {
    stream.push(`BT /F2 10 Tf ${marginX} ${y} Td (${escPdf(label)}) Tj ET`)
    stream.push(`BT /F1 10 Tf ${marginX + 160} ${y} Td (${escPdf(String(value))}) Tj ET`)
    y -= 20
  })
  const content = stream.join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>',
    `<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((obj, i) => {
    offsets.push(byteLength(pdf))
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xrefOffset = byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
