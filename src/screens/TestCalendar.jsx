import { useState } from 'react'
import { SERIES, UPCOMING, NORCET_TYPE_LABEL, P, PD, PL, PB, G, GL, GB, T1, T2, T3, BD } from '../data'
import { ChevronLeft, ChevronRight, ClockIcon, StarIcon } from '../icons'

const MONTH_MAP = { Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June', Jul:'July', Aug:'August', Sep:'September', Oct:'October', Nov:'November', Dec:'December' }
const DAY_MAP   = { Sun:'Sunday', Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday' }

export default function TestCalendar({ registeredIds, onRegisterClick, onBack }) {
  const [filter, setFilter] = useState('all')

  const allUpcoming = Object.entries(UPCOMING)
    .flatMap(([seriesId, tests]) => tests.map(t => ({ ...t, seriesId })))
    .sort((a, b) => a.daysOut - b.daysOut)

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
              <span style={{ fontSize:17, fontWeight:800, color:T1 }}>{mg.month}</span>
              <div style={{ flex:1, height:1.5, background:BD }} />
            </div>
            {mg.dateGroups.map(dg => (
              <div key={dg.date} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:7 }}>
                    <span style={{ fontSize:26, fontWeight:800, color:T1, lineHeight:1 }}>{dg.dayNum}</span>
                    <span style={{ fontSize:13, fontWeight:500, color:T3 }}>{dg.dayName}</span>
                  </div>
                  <span style={{ fontSize:10, fontWeight:600, color:'#1A56B0', background:'#EDF4FF', border:'1px solid #93B8F0', padding:'3px 9px', borderRadius:20 }}>
                    In {dg.daysOut} {dg.daysOut === 1 ? 'day' : 'days'}
                  </span>
                </div>
                {dg.tests.map(t => {
                  const isReg = registeredIds.has(t.id)
                  const series = SERIES.find(s => s.id === t.seriesId)
                  const regUrgent = t.regCloses <= 2
                  return (
                    <div key={t.id} style={{ background:'white', border:`1.5px solid ${BD}`, borderRadius:12, padding:'13px 14px', marginBottom:8, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:T1, lineHeight:1.4, marginBottom:2 }}>{t.fullName}</div>
                          <div style={{ fontSize:11, color:T3, marginBottom:6 }}>{t.subtitle}</div>
                          <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                            <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:series.bg, color:series.color, border:`1px solid ${series.border}` }}>
                              {series.label.replace(' Test Series', '')}
                            </span>
                            {t.type && (
                              <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:PL, color:PD, border:`1px solid ${PB}` }}>
                                {NORCET_TYPE_LABEL[t.type]}
                              </span>
                            )}
                            {!isReg && (
                              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:regUrgent?'#FDECEC':GL, color:regUrgent?'#C53030':G, border:`1px solid ${regUrgent?'#F5A3A3':GB}` }}>
                                Reg. closes in {t.regCloses}d
                              </span>
                            )}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:11, color:T2, display:'inline-flex', alignItems:'center', gap:3 }}><ClockIcon />{t.duration}</span>
                            <span style={{ fontSize:11, color:T2, display:'inline-flex', alignItems:'center', gap:3 }}><StarIcon />{t.marks} Marks</span>
                            {isReg && (
                              <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, border:`1px solid ${GB}`, padding:'1px 7px', borderRadius:20 }}>you're in!</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => !isReg && onRegisterClick(t)}
                          style={{ padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:isReg?'default':'pointer', background:isReg?GL:'#1A56B0', color:isReg?G:'white', border:`1px solid ${isReg?GB:'#1A56B0'}`, flexShrink:0, marginTop:2 }}>
                          {isReg ? '✓ Registered' : 'Register'}
                        </button>
                      </div>
                    </div>
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
