import { seriesById, UPCOMING, PAST, NORCET_TYPE_LABEL, PL, PD, PB, G, T1, T2, T3, BD } from '../data'
import { ChevronLeft, CalendarIcon } from '../icons'
import { UpcomingCard, PastCard } from '../components/Cards'
import { brandListForTier } from '../utils/tierBranding'

// 'scholarship' isn't a real content series — it's the same Norcet Diagnostic tests,
// wearing a different name depending on the viewer's tier. See tierBranding.js.
function resolveSeries(seriesId, userTier) {
  if (seriesId !== 'scholarship') return { series: seriesById(seriesId), sourceSeriesId: seriesId, lockType: null }
  const isFree = userTier === 'free'
  return {
    series: isFree
      ? { id:'scholarship', label:'Scholarship Test', tagline:'Free eligibility screening · Sent via WhatsApp', bg:'#FDF0F7', color:'#9D174D', border:'#F9A8D4', hasTypes:false }
      : { id:'scholarship', label:'Diagnostic Test',  tagline:'Baseline assessment before your prep starts',    bg:PL,        color:PD,        border:PB,        hasTypes:false },
    sourceSeriesId: 'norcet',
    lockType: 'diagnostic',
  }
}

// No filter chips, no "show my attempts" toggle to tap — the series tile you came from
// already narrowed things to one exam body, so the only thing left to do inside it is
// show what's there. Attempted tests sort first automatically, since that's what a
// single-attempt student is actually looking for.
export default function SeriesDetail({ seriesId, userTier, registeredIds, onRegisterClick, onOpenCalendar, onBack }) {
  const { series, sourceSeriesId, lockType } = resolveSeries(seriesId, userTier)

  const filterByLock = list => lockType ? list.filter(t => t.type === lockType) : list
  const upcoming = brandListForTier(filterByLock(UPCOMING[sourceSeriesId] || []), userTier)
  const pastAll  = brandListForTier(filterByLock(PAST[sourceSeriesId] || []), userTier)
  const past = [...pastAll].sort((a, b) => (b.attempted - a.attempted) || (b.ts - a.ts))

  const attemptedTotal = pastAll.filter(t => t.attempted).length
  const showTypeTag = series.hasTypes

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 16px 12px', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:T1, padding:0, flexShrink:0 }}>
          <ChevronLeft />
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:700, color:T1 }}>{series.label}</div>
          <div style={{ fontSize:11, color:T3, marginTop:1 }}>{series.tagline}</div>
        </div>
        <button onClick={() => onOpenCalendar(sourceSeriesId)} title="View this series' calendar" style={{ flexShrink:0, background:'#EDF4FF', border:'1px solid #93B8F0', borderRadius:9, padding:8, display:'flex', cursor:'pointer' }}>
          <CalendarIcon size={16} color="#1A56B0" />
        </button>
      </div>

      <div className="scroll" style={{ flex:1, padding:'16px 16px 32px' }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Upcoming Tests</div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:T3, fontSize:13 }}>No upcoming tests right now</div>
          ) : (
            upcoming.map(t => (
              <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} label={showTypeTag ? NORCET_TYPE_LABEL[t.type] : null} />
            ))
          )}
        </div>

        <div style={{ borderTop:`1px solid ${BD}`, paddingTop:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T1 }}>Past Tests</span>
            <span style={{ fontSize:11, color:T3 }}><span style={{ color:G, fontWeight:700 }}>{attemptedTotal}</span>/{pastAll.length} attempted</span>
          </div>
          {past.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:T3, fontSize:13 }}>No past tests yet</div>
          ) : (
            past.map(t => <PastCard key={t.id} test={t} label={showTypeTag ? NORCET_TYPE_LABEL[t.type] : null} />)
          )}
        </div>

      </div>
    </div>
  )
}
