import { useState } from 'react'
import { LIVE_TEST, SERIES, SERIES_GROUPS, UPCOMING, PAST, PL, PD, P, T1, T2, T3, BD, BG2, seriesById } from '../data'
import { CalendarIcon } from '../icons'
import { UpcomingCard, SeriesTile } from '../components/Cards'
import { ProgressTrend } from '../screens/LiveTestHome'
import LiveTestBanner from '../components/LiveTestBanner'
import AlertsStrip from '../components/AlertsStrip'
import DailyTests from '../screens/DailyTests'
import { ordinal } from '../utils/format'
import { getLifecyclePhase } from '../utils/lifecycle'
import { brandListForTier } from '../utils/tierBranding'
import { computeAlerts } from '../utils/alerts'

// Same virtual-tile resolution the mobile home uses (see LiveTestHome for the annotated original).
function testsForTile(map, tile) {
  const list = map[tile.sourceSeriesId] || []
  return tile.types ? list.filter(t => tile.types.includes(t.type)) : list
}

// Content for the Tests category tabs on the web view — rendered inside DesktopShell,
// which owns the sidebar / top bar / tab row. Live Test is a two-column dashboard;
// Daily Test reuses the shared DailyTests widget in its wide layout.
export default function DesktopTests({
  activeCategory, registeredIds, onRegisterClick, onJoined, liveTestAttempted,
  onOpenSeries, onOpenCalendar, lastAttempt, attemptHistory, userTier,
  dailyLiveNow, dismissedAlerts = new Set(), onDismissAlert = () => {}, onGoDaily,
  dailyAttemptedIds, dailyResults, pausedIds, onDailyAttempt, onDailyResume,
}) {
  const [pastTestView, setPastTestView] = useState('full_mock')

  const allUpcoming = Object.entries(UPCOMING).flatMap(([seriesId, tests]) => tests.map(t => ({ ...t, seriesId })))
  const alertList = computeAlerts({ upcoming: allUpcoming, registeredIds, dailyLive: dailyLiveNow, userTier })
  const topUpcoming = brandListForTier([...allUpcoming].sort((a, b) => a.regCloses - b.regCloses).slice(0, 3), userTier)

  const scholarshipTile = userTier === 'free'
    ? { id:'scholarship', label:'Scholarship Test', tagline:'Free eligibility screening · via WhatsApp' }
    : { id:'scholarship', label:'Diagnostic Test',  tagline:'Baseline assessment before your prep starts' }
  const resolveTile = (tile) => {
    if (tile.id === 'scholarship') return { ...tile, ...scholarshipTile }
    if (tile.label) return tile
    return { ...tile, ...seriesById(tile.id), id: tile.id }
  }
  const officialLive = getLifecyclePhase(LIVE_TEST) === 'live'
  const group = SERIES_GROUPS.find(g => g.id === pastTestView)

  if (activeCategory === 'Daily Test') {
    return (
      <div style={{ maxWidth:1080, margin:'0 auto' }}>
        <DailyTests wide dailyAttemptedIds={dailyAttemptedIds} dailyResults={dailyResults} pausedIds={pausedIds} onAttempt={onDailyAttempt} onResume={onDailyResume} />
      </div>
    )
  }

  if (activeCategory !== 'Live Test') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60%', color:T3, gap:10 }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
        <div style={{ fontSize:15, fontWeight:600, color:T2 }}>{activeCategory}</div>
        <div style={{ fontSize:12.5, color:T3, textAlign:'center', maxWidth:240, lineHeight:1.5 }}>This prototype is scoped to Live Test &amp; Daily Test — {activeCategory} isn't built here.</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth:1180, margin:'0 auto' }}>
      <AlertsStrip alerts={alertList} dismissed={dismissedAlerts} onDismiss={onDismissAlert} onRegister={onRegisterClick} onGoDaily={onGoDaily} style={{ marginBottom:20 }} />
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 2.1fr) minmax(300px, 1fr)', gap:24, alignItems:'start' }}>
      {/* Main column */}
      <div>
        <LiveTestBanner test={LIVE_TEST} onJoin={onJoined} attempted={liveTestAttempted} phaseOverride={null} />

        <div style={{ marginTop:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T1 }}>Test Series</div>
            <div style={{ display:'flex', background:BG2, borderRadius:12, padding:4, gap:4 }}>
              {[{ id:'full_mock', label:'Full Mock' }, { id:'subject', label:'Subject-wise' }].map(opt => {
                const isActive = pastTestView === opt.id
                return (
                  <button key={opt.id} onClick={() => setPastTestView(opt.id)} style={{
                    padding:'7px 16px', borderRadius:10, border:'none', cursor:'pointer',
                    background: isActive ? 'white' : 'transparent', color: isActive ? T1 : T2,
                    fontSize:12.5, fontWeight: isActive ? 600 : 500, boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>{opt.label}</button>
                )
              })}
            </div>
          </div>
          <div style={{ fontSize:11.5, color:T3, marginBottom:14 }}>{group.sub}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14 }}>
            {group.tiles.map(rawTile => {
              const tile = resolveTile(rawTile)
              const past = testsForTile(PAST, rawTile)
              const upcoming = testsForTile(UPCOMING, rawTile)
              return (
                <SeriesTile key={tile.id} series={tile}
                  pastTotal={past.length} attempted={past.filter(t => t.attempted).length}
                  upcomingCount={upcoming.length} isLive={officialLive && tile.id === 'norcet_full'}
                  onClick={() => onOpenSeries(tile.id)} />
              )
            })}
          </div>
        </div>
      </div>

      {/* Aside column */}
      <aside style={{ display:'flex', flexDirection:'column' }}>
        <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:14, padding:'4px 16px 16px' }}>
          <ProgressTrend history={attemptHistory} />
        </div>

        {lastAttempt && (
          <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:14, overflow:'hidden', marginTop:16 }}>
            <div style={{ padding:'14px 16px 12px' }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:T1, marginBottom:10 }}>Your Last Attempt</div>
              <div style={{ fontSize:11.5, color:T2, marginBottom:10 }}>{lastAttempt.testName}</div>
              <div style={{ display:'flex', gap:8 }}>
                {[{ v:lastAttempt.score, l:'Score' }, { v:`${lastAttempt.percentile}${ordinal(lastAttempt.percentile)}`, l:'Percentile' }, { v:`~${lastAttempt.air.toLocaleString()}`, l:'Est. AIR' }].map((s, i) => (
                  <div key={s.l} style={{ flex:1, textAlign:'center', borderLeft: i ? `1px solid ${BD}` : 'none', paddingLeft: i ? 6 : 0 }}>
                    <div style={{ fontSize:17, fontWeight:700, color:PD }}>{s.v}</div>
                    <div style={{ fontSize:9, color:T3, fontWeight:500, marginTop:2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop:`1px solid ${BD}`, padding:'11px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11, color:T2, flex:1, lineHeight:1.5 }}><span style={{ fontWeight:700, color:T1 }}>{lastAttempt.weakestSection.name}</span> was weakest.</span>
              <button onClick={() => onOpenSeries('norcet_subject')} style={{ flexShrink:0, padding:'7px 14px', borderRadius:20, background:P, color:'white', border:'none', fontSize:11, fontWeight:600, cursor:'pointer' }}>Practice →</button>
            </div>
          </div>
        )}

        <button onClick={() => onOpenCalendar('all')} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, background:'white', border:`1px solid ${BD}`, borderRadius:14, padding:'14px 16px', cursor:'pointer', textAlign:'left', marginTop:16 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:PL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><CalendarIcon size={16} color={PD} /></div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T1 }}>Tests Calendar</div>
            <div style={{ fontSize:10.5, color:T3, marginTop:1 }}>Every upcoming test, by month</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:12 }}>Upcoming Tests</div>
          {topUpcoming.map(t => (
            <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} label={SERIES.find(s => s.id === t.seriesId)?.label} desktop />
          ))}
        </div>
      </aside>
      </div>
    </div>
  )
}
