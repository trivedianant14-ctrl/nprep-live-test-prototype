import { useState } from 'react'
import { DAILY_TESTS, seriesById, P, PD, PL, G, GL, T1, T2, T3, BD, BG2 } from '../data'

const RED = '#E5484D', RED_L = '#FDECED'

// The Daily Test feed rule: only the latest 10 tests stay in the feed, plus every test
// the student has attempted — those never expire, and older ones append after the feed.
// Unattempted tests older than the latest 10 auto-hide. Applied per series, since daily
// tests are organized series-wise just like live tests.
function applyRetention(tests, attemptedIds) {
  const isAttempted = t => t.attempted || attemptedIds.has(t.id)
  const sorted = [...tests].sort((a, b) => b.ts - a.ts)
  const latest = sorted.slice(0, 10)
  const olderAttempted = sorted.slice(10).filter(isAttempted)
  const hiddenCount = sorted.length - latest.length - olderAttempted.length
  return { visible: [...latest, ...olderAttempted], hiddenCount }
}

const dayOf = t => t.ts.getDate()
const monthOf = t => t.ts.toLocaleString('en-US', { month: 'short' })
const subjectOf = t => t.fullName.split('— ')[1] || t.fullName
const seriesTitle = t => {
  const s = seriesById(t.series)
  return `${(s ? s.label.replace(' Test Series', '') : t.series).toUpperCase()} Daily Test`
}
const metaOf = t => `${subjectOf(t)} · 20 MCQs · ${t.dur} · ${t.mks} Marks`

function DateTile({ test, variant }) {
  const bg = variant === 'live' ? PL : variant === 'done' ? GL : BG2
  const fg = variant === 'live' ? PD : variant === 'done' ? G : T2
  return (
    <div style={{ width:46, height:46, borderRadius:10, background:bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <div style={{ fontSize:16, fontWeight:700, color:fg, lineHeight:1 }}>{dayOf(test)}</div>
      <div style={{ fontSize:8.5, fontWeight:500, color:fg, marginTop:2 }}>{monthOf(test)}</div>
    </div>
  )
}

function Medal({ size = 22 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'#FFB020', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="white"><path d="M12 2l2.9 6.26 6.6.56-5 4.4 1.5 6.48L12 16.9 6 19.7l1.5-6.48-5-4.4 6.6-.56z"/></svg>
    </div>
  )
}

function AvatarStack() {
  const AV = [{ bg:PD, ch:'R' }, { bg:P, ch:'S' }, { bg:G, ch:'K' }]
  return (
    <div style={{ display:'flex', flexShrink:0 }}>
      {AV.map((a, i) => (
        <div key={i} style={{ width:20, height:20, borderRadius:'50%', background:a.bg, border:'1.5px solid white', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:8.5, fontWeight:600, marginLeft:i === 0 ? 0 : -6 }}>
          {a.ch}
        </div>
      ))}
    </div>
  )
}

// The featured card for today's test — three states matching the production designs:
// live (Attempt), paused (Continue Test), completed (View Report).
function HeroCard({ test, state, onAttempt, onResume, onViewReport }) {
  const done = state === 'done'
  return (
    <div style={{ background:done ? '#F2FAF6' : '#F5F9FF', border:`1px solid ${done ? '#BDE8D2' : '#C9DDF8'}`, borderRadius:14, padding:14, marginBottom:14 }}>
      <div style={{ display:'flex', gap:11, alignItems:'flex-start' }}>
        <DateTile test={test} variant={done ? 'done' : 'live'} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:done ? T1 : P, lineHeight:1.3 }}>{seriesTitle(test)}</div>
          <div style={{ fontSize:10.5, color:T3, marginTop:3 }}>{metaOf(test)}</div>
        </div>
        {done ? (
          <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, color:G, background:GL, padding:'4px 10px 4px 8px', borderRadius:20 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:G }} />
            Completed
          </span>
        ) : (
          <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, color:RED, background:RED_L, padding:'4px 10px 4px 8px', borderRadius:20 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:RED, boxShadow:'0 0 0 2px rgba(229,72,77,0.3)', animation:'livePulse 1.4s ease-in-out infinite' }} />
            LIVE
          </span>
        )}
      </div>

      {done ? (
        <button onClick={onViewReport} style={{ width:'100%', marginTop:12, padding:'10px', borderRadius:24, background:'white', color:P, border:`1px solid ${P}`, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          View Report
        </button>
      ) : state === 'paused' ? (
        <button onClick={onResume} style={{ width:'100%', marginTop:12, padding:'11px', borderRadius:24, background:P, color:'white', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
          Continue Test
        </button>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
          <AvatarStack />
          <span style={{ flex:1, fontSize:10.5, color:T2 }}>
            <span style={{ fontWeight:600, color:T1 }}>{test.attemptedToday?.toLocaleString() || '450+'}</span> Attempted today
          </span>
          <button onClick={() => onAttempt(test)} style={{ flexShrink:0, padding:'9px 26px', borderRadius:24, background:'white', color:P, border:`1px solid ${P}`, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
            Attempt
          </button>
        </div>
      )}
    </div>
  )
}

function PastRow({ test, attempted, onOpenReport }) {
  return (
    <div onClick={attempted ? onOpenReport : undefined}
      style={{ background:'white', border:`1px solid ${BD}`, borderRadius:12, padding:'10px 12px', marginBottom:8, display:'flex', alignItems:'center', gap:11, cursor: attempted ? 'pointer' : 'default' }}>
      <DateTile test={test} variant="past" />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12.5, fontWeight:600, color:T1, lineHeight:1.3 }}>{seriesTitle(test)}</div>
        <div style={{ fontSize:10, color:T3, marginTop:2 }}>{metaOf(test)}</div>
      </div>
      {attempted ? (
        <Medal />
      ) : (
        <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color:T3 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:T3 }} />
          Missed
        </span>
      )}
    </div>
  )
}

