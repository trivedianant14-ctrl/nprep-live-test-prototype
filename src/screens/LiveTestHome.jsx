import { useState } from 'react'
import { LIVE_TEST, SERIES, SERIES_GROUPS, UPCOMING, PAST, PL, PD, P, T1, T2, T3, BD, seriesById } from '../data'
import { CalendarIcon } from '../icons'
import { UpcomingCard, SeriesTile } from '../components/Cards'
import LiveTestBanner from '../components/LiveTestBanner'
import { ordinal } from '../utils/format'
import { getLifecyclePhase } from '../utils/lifecycle'
import { brandListForTier } from '../utils/tierBranding'

const PREVIEW_PHASES = [
  { id: null,            label: 'Auto' },
  { id: 'upcoming',      label: 'Upcoming' },
  { id: 'starting_soon', label: 'Starting Soon' },
  { id: 'live',          label: 'Live' },
  { id: 'ended',         label: 'Ended' },
  { id: 'results',       label: 'Results' },
]

// Slices a series' tests down to what one home tile represents — either the whole
// series (rrb/kgmu) or one type-lane of norcet (full mocks, subject preboards,
// diagnostics), matching how SeriesDetail resolves the same virtual ids.
function testsForTile(map, tile) {
  const list = map[tile.sourceSeriesId] || []
  return tile.types ? list.filter(t => tile.types.includes(t.type)) : list
}

