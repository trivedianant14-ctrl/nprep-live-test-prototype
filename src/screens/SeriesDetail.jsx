import { useState } from 'react'
import { seriesById, UPCOMING, PAST, NORCET_TYPES, NORCET_TYPE_LABEL, P, PD, G, GL, GB, BG2, T1, T2, T3, BD } from '../data'
import { ChevronLeft, ChevronUp, ChevronRight } from '../icons'
import { UpcomingCard, PastCard } from '../components/Cards'

export default function SeriesDetail({ seriesId, initialType = 'all', registeredIds, onRegisterClick, onBack }) {
  const series = seriesById(seriesId)
  const [activeType, setActiveType] = useState(series.hasTypes ? initialType : 'all')
  const [myAttemptsOnly, setMyAttemptsOnly] = useState(false)

  const upcomingAll = UPCOMING[seriesId] || []
  const pastAll     = PAST[seriesId] || []

  const byType = (list) => activeType === 'all' ? list : list.filter(t => t.type === activeType)
  const upcoming = byType(upcomingAll)
  const pastBase = myAttemptsOnly ? pastAll.filter(t => t.attempted) : pastAll
  const past     = byType(pastBase)

  const attemptedTotal = pastAll.filter(t => t.attempted).length
  const showTypeTag = series.hasTypes && activeType === 'all'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 16px 12px', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:T1, padding:0, flexShrink:0 }}>
          <ChevronLeft />
        </button>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:T1 }}>{series.label}</div>
          <div style={{ fontSize:11, color:T3, marginTop:1 }}>{series.tagline}</div>
        </div>
      </div>

      <div className="scroll" style={{ flex:1, padding:'16px 16px 32px' }}>

        {series.hasTypes && (
          <div className="scroll" style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, marginBottom:20 }}>
            {[{ id:'all', label:'All' }, ...NORCET_TYPES].map(t => {
              const isActive = activeType === t.id
              const count = t.id === 'all'
                ? upcomingAll.length + pastAll.length
                : upcomingAll.filter(x => x.type === t.id).length + pastAll.filter(x => x.type === t.id).length
              return (
                <button key={t.id} onClick={() => setActiveType(t.id)} style={{
                  flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
                  fontSize:11, fontWeight:isActive?700:500,
                  background: isActive ? P : 'white', color: isActive ? 'white' : T2,
                  border:`1.5px solid ${isActive ? P : BD}`, cursor:'pointer', whiteSpace:'nowrap',
                }}>
                  {t.label}
                  <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:10, background:isActive?'rgba(255,255,255,0.25)':BG2, color:isActive?'white':T3 }}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Upcoming Tests</div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:T3, fontSize:13 }}>No upcoming tests in this category right now</div>
          ) : (
            upcoming.map(t => (
              <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} label={showTypeTag ? NORCET_TYPE_LABEL[t.type] : null} />
            ))
          )}
        </div>

        <div style={{ borderTop:`1px solid ${BD}`, paddingTop:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T1 }}>Past Tests</span>
            <span style={{ fontSize:11, color:T3 }}><span style={{ color:G, fontWeight:700 }}>{attemptedTotal}</span>/{pastAll.length} attempted</span>
          </div>
          <button onClick={() => setMyAttemptsOnly(v => !v)} style={{
            width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:10, marginBottom:12,
            background: myAttemptsOnly ? GL : BG2, border:`1.5px solid ${myAttemptsOnly ? GB : BD}`, cursor:'pointer', textAlign:'left',
          }}>
            <div style={{ width:30, height:30, borderRadius:8, background: myAttemptsOnly ? G : 'white', border:`1px solid ${myAttemptsOnly ? G : BD}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={myAttemptsOnly ? 'white' : T3} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color: myAttemptsOnly ? G : T1 }}>
                {myAttemptsOnly ? 'Showing only tests you attempted' : 'Just find your test'}
              </div>
              <div style={{ fontSize:11, color: myAttemptsOnly ? G : T3, marginTop:1 }}>
                {myAttemptsOnly ? `${pastAll.filter(t => t.attempted).length} test${pastAll.filter(t => t.attempted).length === 1 ? '' : 's'} · tap to show all` : "Filter to only the tests you've taken"}
              </div>
            </div>
            {myAttemptsOnly ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
          </button>
          {past.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:T3, fontSize:13 }}>No past tests in this category</div>
          ) : (
            past.map(t => <PastCard key={t.id} test={t} label={showTypeTag ? NORCET_TYPE_LABEL[t.type] : null} />)
          )}
        </div>

      </div>
    </div>
  )
}