// The medal on an attempted row (and View Report on the hero) opens this — a rich
// report when the attempt ran in this session, or the stored score for seeded data.
function ReportModal({ test, results, onClose }) {
  return (
    <div className="popup-overlay">
      <div className="popup">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <Medal size={30} />
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T1 }}>Daily Test Report</div>
            <div style={{ fontSize:10.5, color:T3, marginTop:1 }}>{subjectOf(test)} · {test.date}</div>
          </div>
        </div>
        {results ? (
          <>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <div style={{ flex:1, background:BG2, borderRadius:10, padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:700, color:PD }}>{results.score}<span style={{ fontSize:11, fontWeight:500, color:T3 }}>/{test.mks}</span></div>
                <div style={{ fontSize:9.5, color:T3, marginTop:2 }}>Score</div>
              </div>
              <div style={{ flex:1, background:BG2, borderRadius:10, padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:700, color:PD }}>{results.accuracy}%</div>
                <div style={{ fontSize:9.5, color:T3, marginTop:2 }}>Accuracy</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[{ label:'Correct', value:results.correct, color:G }, { label:'Wrong', value:results.wrong, color:RED }, { label:'Skipped', value:results.unattempted, color:T3 }].map(c => (
                <div key={c.label} style={{ flex:1, border:`1px solid ${BD}`, borderRadius:10, padding:'10px 6px', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:c.color }}>{c.value}</div>
                  <div style={{ fontSize:9, color:c.color, fontWeight:500, marginTop:2 }}>{c.label}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background:BG2, borderRadius:10, padding:'16px 12px', textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:24, fontWeight:700, color:PD }}>{test.score}<span style={{ fontSize:12, fontWeight:500, color:T3 }}>/{test.mks}</span></div>
            <div style={{ fontSize:10, color:T3, marginTop:3 }}>Score</div>
          </div>
        )}
        <button onClick={onClose} style={{ width:'100%', padding:'11px', borderRadius:24, background:P, color:'white', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          Close
        </button>
      </div>
    </div>
  )
}

const FILTERS = [
  { id:'all',         label:'All' },
  { id:'attempted',   label:'Attempted' },
  { id:'unattempted', label:'Unattempted' },
  { id:'paused',      label:'Paused' },
]

