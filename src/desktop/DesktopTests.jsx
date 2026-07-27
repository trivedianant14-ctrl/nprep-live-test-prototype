import { useState } from 'react'
import { LIVE_TEST, SERIES, SERIES_GROUPS, UPCOMING, PAST, DAILY_TESTS, PL, PD, P, T1, T2, T3, BD, BG2, seriesById } from '../data'
import { CalendarIcon, BellIcon } from '../icons'
import { UpcomingCard, SeriesTile } from '../components/Cards'
import { ProgressTrend } from '../screens/LiveTestHome'
import LiveTestBanner from '../components/LiveTestBanner'
import DailyTests from '../screens/DailyTests'
import { ordinal } from '../utils/format'
import { getLifecyclePhase } from '../utils/lifecycle'
import { brandListForTier } from '../utils/tierBranding'

const CATEGORIES = ['PYQ Test', 'Subject Test', 'Daily Test', 'Mini Test', 'Live Test']

// Same virtual-tile resolution the mobile home uses — kept local so the desktop layout
// is self-contained (see LiveTestHome for the annotated original).
function testsForTile(map, tile) {
  const list = map[tile.sourceSeriesId] || []
  return tile.types ? list.filter(t => tile.types.includes(t.type)) : list
}

const NAV = [
  { id:'home',   label:'Home',   icon:<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/> },
  { id:'qbank',  label:'QBank',  icon:<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></> },
  { id:'videos', label:'Videos', icon:<><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></> },
  { id:'tests',  label:'Tests',  icon:<><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></> },
  { id:'buy',    label:'Buy',    icon:<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></> },
]

function NavIcon({ children }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}

export default function DesktopTests({
  activeCategory, setActiveCategory, registeredIds, onRegisterClick, onJoined, liveTestAttempted,
  onOpenSeries, onOpenCalendar, lastAttempt, attemptHistory, userTier, setUserTier,
  dailyAttemptedIds, dailyResults, pausedIds, onDailyAttempt, onDailyResume,
}) {
  const [pastTestView, setPastTestView] = useState('full_mock')

  const allUpcoming = Object.entries(UPCOMING).flatMap(([seriesId, tests]) => tests.map(t => ({ ...t, seriesId })))
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
  const dailyLiveNow = DAILY_TESTS.some(t => t.liveNow && !t.attempted && !dailyAttemptedIds.has(t.id))

  const group = SERIES_GROUPS.find(g => g.id === pastTestView)

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', background:BG2, fontFamily:"'Poppins', sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{ width:232, flexShrink:0, background:'white', borderRight:`1px solid ${BD}`, display:'flex', flexDirection:'column', padding:'20px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 8px 22px' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:PD, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:16 }}>N</div>
          <span style={{ fontSize:18, fontWeight:700, color:T1, letterSpacing:'-0.02em' }}>NPrep</span>
        </div>
        {NAV.map(n => {
          const active = n.id === 'tests'
          return (
            <div key={n.id} style={{
              display:'flex', alignItems:'center', gap:12, padding:'11px 12px', borderRadius:10, marginBottom:3,
              color: active ? P : T2, background: active ? PL : 'transparent',
              fontSize:13.5, fontWeight: active ? 600 : 500, cursor:'pointer',
            }}>
              <NavIcon>{n.icon}</NavIcon>{n.label}
            </div>
          )
        })}
        <div style={{ marginTop:'auto', background:PL, borderRadius:12, padding:'14px', textAlign:'center' }}>
          <div style={{ fontSize:12.5, fontWeight:600, color:PD, marginBottom:4 }}>NPrep Pro</div>
          <div style={{ fontSize:10.5, color:T2, lineHeight:1.5, marginBottom:10 }}>Unlock every live test & full analysis.</div>
          <button style={{ width:'100%', padding:'8px', borderRadius:20, background:P, color:'white', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>Upgrade</button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Top bar */}
        <header style={{ flexShrink:0, height:60, background:'white', borderBottom:`1px solid ${BD}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px' }}>
          <div style={{ fontSize:18, fontWeight:700, color:T1 }}>Tests</div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ display:'inline-flex', background:BG2, borderRadius:20, padding:2, gap:2 }}>
              {[{ id:'free', label:'Free' }, { id:'paid', label:'Paid' }].map(o => {
                const active = userTier === o.id
                return (
                  <button key={o.id} onClick={() => setUserTier(o.id)} style={{
                    padding:'5px 14px', borderRadius:16, fontSize:11.5, fontWeight:active?600:500,
                    background: active ? P : 'transparent', color: active ? 'white' : T3, border:'none', cursor:'pointer',
                  }}>{o.label}</button>
                )
              })}
            </div>
            <button onClick={() => onOpenCalendar('all')} title="Test Calendar" style={{ background:'none', border:'none', color:T2, display:'flex', cursor:'pointer', padding:4 }}>
              <CalendarIcon size={20} color={T2} />
            </button>
            <button style={{ background:'none', border:'none', color:T2, display:'flex', cursor:'pointer', padding:4 }}><BellIcon /></button>
            <div style={{ width:36, height:36, borderRadius:'50%', background:PD, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:600, fontSize:14 }}>A</div>
          </div>
        </header>

        {/* Category tabs */}
        <div style={{ flexShrink:0, background:'white', borderBottom:`1px solid ${BD}`, display:'flex', gap:4, padding:'0 28px' }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat
            const hasLiveDot = (cat === 'Live Test' && officialLive) || (cat === 'Daily Test' && dailyLiveNow)
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                display:'inline-flex', alignItems:'center', gap:6, padding:'14px 16px', fontSize:13.5,
                fontWeight: active ? 600 : 500, color: active ? P : T2, background:'none', border:'none',
                borderBottom:`2px solid ${active ? P : 'transparent'}`, cursor:'pointer', whiteSpace:'nowrap',
              }}>
                {cat}
                {hasLiveDot && <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF3B30', boxShadow:'0 0 0 2px rgba(255,59,48,0.35)', animation:'livePulse 1.4s ease-in-out infinite' }} />}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="scroll" style={{ flex:1, padding:'24px 28px 40px' }}>
          {activeCategory === 'Live Test' ? (
            <div style={{ maxWidth:1180, margin:'0 auto', display:'grid', gridTemplateColumns:'minmax(0, 2.1fr) minmax(300px, 1fr)', gap:24, alignItems:'start' }}>

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
              <aside style={{ display:'flex', flexDirection:'column', gap:0 }}>
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
                    <UpcomingCard key={t.id} test={t} isRegistered={registeredIds.has(t.id)} onRegisterClick={onRegisterClick} label={SERIES.find(s => s.id === t.seriesId)?.label} />
                  ))}
                </div>
              </aside>
            </div>
          ) : activeCategory === 'Daily Test' ? (
            <div style={{ maxWidth:720, margin:'0 auto', background:'white', border:`1px solid ${BD}`, borderRadius:16, overflow:'hidden' }}>
              <DailyTests dailyAttemptedIds={dailyAttemptedIds} dailyResults={dailyResults} pausedIds={pausedIds} onAttempt={onDailyAttempt} onResume={onDailyResume} />
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60%', color:T3, gap:10 }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
              <div style={{ fontSize:15, fontWeight:600, color:T2 }}>{activeCategory}</div>
              <div style={{ fontSize:12.5, color:T3, textAlign:'center', maxWidth:240, lineHeight:1.5 }}>This prototype is scoped to Live Test &amp; Daily Test — {activeCategory} isn't built here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
