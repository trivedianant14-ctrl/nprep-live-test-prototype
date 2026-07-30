// Self-contained SVG "clinical images" as data URIs — so image-based questions render
// reliably in every view (NPrep mock, NORCET Prelims/Mains, and the solutions view)
// without depending on external image hosts.
const enc = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`

function ecgSvg() {
  let grid = ''
  for (let x = 0; x <= 600; x += 15) grid += `<line x1='${x}' y1='0' x2='${x}' y2='200' stroke='#f6ccd4' stroke-width='${x % 75 === 0 ? 1.2 : 0.5}'/>`
  for (let y = 0; y <= 200; y += 15) grid += `<line x1='0' y1='${y}' x2='600' y2='${y}' stroke='#f6ccd4' stroke-width='${y % 75 === 0 ? 1.2 : 0.5}'/>`
  let path = 'M0 120'
  for (let b = 0; b < 600; b += 120) {
    path += ` L${b + 18} 120 Q${b + 28} 104 ${b + 38} 120 L${b + 50} 120 L${b + 56} 132 L${b + 63} 52 L${b + 70} 152 L${b + 76} 120 L${b + 92} 120 Q${b + 104} 92 ${b + 116} 120 L${b + 120} 120`
  }
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200'><rect width='600' height='200' fill='#fff'/>${grid}<path d='${path}' fill='none' stroke='#111' stroke-width='2.4' stroke-linejoin='round' stroke-linecap='round'/></svg>`)
}

function xraySvg() {
  let ribs = ''
  for (let i = 0; i < 5; i++) {
    const y = 70 + i * 26
    ribs += `<path d='M150 ${y} Q200 ${y + 34} 250 ${y}' fill='none' stroke='#8fa3b8' stroke-width='4' opacity='0.7'/>`
    ribs += `<path d='M250 ${y} Q300 ${y + 34} 350 ${y}' fill='none' stroke='#8fa3b8' stroke-width='4' opacity='0.7'/>`
  }
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' width='420' height='300'>
    <rect width='420' height='300' fill='#0b0f14'/>
    <ellipse cx='250' cy='150' rx='70' ry='95' fill='#1c2733'/>
    <ellipse cx='320' cy='150' rx='55' ry='90' fill='#1c2733'/>
    <rect x='245' y='55' width='16' height='200' rx='8' fill='#3a4a5c'/>
    ${ribs}
    <ellipse cx='250' cy='215' rx='40' ry='24' fill='#2a3644'/>
  </svg>`)
}

function woundSvg() {
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' width='420' height='260'>
    <rect width='420' height='260' fill='#f3ded2'/>
    <ellipse cx='210' cy='130' rx='150' ry='90' fill='#e8b79f'/>
    <path d='M120 130 Q210 90 300 130 Q210 170 120 130 Z' fill='#c95b4a'/>
    <path d='M155 130 L265 130' stroke='#7a2b22' stroke-width='6' stroke-linecap='round'/>
    <g stroke='#5a5a5a' stroke-width='2'>
      <line x1='170' y1='108' x2='170' y2='152'/><line x1='195' y1='104' x2='195' y2='156'/>
      <line x1='225' y1='104' x2='225' y2='156'/><line x1='250' y1='108' x2='250' y2='152'/>
    </g>
    <circle cx='300' cy='95' r='10' fill='#f2d34a'/>
  </svg>`)
}

export const IMG_ECG = ecgSvg()
export const IMG_XRAY = xraySvg()
export const IMG_WOUND = woundSvg()
