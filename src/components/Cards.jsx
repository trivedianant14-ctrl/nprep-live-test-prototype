import { P, G, GL, GB, A, AL, AB, T1, T2, T3, BD } from '../data'
import { ClockIcon, StarIcon } from '../icons'

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
// stacking a countdown pill, a date pill, and a social-proof pill. Color still carries
// real meaning (red/amber/green by how soon registration closes); everything else that
// isn't a status is plain text.
function StatusPill({ isRegistered, regCloses }) {
  const urgent = regCloses <= 2, soon = regCloses <= 5
  const bg     = isRegistered ? GL : urgent ? '#FDECEC' : soon ? AL : GL
  const color  = isRegistered ? G  : urgent ? '#C53030' : soon ? A  : G
  const border = isRegistered ? GB : urgent ? '#F5A3A3' : soon ? AB : GB
  return (
    <span style={{ flexShrink:0, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:bg, color, border:`1px solid ${border}`, whiteSpace:'nowrap' }}>
      {isRegistered ? 'Registered' : `Closes in ${regCloses}d`}
    </span>
  )
}

// `label` is one short line of context (series and/or type) folded in above the
// subtitle — the card used to carry a separate bordered chip for this; now it's just
// the first word of a sentence a student already reads top to bottom.
export function UpcomingCard({ test, isRegistered, onRegisterClick, label }) {
  return (
    <div style={{ background:'white', border:`1px solid ${test.recommended ? GB : BD}`, borderRadius:12, padding:'14px', marginBottom:10 }}>
      {test.recommended && (
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={G} stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          <span style={{ fontSize:10.5, fontWeight:700, color:G }}>Recommended</span>
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T1, lineHeight:1.35 }}>{test.fullName}</div>
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
      <button
        onClick={() => !isRegistered && onRegisterClick(test)}
        style={{ width:'100%', padding:'10px', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:isRegistered?'default':'pointer', background:isRegistered?GL:P, color:isRegistered?G:'white', border:isRegistered?`1px solid ${GB}`:'none' }}>
        {isRegistered ? '✓ Registered' : 'Register'}
      </button>
    </div>
  )
}

export function PastCard({ test, label }) {
  if (test.attempted) {
    return (
      <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:12, padding:'14px', marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T1, lineHeight:1.35 }}>{test.fullName}</div>
          <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:700, color:G, whiteSpace:'nowrap' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:G, display:'inline-block' }} />
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
        <button style={{ width:'100%', padding:'9px', borderRadius:9, fontSize:12, fontWeight:600, background:'white', color:P, border:`1px solid ${P}`, cursor:'pointer' }}>
          View Result
        </button>
      </div>
    )
  }

  return (
    <div style={{ background:'white', border:`1px dashed ${BD}`, borderRadius:12, padding:'14px', marginBottom:10, opacity:0.65 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4 }}>
        <div style={{ fontSize:14, fontWeight:600, color:T2, lineHeight:1.35 }}>{test.fullName}</div>
        <span style={{ flexShrink:0, fontSize:10, fontWeight:700, color:T3, textTransform:'uppercase', letterSpacing:0.3, whiteSpace:'nowrap' }}>Not Attempted</span>
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
// short, unambiguous list second.
export function SeriesTile({ series, pastTotal, attempted, upcomingCount, onClick }) {
  if (series.comingSoon) {
    return (
      <div style={{ background:series.bg, border:`1.5px dashed ${series.border}`, borderRadius:14, padding:'16px 14px', position:'relative', minHeight:100 }}>
        <span style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:700, color:series.color, background:'white', border:`1px solid ${series.border}`, padding:'2px 8px', borderRadius:20 }}>Coming Soon</span>
        <div style={{ fontSize:14, fontWeight:700, color:series.color, marginBottom:4, marginTop:10 }}>{series.label}</div>
        <div style={{ fontSize:11, color:T3 }}>{series.tagline}</div>
      </div>
    )
  }
  return (
    <button onClick={onClick} style={{ textAlign:'left', background:series.bg, border:`1.5px solid ${series.border}`, borderRadius:14, padding:'16px 14px', cursor:'pointer', minHeight:100, display:'flex', flexDirection:'column' }}>
      <div style={{ fontSize:14, fontWeight:700, color:series.color, marginBottom:4 }}>{series.label}</div>
      <div style={{ fontSize:11, color:T3, marginBottom:10, flex:1 }}>{series.tagline}</div>
      <div style={{ fontSize:10.5, fontWeight:600, color:series.color }}>
        {pastTotal} past · {attempted} done{upcomingCount > 0 ? ` · ${upcomingCount} upcoming` : ''}
      </div>
    </button>
  )
}
