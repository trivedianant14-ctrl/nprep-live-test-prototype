import { useState } from 'react'
import { P, PL, PB, PD, G, GL, A, AL, T1, T2, T3, BD, BG2 } from '../data'
import { ClockIcon, StarIcon } from '../icons'
import { downloadReportCard } from '../utils/reportPdf'
import { scholarshipAmount } from '../utils/tierBranding'
import { syllabusFor } from '../utils/syllabus'

// "View syllabus" — shown ONLY on subject tests (Pre-boards), never on full mocks.
// Mobile: a subtle link → bottom sheet within the phone frame. Desktop: the link →
// a centered pop-up modal (topics in two columns; scrolls if long).
const ListIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
)

function SyllabusTrigger({ test, desktop }) {
  const [open, setOpen] = useState(false)
  const syl = syllabusFor(test)
  const g = syl.groups[0]
  const inner = (
    <>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, padding:'14px 18px 12px', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T1 }}>Syllabus</div>
          <div style={{ fontSize:11.5, color:T3, marginTop:2 }}>{g.subject} · {g.topics.length} topics</div>
        </div>
        <button onClick={() => setOpen(false)} style={{ flexShrink:0, background:BG2, border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:T2 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="scroll" style={{ flex:1, overflowY:'auto', padding:'12px 18px 8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:11 }}>
          <span style={{ fontSize:10, fontWeight:700, color:P, background:PL, borderRadius:6, padding:'3px 7px' }}>{g.code}</span>
          <span style={{ fontSize:13, fontWeight:600, color:T1 }}>{g.subject}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: desktop ? '1fr 1fr' : '1fr', gap:'9px 20px' }}>
          {g.topics.map((tp, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9, fontSize:12.5, color:T2, lineHeight:1.5 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:PB, flexShrink:0, marginTop:6 }} />{tp}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:'11px 18px', borderTop:`1px solid ${BD}`, fontSize:10.5, color:T3, flexShrink:0 }}>Indicative syllabus — actual topic weightage may vary by test.</div>
    </>
  )
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none', padding:0, color:P, fontSize:12, fontWeight:600, cursor:'pointer', marginBottom:11 }}>
        <ListIcon/> View syllabus
      </button>
      {open && (desktop
        ? <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(19,27,99,0.42)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:520, maxHeight:'82vh', background:'#fff', borderRadius:16, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.28)' }}>{inner}</div>
          </div>
        : <div className="overlay" onClick={() => setOpen(false)} style={{ zIndex:80 }}>
            <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight:'80%' }}><div className="sheet-handle" />{inner}</div>
          </div>
      )}
    </>
  )
}

// Joins meta fragments with a middot, skipping empty ones — used instead of separate
// pills for each fact so a card reads as one calm line, not a row of colored chips.
function MetaLine({ items, style }) {
  const parts = items.filter(Boolean)
  return (
    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'3px 8px', fontSize:11, color:T2, ...style }}>
      {parts.map((part, i) => (
        <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
          {i > 0 && <span style={{ color:BD }}>·</span>}
          {part}
        </span>
      ))}
    </div>
  )
}

// A single status signal per card — registration urgency or "Registered" — instead of
// stacking a countdown pill, a date pill, and a social-proof pill. NPrep's status
// language: a dot + label in a soft tint, no border, never a loud pill. Color still
// carries real meaning (red/amber/green by how soon registration closes).
function StatusPill({ isRegistered, regCloses }) {
  const urgent = regCloses <= 2, soon = regCloses <= 5
  const bg    = isRegistered ? GL : urgent ? '#FDECED' : soon ? AL : GL
  const color = isRegistered ? G  : urgent ? '#E5484D' : soon ? A  : G
  return (
    <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:600, padding:'4px 10px 4px 8px', borderRadius:20, background:bg, color, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />
      {isRegistered ? 'Registered' : `Closes in ${regCloses}d`}
    </span>
  )
}

