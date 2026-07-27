import { LIVE_TEST, DAILY_TESTS, PL, PD, P, T1, T2, T3, BD, BG2 } from '../data'
import { CalendarIcon, BellIcon } from '../icons'
import { getLifecyclePhase } from '../utils/lifecycle'

const CATEGORIES = ['PYQ Test', 'Subject Test', 'Daily Test', 'Mini Test', 'Live Test']

const NAV = [
  { id:'home',   label:'Home',   icon:<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/> },
  { id:'qbank',  label:'QBank',  icon:<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></> },
  { id:'videos', label:'Videos', icon:<><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></> },
  { id:'tests',  label:'Tests',  icon:<><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></> },
  { id:'buy',    label:'Buy',    icon:<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></> },
]

// Persistent desktop chrome — sidebar + top bar + category tab row — shared by every
// web-view screen (home, daily, series detail, calendar) so the whole flow is one
// coherent web app rather than a mobile card floating on a page.
export default function DesktopShell({ activeCategory, onSelectCategory, userTier, setUserTier, onOpenCalendar, dailyAttemptedIds, children }) {
  const officialLive = getLifecyclePhase(LIVE_TEST) === 'live'
  const dailyLiveNow = DAILY_TESTS.some(t => t.liveNow && !t.attempted && !(dailyAttemptedIds && dailyAttemptedIds.has(t.id)))

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', background:BG2, fontFamily:"'Poppins', sans-serif" }}>
      {/* Sidebar */}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{n.icon}</svg>
              {n.label}
            </div>
          )
        })}
        <div style={{ marginTop:'auto', background:PL, borderRadius:12, padding:'14px', textAlign:'center' }}>
          <div style={{ fontSize:12.5, fontWeight:600, color:PD, marginBottom:4 }}>NPrep Pro</div>
          <div style={{ fontSize:10.5, color:T2, lineHeight:1.5, marginBottom:10 }}>Unlock every live test &amp; full analysis.</div>
          <button style={{ width:'100%', padding:'8px', borderRadius:20, background:P, color:'white', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>Upgrade</button>
        </div>
      </aside>

      {/* Main column */}
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
              <button key={cat} onClick={() => onSelectCategory(cat)} style={{
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
          {children}
        </div>
      </div>
    </div>
  )
}
