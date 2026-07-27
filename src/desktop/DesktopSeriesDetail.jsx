import { seriesById, UPCOMING, PAST, PL, PD, G, T1, T2, T3, BD } from '../data'
import { CalendarIcon } from '../icons'
import { UpcomingCard, PastCard } from '../components/Cards'
import { brandListForTier } from '../utils/tierBranding'

// Mirrors the mobile SeriesDetail's virtual-series resolution (see that file for notes).
function resolveSeries(seriesId, userTier) {
  if (seriesId === 'norcet_full') return { series: { label:'NASHTA for NORCET', tagline:'Full-length NORCET simulations & preboards' }, sourceSeriesId:'norcet', lockTypes:['nashta_mains','third_year'] }
  if (seriesId === 'norcet_subject') return { series: { label:'NORCET Subject Preboards', tagline:'One subject at a time — FON, MSN, CHN & more' }, sourceSeriesId:'norcet', lockTypes:['subject_preboard'] }
  if (seriesId === 'scholarship') return {
    series: userTier === 'free' ? { label:'Scholarship Test', tagline:'Free eligibility screening · Sent via WhatsApp' } : { label:'Diagnostic Test', tagline:'Baseline assessment before your prep starts' },
    sourceSeriesId:'norcet', lockTypes:['diagnostic'],
  }
  return { series: seriesById(seriesId), sourceSeriesId: seriesId, lockTypes: null }
}

export default function DesktopSeriesDetail({ seriesId, userTier, registeredIds, onRegisterClick, onOpenCalendar, onBack }) {
  const { series, sourceSeriesId, lockTypes } = resolveSeries(seriesId, userTier)
  const filterByLock = list => lockTypes ? list.filter(t => lockTypes.includes(t.type)) : list
  const upcoming = brandListForTier(filterByLock(UPCOMING[sourceSeriesId] || []), userTier)
  const pastAll  = brandListForTier(filterByLock(PAST[sourceSeriesId] || []), userTier)
  const past = [...pastAll].sort((a, b) => (b.attempted - a.attempted) || (b.ts - a.ts))
  const attemptedTotal = pastAll.filter(t => t.attempted).length

  const grid = { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:14, alignItems:'start' }

  return (
    <div style={{ maxWidth:1180, margin:'0 auto' }}>
      {/* Breadcrumb / header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22 }}>
        <button onClick={onBack} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'white', border:`1px solid ${BD}`, borderRadius:20, padding:'7px 14px', cursor:'pointer', color:T2, fontSize:12.5, fontWeight:600 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Tests
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:22, fontWeight:700, color:T1, letterSpacing:'-0.01em' }}>{series.label}</div>
          <div style={{ fontSize:13, color:T3, marginTop:2 }}>{series.tagline}</div>
        </div>
        <button onClick={() => onOpenCalendar(sourceSeriesId)} title="View this series' calendar" style={{ display:'inline-flex', alignItems:'center', gap:8, background:PL, border:'none', borderRadius:10, padding:'10px 14px', cursor:'pointer', color:PD, fontSize:12.5, fontWeight:600 }}>
          <CalendarIcon size={16} color={PD} /> Calendar
        </button>
      </div>

      {/* Upcoming */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:14 }}>Upcoming Tests</div>
        {upcoming.length === 0 ? (
          <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:14, textAlign:'center', padding:'32px 0', color:T3, fontSize:13.5 }}>No upcoming tests right now</div>
        ) : (
          <div style={grid}>
            {upcoming.map(t => <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} />)}
          </div>
        )}
      </div>

      {/* Past */}
      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:22 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontSize:15, fontWeight:700, color:T1 }}>Past Tests</span>
          <span style={{ fontSize:12.5, color:T3 }}><span style={{ color:G, fontWeight:700 }}>{attemptedTotal}</span>/{pastAll.length} attempted</span>
        </div>
        {past.length === 0 ? (
          <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:14, textAlign:'center', padding:'32px 0', color:T3, fontSize:13.5 }}>No past tests yet</div>
        ) : (
          <div style={grid}>{past.map(t => <PastCard key={t.id} test={t} />)}</div>
        )}
      </div>
    </div>
  )
}