// `label` is one short line of context (series and/or type) folded in above the
// subtitle — the card used to carry a separate bordered chip for this; now it's just
// the first word of a sentence a student already reads top to bottom.
export function UpcomingCard({ test, isRegistered, onRegisterClick, label, desktop }) {
  const showSyllabus = syllabusFor(test).scope === 'subject'   // only subject tests (Pre-boards), not full mocks
  return (
    <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:14, padding:'14px', marginBottom:10, boxSizing:'border-box' }}>
      {test.recommended && (
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={P} stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          <span style={{ fontSize:10.5, fontWeight:600, color:P }}>Recommended</span>
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:T1, lineHeight:1.35 }}>{test.fullName}</div>
        <StatusPill isRegistered={isRegistered} regCloses={test.regCloses} />
      </div>
      <div style={{ fontSize:11.5, color:T3, marginBottom:8 }}>
        {label ? `${label} · ` : ''}{test.subtitle}
      </div>
      <MetaLine
        style={{ marginBottom:12 }}
        items={[
          `${test.date} · in ${test.daysOut}d`,
          <><ClockIcon size={11} />{test.duration}</>,
          <><StarIcon size={11} />{test.marks} Marks</>,
          `${(isRegistered ? test.enrolled + 1 : test.enrolled).toLocaleString()} registered`,
        ]}
      />
      {showSyllabus && <SyllabusTrigger test={test} desktop={desktop} />}
      {test.deliveryChannel === 'whatsapp' ? (
        <div style={{ width:'100%', padding:'10px', borderRadius:24, fontSize:12, fontWeight:600, background:GL, color:G, textAlign:'center' }}>
          Sent via WhatsApp — no app registration needed
        </div>
      ) : (
        <button
          onClick={() => !isRegistered && onRegisterClick(test)}
          style={{ width:'100%', padding:'10px', borderRadius:24, fontSize:13, fontWeight:600, cursor:isRegistered?'default':'pointer', background:isRegistered?GL:P, color:isRegistered?G:'white', border:'none' }}>
          {isRegistered ? '✓ Registered' : 'Register'}
        </button>
      )}
    </div>
  )
}

export function PastCard({ test, label, desktop }) {
  if (test.attempted) {
    const showSyllabus = syllabusFor(test).scope === 'subject'   // only subject tests (Pre-boards)
    return (
      <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:14, padding:'14px', marginBottom:10, boxSizing:'border-box' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:T1, lineHeight:1.35 }}>{test.fullName}</div>
          <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:600, color:G, background:GL, padding:'4px 10px 4px 8px', borderRadius:20, whiteSpace:'nowrap' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:G, display:'inline-block' }} />
            Result Out
          </span>
        </div>
        <div style={{ fontSize:11.5, color:T3, marginBottom:8 }}>
          {label ? `${label} · ` : ''}{test.subtitle}
        </div>
        <MetaLine
          style={{ marginBottom:12 }}
          items={[
            test.date,
            <><ClockIcon size={11} />{test.dur}</>,
            test.score && <span style={{ fontWeight:700, color:G }}>{test.score}/{test.mks}</span>,
          ]}
        />
        {showSyllabus && <SyllabusTrigger test={test} desktop={desktop} />}
        <button
          onClick={() => {
            if (!test.reportLabel) return
            const isScholarship = test.reportLabel === 'Scholarship Report'
            const pct = test.score ? Math.round((Number(test.score) / Number(test.mks)) * 100) : null
            const rows = [
              ['Test', test.subtitle],
              ['Date', test.date],
              ['Duration', test.dur],
              ['Score', test.score ? `${test.score} / ${test.mks} (${pct}%)` : 'Not scored'],
            ]
            // Scholarship reports carry the award amount; Diagnostic reports (paid) don't —
            // same underlying attempt, two different report contents per the ticket.
            if (isScholarship && pct !== null) {
              const amount = scholarshipAmount(pct)
              rows.push(['Scholarship Awarded', amount > 0 ? `Rs. ${amount.toLocaleString('en-IN')}` : 'Not eligible this attempt'])
            }
            downloadReportCard({
              fileName: `${test.reportLabel.replace(/\s+/g, '-')}-${test.fullName.replace(/\s+/g, '-')}.pdf`,
              title: test.reportLabel,
              subtitle: test.fullName,
              rows,
            })
          }}
          style={{ width:'100%', padding:'9px', borderRadius:24, fontSize:12.5, fontWeight:600, background:'white', color:P, border:`1px solid ${P}`, cursor:'pointer' }}>
          {test.reportLabel ? `Download ${test.reportLabel}` : 'View Result'}
        </button>
        {test.reportLabel === 'Scholarship Report' && (
          <div style={{ fontSize:10.5, color:T3, textAlign:'center', marginTop:6 }}>Also sent to your WhatsApp within 15–20 minutes</div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background:'white', border:`1px dashed ${BD}`, borderRadius:14, padding:'14px', marginBottom:10, opacity:0.65 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4 }}>
        <div style={{ fontSize:13.5, fontWeight:500, color:T2, lineHeight:1.35 }}>{test.fullName}</div>
        <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:600, color:T3, whiteSpace:'nowrap' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:T3, display:'inline-block' }} />
          Missed
        </span>
      </div>
      <div style={{ fontSize:11.5, color:T3, marginBottom:8 }}>
        {label ? `${label} · ` : ''}{test.subtitle}
      </div>
      <div style={{ fontSize:11, color:T3 }}>{test.date}</div>
    </div>
  )
}

