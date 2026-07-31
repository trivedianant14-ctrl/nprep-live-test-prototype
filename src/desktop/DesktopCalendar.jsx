import { useState } from 'react'
import { SERIES, UPCOMING, NORCET_TYPE_LABEL, P, PL, PD, T1, T2, T3, BD } from '../data'
import { UpcomingCard } from '../components/Cards'
import { brandListForTier } from '../utils/tierBranding'

const MONTH_MAP = { Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June', Jul:'July', Aug:'August', Sep:'September', Oct:'October', Nov:'November', Dec:'December' }
const DAY_MAP   = { Sun:'Sunday', Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday' }

export default function DesktopCalendar({ registeredIds, onRegisterClick, onBack, userTier, initialFilter = 'all' }) {
  const [filter, setFilter] = useState(initialFilter)

  const allUpcoming = brandListForTier(
    Object.entries(UPCOMING).flatMap(([seriesId, tests]) => tests.map(t => ({ ...t, seriesId }))),
    userTier
  ).sort((a, b) => a.daysOut - b.daysOut)
  const filtered = filter === 'all' ? allUpcoming : allUpcoming.filter(t => t.seriesId === filter)

  const monthGroups = []
  const seenMonths = {}
  filtered.forEach(t => {
    const [dayName, rest] = t.date.split(', ')
    const [dayNum, monthAbbr] = rest.split(' ')
    const month = MONTH_MAP[monthAbbr] || monthAbbr
    if (!seenMonths[month]) { const mg = { month, dateGroups: [], _dates: {} }; seenMonths[month] = mg; monthGroups.push(mg) }
    const mg = seenMonths[month]
    if (!mg._dates[t.date]) { const dg = { date: t.date, daysOut: t.daysOut, dayNum, dayName: DAY_MAP[dayName] || dayName, tests: [] }; mg._dates[t.date] = dg; mg.dateGroups.push(dg) }
    mg._dates[t.date].tests.push(t)
  })

  return (
    <div style={{ maxWidth:1180, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
        <button onClick={onBack} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'white', border:`1px solid ${BD}`, borderRadius:20, padding:'7px 14px', cursor:'pointer', color:T2, fontSize:12.5, fontWeight:600 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Tests
        </button>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:T1, letterSpacing:'-0.01em' }}>Test Calendar</div>
          <div style={{ fontSize:13, color:T3, marginTop:2 }}>Upcoming scheduled tests, across every series</div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {[{ id:'all', label:'All' }, ...SERIES.filter(s => !s.comingSoon).map(s => ({ id:s.id, label:s.label.replace(' Test Series', '') }))].map(f => {
          const active = filter === f.id
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding:'6px 16px', borderRadius:20, fontSize:12.5, fontWeight:active?600:500,
              background: active ? P : 'white', color: active ? 'white' : T2,
              border: `1px solid ${active ? P : BD}`, cursor:'pointer', whiteSpace:'nowrap',
            }}>{f.label}</button>
          )
        })}
      </div>

      {monthGroups.length === 0 && (
        <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:14, textAlign:'center', padding:'48px 0', color:T3, fontSize:13.5 }}>No upcoming tests scheduled. Check back soon!</div>
      )}
      {monthGroups.map(mg => (
        <div key={mg.month} style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
            <span style={{ fontSize:17, fontWeight:700, color:T1 }}>{mg.month}</span>
            <div style={{ flex:1, height:1, background:BD }} />
          </div>
          {mg.dateGroups.map(dg => (
            <div key={dg.date} style={{ display:'grid', gridTemplateColumns:'150px 1fr', gap:20, marginBottom:22, alignItems:'start' }}>
              {/* Date column */}
              <div style={{ paddingTop:4 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:7 }}>
                  <span style={{ fontSize:30, fontWeight:700, color:PD, lineHeight:1 }}>{dg.dayNum}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:500, color:T3, marginTop:4 }}>{dg.dayName}</div>
                <span style={{ display:'inline-block', marginTop:8, fontSize:10.5, fontWeight:600, color:P, background:PL, padding:'4px 10px', borderRadius:20 }}>
                  In {dg.daysOut} {dg.daysOut === 1 ? 'day' : 'days'}
                </span>
              </div>
              {/* Tests for that date */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:14 }}>
                {dg.tests.map(t => {
                  const series = SERIES.find(s => s.id === t.seriesId)
                  const label = [series.label.replace(' Test Series', ''), t.type && NORCET_TYPE_LABEL[t.type]].filter(Boolean).join(' · ')
                  return <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} label={label} desktop />
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