export default function LiveTestHome({ registeredIds, onRegisterClick, onJoined, liveTestAttempted, onOpenSeries, onOpenCalendar, lastAttempt, userTier }) {
  const [previewPhase, setPreviewPhase] = useState(null)

  // Most time-sensitive tests across every series, sorted by soonest registration
  // deadline — this is the "Upcoming Tests" preview from the wireframe, but instead of
  // being empty it surfaces exactly what needs a decision right now.
  const allUpcoming = Object.entries(UPCOMING).flatMap(([seriesId, tests]) =>
    tests.map(t => ({ ...t, seriesId }))
  )
  const topUpcoming = brandListForTier(
    [...allUpcoming].sort((a, b) => a.regCloses - b.regCloses).slice(0, 2),
    userTier
  )

  // The Scholarship/Diagnostic tile is the same Diagnostic content living inside
  // Norcet, wearing a different name depending on who's looking — see SeriesDetail's
  // 'scholarship' special-case for the matching drill-down.
  const scholarshipTile = userTier === 'free'
    ? { id:'scholarship', label:'Scholarship Test', tagline:'Free eligibility screening · via WhatsApp' }
    : { id:'scholarship', label:'Diagnostic Test',  tagline:'Baseline assessment before your prep starts' }
  const resolveTile = (tile) => {
    if (tile.id === 'scholarship') return { ...tile, ...scholarshipTile }
    if (tile.label) return tile
    return { ...tile, ...seriesById(tile.id), id: tile.id }
  }

  // The official live test is a NORCET full mock — while it's live, its home tile
  // carries the red blinking dot so the series lights up, not just the banner.
  const officialLive = getLifecyclePhase(LIVE_TEST) === 'live'

  return (
    <div style={{ padding:'16px 16px 32px' }}>

      {/* Live Now — an automated banner, not a hardcoded state. It renders whichever
          lifecycle phase the test's real schedule says it's in right now; the row below
          only overrides that for previewing the other phases in this prototype. */}
      <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Live Now</div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2, marginBottom:12 }}>
        <span style={{ fontSize:10, color:T3, fontWeight:600, alignSelf:'center', flexShrink:0 }}>Preview:</span>
        {PREVIEW_PHASES.map(p => {
          const active = previewPhase === p.id
          return (
            <button key={p.label} onClick={() => setPreviewPhase(p.id)} style={{
              flexShrink:0, padding:'4px 10px', borderRadius:20, fontSize:10.5, fontWeight:active?700:500,
              background: active ? P : 'white', color: active ? 'white' : T2,
              border:`1px solid ${active ? P : BD}`, cursor:'pointer', whiteSpace:'nowrap',
            }}>{p.label}</button>
          )
        })}
      </div>
      <LiveTestBanner test={LIVE_TEST} onJoin={onJoined} attempted={liveTestAttempted} phaseOverride={previewPhase} />

      {/* Your Progress + Recommended for You — surfaced right on Home, not buried inside a
          one-time results screen. Adaptive-learning research is consistent on this: apps
          that resurface a student's weak area as an immediate next action (not just report
          it once and move on) are what actually close the loop. */}
      {lastAttempt && (
        <div style={{ borderTop:`1px solid ${BD}`, paddingTop:16, marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Your Last Attempt</div>
          <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'14px 14px 12px' }}>
              <div style={{ fontSize:12, color:T2, marginBottom:10 }}>{lastAttempt.testName}</div>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:700, color:PD }}>{lastAttempt.score}</div>
                  <div style={{ fontSize:9.5, color:T3, fontWeight:500, marginTop:2 }}>Score</div>
                </div>
                <div style={{ flex:1, textAlign:'center', borderLeft:`1px solid ${BD}`, borderRight:`1px solid ${BD}` }}>
                  <div style={{ fontSize:18, fontWeight:700, color:PD }}>{lastAttempt.percentile}{ordinal(lastAttempt.percentile)}</div>
                  <div style={{ fontSize:9.5, color:T3, fontWeight:500, marginTop:2 }}>Percentile</div>
                </div>
                <div style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:700, color:PD }}>~{lastAttempt.air.toLocaleString()}</div>
                  <div style={{ fontSize:9.5, color:T3, fontWeight:500, marginTop:2 }}>Est. AIR</div>
                </div>
              </div>
            </div>
            <div style={{ borderTop:`1px solid ${BD}`, padding:'11px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11.5, color:T2, flex:1, lineHeight:1.5 }}>
                <span style={{ fontWeight:700, color:T1 }}>{lastAttempt.weakestSection.name}</span> was your weakest section.
              </span>
              <button onClick={() => onOpenSeries('norcet_subject')} style={{ flexShrink:0, padding:'8px 16px', borderRadius:20, background:P, color:'white', border:'none', fontSize:11.5, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                Practice →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Tests */}
      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:16, marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Upcoming Tests</div>
        {topUpcoming.map(t => (
          <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} label={SERIES.find(s => s.id === t.seriesId)?.label} />
        ))}
      </div>

      {/* Tests Calendar */}
      <button onClick={onOpenCalendar}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, background:'white', border:`1px solid ${BD}`, borderRadius:14, padding:'13px 14px', cursor:'pointer', textAlign:'left', marginBottom:24 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:PL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <CalendarIcon size={16} color={PD} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T1 }}>Tests Calendar</div>
          <div style={{ fontSize:10.5, color:T3, marginTop:1 }}>Every upcoming test, by month</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Past Tests — Full Mock and Subject-wise lanes. A student decides which test
          to open right here (tile label + tagline carry the identity); inside a series
          there are deliberately no further tags or filters to read. */}
      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:12 }}>Past Tests</div>
        {SERIES_GROUPS.map(group => (
          <div key={group.id} style={{ marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:700, color:T2 }}>{group.label}</span>
              <span style={{ fontSize:10.5, color:T3 }}>{group.sub}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {group.tiles.map(rawTile => {
                const tile = resolveTile(rawTile)
                const past = testsForTile(PAST, rawTile)
                const upcoming = testsForTile(UPCOMING, rawTile)
                return (
                  <SeriesTile
                    key={tile.id}
                    series={tile}
                    pastTotal={past.length}
                    attempted={past.filter(t => t.attempted).length}
                    upcomingCount={upcoming.length}
                    isLive={officialLive && tile.id === 'norcet_full'}
                    onClick={() => onOpenSeries(tile.id)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
