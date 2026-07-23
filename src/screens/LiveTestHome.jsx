import { LIVE_TEST, SERIES, UPCOMING, PAST, P, PD, G, T1, T2, T3, BD } from '../data'
import { ClockIcon, StarIcon, UsersIcon, ChevronRight, CalendarIcon } from '../icons'
import { UpcomingCard, SeriesTile } from '../components/Cards'

export default function LiveTestHome({ registeredIds, onRegisterClick, onJoined, joined, onOpenSeries, onOpenCalendar }) {
  // Most time-sensitive tests across every series, sorted by soonest registration
  // deadline — this is the "Upcoming Tests" preview from the wireframe, but instead of
  // being empty it surfaces exactly what needs a decision right now.
  const allUpcoming = Object.entries(UPCOMING).flatMap(([seriesId, tests]) =>
    tests.map(t => ({ ...t, seriesId }))
  )
  const topUpcoming = [...allUpcoming].sort((a, b) => a.regCloses - b.regCloses).slice(0, 2)

  return (
    <div style={{ padding:'16px 16px 32px' }}>

      {/* Live Now */}
      <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:12 }}>Live Now</div>
      <div style={{ background:`linear-gradient(135deg, ${P} 0%, ${PD} 100%)`, borderRadius:14, padding:'18px 16px 16px', marginBottom:24, boxShadow:'0 4px 16px rgba(83,74,183,0.28)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(255,255,255,0.18)', color:'white', border:'1px solid rgba(255,255,255,0.32)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF6B6B', display:'inline-block', boxShadow:'0 0 0 2px rgba(255,107,107,0.4)', animation:'livePulse 1.4s ease-in-out infinite' }} />
            LIVE
          </span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.72)', fontWeight:500 }}>{LIVE_TEST.timeLabel}</span>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:'white', marginBottom:12, lineHeight:1.4 }}>{LIVE_TEST.name}</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'rgba(255,255,255,0.80)', fontWeight:500 }}><ClockIcon />{LIVE_TEST.durationLabel}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'rgba(255,255,255,0.80)', fontWeight:500 }}><StarIcon />{LIVE_TEST.marks} Marks</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'rgba(255,255,255,0.80)', fontWeight:500 }}><UsersIcon />{LIVE_TEST.enrolled.toLocaleString()} joined</span>
        </div>
        <button onClick={onJoined} disabled={joined} style={{ width:'100%', padding:'12px', borderRadius:10, background:'white', color:joined?G:P, fontSize:14, fontWeight:700, border:'none', cursor:joined?'default':'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.12)' }}>
          {joined ? '✓ Joined' : 'Join Now'}
        </button>
      </div>

      {/* Upcoming Tests */}
      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:16, marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Upcoming Tests</div>
        {topUpcoming.map(t => (
          <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} typeLabel={SERIES.find(s => s.id === t.seriesId)?.label} />
        ))}
      </div>

      {/* Tests Calendar banner */}
      <button onClick={onOpenCalendar}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, background:'#EDF4FF', border:'1.5px solid #93B8F0', borderRadius:12, padding:'13px 14px', cursor:'pointer', textAlign:'left', marginBottom:24 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'#1A56B0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <CalendarIcon />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1A56B0' }}>Tests Calendar</div>
          <div style={{ fontSize:11, color:T2, marginTop:2 }}>See every upcoming test, month by month</div>
        </div>
        <ChevronRight size={18} />
      </button>

      {/* Past Tests — series tiles */}
      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:12 }}>Past Tests</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {SERIES.map(s => (
            <SeriesTile
              key={s.id}
              series={s}
              pastTotal={(PAST[s.id] || []).length}
              attempted={(PAST[s.id] || []).filter(t => t.attempted).length}
              upcomingCount={(UPCOMING[s.id] || []).length}
              onClick={() => onOpenSeries(s.id)}
            />
          ))}
        </div>
      </div>

    </div>
  )
}
