import { useState } from 'react'
import { SERIES, UPCOMING, NORCET_TYPE_LABEL, P, PL, PD, T1, T2, T3, BD } from '../data'
import { ChevronLeft } from '../icons'
import { UpcomingCard } from '../components/Cards'
import { brandListForTier } from '../utils/tierBranding'

const MONTH_MAP = { Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June', Jul:'July', Aug:'August', Sep:'September', Oct:'October', Nov:'November', Dec:'December' }
const DAY_MAP   = { Sun:'Sunday', Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday' }

export default function TestCalendar({ registeredIds, onRegisterClick, onBack, userTier, initialFilter = 'all' }) {
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
    if (!seenMonths[month]) {
      const mg = { month, dateGroups: [], _dates: {} }
      seenMonths[month] = mg
      monthGroups.push(mg)
    }
    const mg = seenMonths[month]
    if (!mg._dates[t.date]) {
      const dg = { date: t.date, daysOut: t.daysOut, dayNum, dayName: DAY_MAP[dayName] || dayName, tests: [] }
      mg._dates[t.date] = dg
      mg.dateGroups.push(dg)
    }
    mg._dates[t.date].tests.push(t)
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 16px 12px', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:T1, padding:0, flexShrink:0 }}>
          <ChevronLeft />
        </button>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:T1 }}>Test Calendar</div>
          <div style={{ fontSize:11, color:T3, marginTop:1 }}>Upcoming scheduled tests, across every series</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, padding:'12px 16px 10px', borderBottom:`1px solid ${BD}`, flexShrink:0, overflowX:'auto' }}>
        {[{ id:'all', label:'All' }, ...SERIES.filter(s => !s.comingSoon).map(s => ({ id:s.id, label:s.label.replace(' Test Series', '') }))].map(f => {
          const active = filter === f.id
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:active?700:500,
              background: active ? P : 'white', color: active ? 'white' : T2,
              border: `1.5px solid ${active ? P : BD}`, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
            }}>{f.label}</button>
          )
        })}
      </div>

      <div className="scroll" style={{ flex:1, padding:'20px 16px 40px' }}>
        {monthGroups.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:T3, fontSize:13 }}>No upcoming tests scheduled. Check back soon!</div>
        )}
        {monthGroups.map(mg => (
          <div key={mg.month} style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <span style={{ fontSize:16, fontWeight:700, color:T1 }}>{mg.month}</span>
              <div style={{ flex:1, height:1, background:BD }} />
            </div>
            {mg.dateGroups.map(dg => (
              <div key={dg.date} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:7 }}>
                    <span style={{ fontSize:24, fontWeight:700, color:PD, lineHeight:1 }}>{dg.dayNum}</span>
                    <span style={{ fontSize:13, fontWeight:500, color:T3 }}>{dg.dayName}</span>
                  </div>
                  <span style={{ fontSize:10.5, fontWeight:600, color:P, background:PL, padding:'4px 10px', borderRadius:20 }}>
                    In {dg.daysOut} {dg.daysOut === 1 ? 'day' : 'days'}
                  </span>
                </div>
                {dg.tests.map(t => {
                  const series = SERIES.find(s => s.id === t.seriesId)
                  const label = [series.label.replace(' Test Series', ''), t.type && NORCET_TYPE_LABEL[t.type]].filter(Boolean).join(' · ')
                  return (
                    <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} label={label} />
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
