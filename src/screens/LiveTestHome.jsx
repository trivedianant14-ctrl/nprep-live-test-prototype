import { useState } from 'react'
import { LIVE_TEST, SERIES, UPCOMING, PAST, PL, PD, PB, P, T1, T2, T3, BD } from '../data'
import { CalendarIcon, PlusIcon } from '../icons'
import { UpcomingCard, SeriesTile } from '../components/Cards'
import LiveTestBanner from '../components/LiveTestBanner'
import { ordinal } from '../utils/format'
import { brandListForTier } from '../utils/tierBranding'

const PREVIEW_PHASES = [
  { id: null,            label: 'Auto' },
  { id: 'upcoming',      label: 'Upcoming' },
  { id: 'starting_soon', label: 'Starting Soon' },
  { id: 'live',          label: 'Live' },
  { id: 'ended',         label: 'Ended' },
  { id: 'results',       label: 'Results' },
]

export default function LiveTestHome({ registeredIds, onRegisterClick, onJoined, joined, onOpenSeries, onOpenCalendar, onCreateTest, lastAttempt, userTier }) {
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

  // The 4th Past-Tests tile is the same Diagnostic content living inside Norcet, just
  // wearing a different name depending on who's looking — see SeriesDetail's
  // 'scholarship' special-case for the matching drill-down.
  const diagUpcoming = (UPCOMING.norcet || []).filter(t => t.type === 'diagnostic')
  const diagPast = (PAST.norcet || []).filter(t => t.type === 'diagnostic')
  const scholarshipTile = userTier === 'free'
    ? { id:'scholarship', label:'Scholarship Test', tagline:'Free eligibility screening · via WhatsApp', bg:'#FDF0F7', color:'#9D174D', border:'#F9A8D4' }
    : { id:'scholarship', label:'Diagnostic Test',  tagline:'Baseline assessment before your prep starts', bg:PL, color:PD, border:PB }
  const displaySeries = SERIES.map(s => s.id === 'scholarship' ? scholarshipTile : s)

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
      <LiveTestBanner test={LIVE_TEST} onJoin={onJoined} joined={joined} phaseOverride={previewPhase} />

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
                  <div style={{ fontSize:18, fontWeight:800, color:P }}>{lastAttempt.score}</div>
                  <div style={{ fontSize:9.5, color:T3, fontWeight:600, marginTop:2 }}>Score</div>
                </div>
                <div style={{ flex:1, textAlign:'center', borderLeft:`1px solid ${BD}`, borderRight:`1px solid ${BD}` }}>
                  <div style={{ fontSize:18, fontWeight:800, color:P }}>{lastAttempt.percentile}{ordinal(lastAttempt.percentile)}</div>
                  <div style={{ fontSize:9.5, color:T3, fontWeight:600, marginTop:2 }}>Percentile</div>
                </div>
                <div style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:P }}>~{lastAttempt.air.toLocaleString()}</div>
                  <div style={{ fontSize:9.5, color:T3, fontWeight:600, marginTop:2 }}>Est. AIR</div>
                </div>
              </div>
            </div>
            <div style={{ borderTop:`1px solid ${BD}`, padding:'11px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11.5, color:T2, flex:1, lineHeight:1.5 }}>
                <span style={{ fontWeight:700, color:T1 }}>{lastAttempt.weakestSection.name}</span> was your weakest section.
              </span>
              <button onClick={() => onOpenSeries('norcet', 'subject_preboard')} style={{ flexShrink:0, padding:'8px 12px', borderRadius:8, background:P, color:'white', border:'none', fontSize:11.5, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
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

      {/* Tests Calendar + Create Your Own Test */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
        <button onClick={onOpenCalendar}
          style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8, background:'#EDF4FF', border:'1.5px solid #93B8F0', borderRadius:12, padding:'13px 14px', cursor:'pointer', textAlign:'left' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'#1A56B0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <CalendarIcon size={16} />
          </div>
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:'#1A56B0' }}>Tests Calendar</div>
            <div style={{ fontSize:10.5, color:T2, marginTop:1 }}>Every upcoming test, by month</div>
          </div>
        </button>
        <button onClick={onCreateTest}
          style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8, background:'#EEEDFE', border:`1.5px dashed ${PB}`, borderRadius:12, padding:'13px 14px', cursor:'pointer', textAlign:'left' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:P, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <PlusIcon size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:PD }}>Create Your Own Test</div>
            <div style={{ fontSize:10.5, color:T2, marginTop:1 }}>Full mock or subject-wise</div>
          </div>
        </button>
      </div>

      {/* Past Tests — series tiles */}
      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:12 }}>Past Tests</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {displaySeries.map(s => {
            const isScholarship = s.id === 'scholarship'
            return (
              <SeriesTile
                key={s.id}
                series={s}
                pastTotal={isScholarship ? diagPast.length : (PAST[s.id] || []).length}
                attempted={isScholarship ? diagPast.filter(t => t.attempted).length : (PAST[s.id] || []).filter(t => t.attempted).length}
                upcomingCount={isScholarship ? diagUpcoming.length : (UPCOMING[s.id] || []).length}
                onClick={() => onOpenSeries(s.id)}
              />
            )
          })}
        </div>
      </div>

    </div>
  )
}
