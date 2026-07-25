import { DAILY_TESTS, seriesById, G, GL, GB, P, T1, T2, T3, BD, BG2 } from '../data'
import { ClockIcon, StarIcon } from '../icons'

// The Daily Test feed rule: only the latest 10 tests stay in the feed, plus every test
// the student has attempted — those never expire, and older ones append after the feed.
// Unattempted tests older than the latest 10 auto-hide. Applied per series, since daily
// tests are organized series-wise just like live tests.
function applyRetention(tests, attemptedIds) {
  const isAttempted = t => t.attempted || attemptedIds.has(t.id)
  const sorted = [...tests].sort((a, b) => b.ts - a.ts)
  const latest = sorted.slice(0, 10)
  const olderAttempted = sorted.slice(10).filter(isAttempted)
  const hiddenCount = sorted.length - latest.length - olderAttempted.length
  return { visible: [...latest, ...olderAttempted], hiddenCount, isAttempted }
}

function DailyCard({ test, attempted, onAttempt }) {
  if (test.liveNow && !attempted) {
    return (
      <div style={{ background:'white', border:'1.5px solid #F5A3A3', borderLeft:'4px solid #FF3B30', borderRadius:12, padding:'14px', marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T1, lineHeight:1.35 }}>{test.fullName}</div>
          <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, color:'#C53030', background:'#FDECEC', border:'1px solid #F5A3A3', padding:'3px 9px', borderRadius:20, whiteSpace:'nowrap' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF3B30', display:'inline-block', boxShadow:'0 0 0 2px rgba(255,59,48,0.35)', animation:'livePulse 1.4s ease-in-out infinite' }} />
            LIVE TODAY
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:11, color:T2, marginBottom:12 }}>
          <span>{test.date}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><ClockIcon size={11} />{test.dur}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><StarIcon size={11} />{test.mks} Marks</span>
        </div>
        <button onClick={() => onAttempt(test)} style={{ width:'100%', padding:'10px', borderRadius:9, fontSize:12.5, fontWeight:700, background:P, color:'white', border:'none', cursor:'pointer' }}>
          Attempt Now
        </button>
      </div>
    )
  }

  if (attempted) {
    return (
      <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:12, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T1, lineHeight:1.35, marginBottom:3 }}>{test.fullName}</div>
          <div style={{ fontSize:10.5, color:T3 }}>{test.date} · {test.dur}</div>
        </div>
        <div style={{ flexShrink:0, textAlign:'right' }}>
          {test.score
            ? <div style={{ fontSize:14, fontWeight:800, color:G }}>{test.score}<span style={{ fontSize:10.5, fontWeight:600, color:T3 }}>/{test.mks}</span></div>
            : <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, border:`1px solid ${GB}`, padding:'3px 9px', borderRadius:20 }}>Attempted</span>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background:'white', border:`1px dashed ${BD}`, borderRadius:12, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:10, opacity:0.6 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T2, lineHeight:1.35, marginBottom:3 }}>{test.fullName}</div>
        <div style={{ fontSize:10.5, color:T3 }}>{test.date}</div>
      </div>
      <span style={{ flexShrink:0, fontSize:10, fontWeight:700, color:T3, textTransform:'uppercase', letterSpacing:0.3 }}>Missed</span>
    </div>
  )
}

export default function DailyTests({ dailyAttemptedIds, onAttempt }) {
  const bySeries = {}
  DAILY_TESTS.forEach(t => { (bySeries[t.series] = bySeries[t.series] || []).push(t) })

  return (
    <div style={{ padding:'16px 16px 32px' }}>
      <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:2 }}>Daily Tests</div>
      <div style={{ fontSize:11, color:T3, lineHeight:1.5, marginBottom:16 }}>
        One short test a day. The latest 10 stay in the feed; tests you've attempted never expire.
      </div>

      {Object.entries(bySeries).map(([seriesId, tests]) => {
        const series = seriesById(seriesId)
        const { visible, hiddenCount, isAttempted } = applyRetention(tests, dailyAttemptedIds)
        return (
          <div key={seriesId} style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T2, marginBottom:10 }}>{series ? series.label.replace(' Test Series', '') : seriesId} Daily</div>
            {visible.map(t => (
              <DailyCard key={t.id} test={t} attempted={isAttempted(t)} onAttempt={onAttempt} />
            ))}
            {hiddenCount > 0 && (
              <div style={{ fontSize:10.5, color:T3, background:BG2, border:`1px dashed ${BD}`, borderRadius:9, padding:'8px 12px', textAlign:'center' }}>
                {hiddenCount} older unattempted {hiddenCount === 1 ? 'test' : 'tests'} auto-hidden from the feed
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
