import { seriesById, UPCOMING, PAST, PL, PD, PB, G, T1, T2, T3, BD } from '../data'
import { ChevronLeft, CalendarIcon } from '../icons'
import { UpcomingCard, PastCard } from '../components/Cards'
import { brandListForTier } from '../utils/tierBranding'

// The home screen's Full Mock / Subject-wise tiles include virtual series — slices of
// norcet's content by type, not standalone data. This resolves each tile id to its
// display identity plus which types of the source series it shows. 'scholarship' is
// the same Norcet Diagnostic tests wearing a tier-based name (see tierBranding.js).
function resolveSeries(seriesId, userTier) {
  if (seriesId === 'norcet_full') return {
    series: { label:'NASHTA for NORCET', tagline:'Full-length NORCET simulations & preboards' },
    sourceSeriesId: 'norcet', lockTypes: ['nashta_mains', 'third_year'],
  }
  if (seriesId === 'norcet_subject') return {
    series: { label:'NORCET Subject Preboards', tagline:'One subject at a time — FON, MSN, CHN & more' },
    sourceSeriesId: 'norcet', lockTypes: ['subject_preboard'],
  }
  if (seriesId === 'scholarship') return {
    series: userTier === 'free'
      ? { label:'Scholarship Test', tagline:'Free eligibility screening · Sent via WhatsApp' }
      : { label:'Diagnostic Test',  tagline:'Baseline assessment before your prep starts' },
    sourceSeriesId: 'norcet', lockTypes: ['diagnostic'],
  }
  return { series: seriesById(seriesId), sourceSeriesId: seriesId, lockTypes: null }
}

// No filter chips, no toggles, no per-card type tags — the tile a student came from
// already told them exactly what lives here (which exam body, full mock vs subject-wise),
// so inside there's nothing left to decode. Attempted tests sort first automatically,
// since that's what a single-attempt student is actually looking for.
export default function SeriesDetail({ seriesId, userTier, registeredIds, onRegisterClick, onOpenCalendar, onBack }) {
  const { series, sourceSeriesId, lockTypes } = resolveSeries(seriesId, userTier)

  const filterByLock = list => lockTypes ? list.filter(t => lockTypes.includes(t.type)) : list
  const upcoming = brandListForTier(filterByLock(UPCOMING[sourceSeriesId] || []), userTier)
  const pastAll  = brandListForTier(filterByLock(PAST[sourceSeriesId] || []), userTier)
  const past = [...pastAll].sort((a, b) => (b.attempted - a.attempted) || (b.ts - a.ts))

  const attemptedTotal = pastAll.filter(t => t.attempted).length

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
        <button onClick={() => onOpenCalendar(sourceSeriesId)} title="View this series' calendar" style={{ flexShrink:0, background:PL, border:'none', borderRadius:10, padding:9, display:'flex', cursor:'pointer' }}>
          <CalendarIcon size={16} color={PD} />
        </button>
      </div>

      <div className="scroll" style={{ flex:1, padding:'16px 16px 32px' }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Upcoming Tests</div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:T3, fontSize:13 }}>No upcoming tests right now</div>
          ) : (
            upcoming.map(t => (
              <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} />
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
            past.map(t => <PastCard key={t.id} test={t} />)
          )}
        </div>

      </div>
    </div>
  )
}