// The Past Tests category tiles from the wireframe — the primary fix for "too many
// tests" and "different exams blended together": pick your exam body first, see a
// short, unambiguous list second. NPrep's tile language: white card, hairline
// border, soft-blue icon tile, navy label — identity is icon + label, never a
// per-category color block.
function SeriesGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/>
    </svg>
  )
}

export function SeriesTile({ series, pastTotal, attempted, upcomingCount, onClick, isLive }) {
  if (series.comingSoon) {
    return (
      <div style={{ background:'white', border:`1px dashed ${BD}`, borderRadius:14, padding:'14px', position:'relative', minHeight:112, opacity:0.7 }}>
        <span style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:600, color:T3, background:BG2, padding:'2px 8px', borderRadius:20 }}>Coming Soon</span>
        <div style={{ fontSize:13, fontWeight:600, color:T2, marginBottom:4, marginTop:12 }}>{series.label}</div>
        <div style={{ fontSize:11, color:T3 }}>{series.tagline}</div>
      </div>
    )
  }
  return (
    <button onClick={onClick} style={{ textAlign:'left', background:'white', border:`1px solid ${BD}`, borderRadius:14, padding:'14px', cursor:'pointer', minHeight:112, display:'flex', flexDirection:'column', position:'relative' }}>
      {/* Instagram-Live-style urgency dot: a test in this series is live right now.
          No count, no label — the dot alone reads as "something is happening here". */}
      {isLive && (
        <span style={{ position:'absolute', top:12, right:12, width:8, height:8, borderRadius:'50%', background:'#FF3B30', boxShadow:'0 0 0 2.5px rgba(255,59,48,0.3)', animation:'livePulse 1.4s ease-in-out infinite' }} />
      )}
      <div style={{ width:32, height:32, borderRadius:9, background:PL, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:9, flexShrink:0 }}>
        <SeriesGlyph />
      </div>
      <div style={{ fontSize:13, fontWeight:600, color:T1, marginBottom:3, lineHeight:1.3, paddingRight: isLive ? 12 : 0 }}>{series.label}</div>
      <div style={{ fontSize:10.5, color:T3, marginBottom:8, flex:1, lineHeight:1.45 }}>{series.tagline}</div>
      <div style={{ fontSize:10.5, fontWeight:500, color:T2 }}>
        {pastTotal} past · <span style={{ color:P, fontWeight:600 }}>{attempted} done</span>{upcomingCount > 0 ? ` · ${upcomingCount} upcoming` : ''}
      </div>
    </button>
  )
}