export default function DailyTests({ dailyAttemptedIds, dailyResults, pausedIds, onAttempt, onResume }) {
  const [filter, setFilter] = useState('all')
  const [report, setReport] = useState(null) // { test, results }

  const isAttempted = t => t.attempted || dailyAttemptedIds.has(t.id)

  // Today's live test is the hero card; everything else lists under Past Tests.
  const hero = DAILY_TESTS.find(t => t.liveNow)
  const heroState = hero ? (isAttempted(hero) ? 'done' : pausedIds.has(hero.id) ? 'paused' : 'live') : null
  const heroVisible = hero && (
    filter === 'all' ||
    (filter === 'attempted' && heroState === 'done') ||
    (filter === 'unattempted' && heroState === 'live') ||
    (filter === 'paused' && heroState === 'paused')
  )

  const rowPassesFilter = t => {
    if (filter === 'all') return true
    if (filter === 'attempted') return isAttempted(t)
    if (filter === 'unattempted') return !isAttempted(t)
    return false // paused only ever applies to today's live test
  }

  const bySeries = {}
  DAILY_TESTS.filter(t => !t.liveNow).forEach(t => { (bySeries[t.series] = bySeries[t.series] || []).push(t) })
  const sections = Object.entries(bySeries).map(([seriesId, tests]) => {
    const { visible, hiddenCount } = applyRetention(tests, dailyAttemptedIds)
    return { seriesId, rows: visible.filter(rowPassesFilter), hiddenCount }
  }).filter(s => s.rows.length > 0)

  const openReport = (test) => setReport({ test, results: dailyResults[test.id] || null })
  const nothingToShow = !heroVisible && sections.length === 0

  return (
    <div style={{ padding:'14px 16px 32px' }}>

      <div className="scroll" style={{ display:'flex', gap:7, overflowX:'auto', marginBottom:14 }}>
        {FILTERS.map(f => {
          const active = filter === f.id
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              flexShrink:0, padding:'6px 16px', borderRadius:20, fontSize:11.5, fontWeight:600, cursor:'pointer',
              background: active ? P : 'white', color: active ? 'white' : T2,
              border:`1px solid ${active ? P : BD}`, whiteSpace:'nowrap',
            }}>{f.label}</button>
          )
        })}
      </div>

      {heroVisible && (
        <HeroCard test={hero} state={heroState} onAttempt={onAttempt} onResume={() => onResume(hero)} onViewReport={() => openReport(hero)} />
      )}

      <div style={{ background:'#FAF0F8', borderRadius:12, padding:'11px 13px', display:'flex', gap:10, alignItems:'center', marginBottom:18 }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'#C2298A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 019.5 9 2.5 2.5 0 0112 6.5 2.5 2.5 0 0114.5 9a2.5 2.5 0 01-2.5 2.5z"/></svg>
        </div>
        <span style={{ fontSize:11, color:T1, lineHeight:1.5 }}>
          <span style={{ fontWeight:700 }}>18,500+ students</span> say daily tests help them strengthen topic-wise understanding.
        </span>
      </div>

      {sections.length > 0 && (
        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Past Tests</div>
      )}
      {sections.map(({ seriesId, rows, hiddenCount }) => {
        const series = seriesById(seriesId)
        return (
          <div key={seriesId} style={{ marginBottom:18 }}>
            <div style={{ fontSize:11.5, fontWeight:600, color:T2, marginBottom:8 }}>{series ? series.label.replace(' Test Series', '') : seriesId} Daily</div>
            {rows.map(t => (
              <PastRow key={t.id} test={t} attempted={isAttempted(t)} onOpenReport={() => openReport(t)} />
            ))}
            {filter === 'all' && hiddenCount > 0 && (
              <div style={{ fontSize:10, color:T3, padding:'2px 4px 0' }}>
                {hiddenCount} older unattempted {hiddenCount === 1 ? 'test' : 'tests'} auto-removed
              </div>
            )}
          </div>
        )
      })}

      {nothingToShow && (
        <div style={{ textAlign:'center', padding:'28px 20px', color:T3 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T2, marginBottom:4 }}>Nothing here yet</div>
          <div style={{ fontSize:11.5, lineHeight:1.5 }}>
            {filter === 'paused' ? 'Pause a test mid-attempt and it will wait for you here.' : 'No tests match this filter.'}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:7, alignItems:'flex-start', padding:'6px 4px 0' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill={P} style={{ flexShrink:0, marginTop:1 }}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>
        <span style={{ fontSize:10.5, color:T2, lineHeight:1.5 }}>
          Tests older than 10 days will be automatically removed. Tests you've attempted stay in your feed forever.
        </span>
      </div>

      {report && <ReportModal test={report.test} results={report.results} onClose={() => setReport(null)} />}
    </div>
  )
}
