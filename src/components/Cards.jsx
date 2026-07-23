import { P, PL, PB, G, GL, GB, A, AL, AB, T1, T2, T3, BD } from '../data'
import { ClockIcon, StarIcon, UsersIcon } from '../icons'

function MetaChip({ icon, label }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, color:T2, fontWeight:500 }}>
      {icon}{label}
    </span>
  )
}

export function TypeTag({ label }) {
  if (!label) return null
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, background:PL, color:P, border:`1px solid ${PB}`, flexShrink:0 }}>
      {label}
    </span>
  )
}

// Registration-deadline urgency is kept separate from the test's own start date — a test
// "in 37 days" still reads urgent if its registration window is closing in 2.
export function UpcomingCard({ test, isRegistered, onRegisterClick, typeLabel }) {
  const regUrgent = test.regCloses <= 2
  const regSoon   = test.regCloses <= 5
  const regBg     = regUrgent ? '#FDECEC' : regSoon ? AL : GL
  const regColor  = regUrgent ? '#C53030' : regSoon ? A  : G
  const regBorder = regUrgent ? '#F5A3A3' : regSoon ? AB : GB

  return (
    <div style={{ background:'white', border:`1.5px solid ${test.recommended ? GB : BD}`, borderRadius:12, overflow:'hidden', marginBottom:10 }}>
      {test.recommended && (
        <div style={{ background:GL, borderBottom:`1px solid ${GB}`, padding:'5px 14px', display:'flex', alignItems:'center', gap:5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={G} stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          <span style={{ fontSize:11, fontWeight:700, color:G }}>Recommended</span>
        </div>
      )}
      <div style={{ padding:'14px 14px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, gap:8 }}>
          {typeLabel ? <TypeTag label={typeLabel} /> : <span />}
          <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:isRegistered?GL:regBg, color:isRegistered?G:regColor, border:`1px solid ${isRegistered?GB:regBorder}`, whiteSpace:'nowrap' }}>
            {isRegistered ? "You're registered" : `Registration closes in ${test.regCloses} ${test.regCloses === 1 ? 'day' : 'days'}`}
          </span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:'#EDF4FF', color:'#1A56B0', border:'1px solid #93B8F0' }}>
            Test in {test.daysOut} {test.daysOut === 1 ? 'day' : 'days'}
          </span>
          <span style={{ fontSize:11, color:T3, fontWeight:500 }}>{test.date}</span>
        </div>
        <div style={{ fontSize:14, fontWeight:700, color:T1, lineHeight:1.4, marginBottom:3 }}>{test.fullName}</div>
        <div style={{ fontSize:11, color:T3, marginBottom:8 }}>{test.subtitle}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:10 }}>
          <span style={{ color:T3, display:'flex', alignItems:'center' }}><UsersIcon /></span>
          <span style={{ fontSize:11, color:T3, fontWeight:500 }}>
            {(isRegistered ? test.enrolled + 1 : test.enrolled).toLocaleString()} students registered
          </span>
          {isRegistered && (
            <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, border:`1px solid ${GB}`, padding:'1px 7px', borderRadius:20 }}>you're in!</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <MetaChip icon={<ClockIcon />} label={test.duration} />
          <MetaChip icon={<StarIcon />} label={`${test.marks} Marks`} />
          <button
            onClick={() => !isRegistered && onRegisterClick(test)}
            style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:8, fontSize:11, fontWeight:600, cursor:isRegistered?'default':'pointer', background:isRegistered?GL:'transparent', color:isRegistered?G:P, border:`1px solid ${isRegistered?GB:PB}` }}>
            {isRegistered ? '✓ Registered' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PastCard({ test, typeLabel }) {
  if (test.attempted) {
    return (
      <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:12, padding:'14px 14px 12px', marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:GL, color:G, border:`1px solid ${GB}` }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:G, display:'inline-block' }} />
            Result Out
          </span>
          <TypeTag label={typeLabel} />
        </div>
        <div style={{ fontSize:14, fontWeight:700, color:T1, lineHeight:1.4, marginBottom:3 }}>{test.fullName}</div>
        <div style={{ fontSize:11, color:T3, marginBottom:10 }}>{test.subtitle}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:T3 }}>{test.date}</span>
          <span style={{ color:BD }}>·</span>
          <MetaChip icon={<ClockIcon />} label={test.dur} />
          {test.score && (
            <>
              <span style={{ color:BD }}>·</span>
              <span style={{ fontSize:11, fontWeight:700, color:G }}>{test.score}/{test.mks}</span>
            </>
          )}
          <button style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:8, fontSize:11, fontWeight:600, background:PL, color:P, border:`1px solid ${PB}`, cursor:'pointer' }}>
            View Result
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background:'white', border:`1px dashed ${BD}`, borderRadius:12, padding:'14px 14px 12px', marginBottom:10, opacity:0.65 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:10, fontWeight:700, color:T3, textTransform:'uppercase', letterSpacing:0.3 }}>Not Attempted</span>
        <TypeTag label={typeLabel} />
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:T2, lineHeight:1.4, marginBottom:3 }}>{test.fullName}</div>
      <div style={{ fontSize:11, color:T3, marginBottom:8 }}>{test.subtitle}</div>
      <span style={{ fontSize:11, color:T3 }}>{test.date}</span>
    </div>
  )
}

// The Past Tests category tiles from the wireframe — the primary fix for "too many
// tests" and "different exams blended together": pick your exam body first, see a
// short, unambiguous list second.
export function SeriesTile({ series, pastTotal, attempted, upcomingCount, onClick }) {
  if (series.comingSoon) {
    return (
      <div style={{ background:series.bg, border:`1.5px dashed ${series.border}`, borderRadius:14, padding:'16px 14px', position:'relative', minHeight:104 }}>
        <span style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:700, color:series.color, background:'white', border:`1px solid ${series.border}`, padding:'2px 8px', borderRadius:20 }}>Coming Soon</span>
        <div style={{ fontSize:14, fontWeight:700, color:series.color, marginBottom:4, marginTop:10 }}>{series.label}</div>
        <div style={{ fontSize:11, color:T3 }}>{series.tagline}</div>
      </div>
    )
  }
  return (
    <button onClick={onClick} style={{ textAlign:'left', background:series.bg, border:`1.5px solid ${series.border}`, borderRadius:14, padding:'16px 14px', cursor:'pointer', minHeight:104, display:'flex', flexDirection:'column' }}>
      <div style={{ fontSize:14, fontWeight:700, color:series.color, marginBottom:4 }}>{series.label}</div>
      <div style={{ fontSize:11, color:T3, marginBottom:10, flex:1 }}>{series.tagline}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:10, fontWeight:700, color:series.color, background:'rgba(255,255,255,0.6)', border:`1px solid ${series.border}`, padding:'2px 8px', borderRadius:20 }}>
          {pastTotal} past · {attempted} done
        </span>
        {upcomingCount > 0 && (
          <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, border:`1px solid ${GB}`, padding:'2px 8px', borderRadius:20 }}>
            {upcomingCount} upcoming
          </span>
        )}
      </div>
    </button>
  )
}
