import { useState } from 'react'
import { UPCOMING, LIVE_TEST, DAILY_TESTS, P, T1, T2, T3, BD, BG2 } from './data'
import { BellIcon, CalendarIcon } from './icons'
import { getLifecyclePhase } from './utils/lifecycle'
import StatusBar from './components/StatusBar'
import LiveTestHome from './screens/LiveTestHome'
import SeriesDetail from './screens/SeriesDetail'
import TestCalendar from './screens/TestCalendar'
import DailyTests from './screens/DailyTests'
import ExamPreTest from './exam/ExamPreTest'
import ExamScreen from './exam/ExamScreen'
import { buildCustomTest } from './exam/customTest'
import { downloadIcsForTest } from './utils/ics'

const CATEGORIES = ['PYQ Test', 'Subject Test', 'Daily Test', 'Mini Test', 'Live Test']
const NAV_TABS = [
  { id:'home',   label:'Home',
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
  { id:'qbank',  label:'QBank',
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> },
  { id:'videos', label:'Videos',
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
  { id:'tests',  label:'Tests',
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg> },
  { id:'buy',    label:'Buy',
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> },
]

const CONFETTI = [
  { left:'8%',  color:'#FF6B6B', w:7,  h:7,  round:true,  delay:0,    dur:1.8 },
  { left:'18%', color:'#FFD93D', w:5,  h:12, round:false, delay:0.10, dur:2.0 },
  { left:'28%', color:'#3B6D11', w:8,  h:8,  round:true,  delay:0.05, dur:1.7 },
  { left:'38%', color:'#534AB7', w:11, h:5,  round:false, delay:0.15, dur:1.9 },
  { left:'48%', color:'#FF6B6B', w:7,  h:7,  round:true,  delay:0.20, dur:1.6 },
  { left:'58%', color:'#FFD93D', w:5,  h:11, round:false, delay:0,    dur:2.1 },
  { left:'68%', color:'#3B6D11', w:7,  h:7,  round:true,  delay:0.08, dur:1.8 },
  { left:'78%', color:'#534AB7', w:10, h:5,  round:false, delay:0.05, dur:2.0 },
  { left:'88%', color:'#FF6B6B', w:7,  h:7,  round:true,  delay:0.12, dur:1.7 },
]

const initialRegistered = new Set(
  Object.values(UPCOMING).flat().filter(t => t.registered).map(t => t.id)
)

export default function App() {
  const [activeCategory, setActiveCategory] = useState('Live Test')
  const [screen, setScreen] = useState('home') // 'home' | 'series' | 'calendar' | 'exampretest' | 'exam'
  const [activeSeriesId, setActiveSeriesId] = useState(null)
  const [registeredIds, setRegisteredIds] = useState(initialRegistered)
  const [activeModal, setActiveModal] = useState(null)
  const [examInterfaceMode, setExamInterfaceMode] = useState('nprep')
  const [reminders, setReminders] = useState({ oneDay:false, oneHour:false })
  const [lastAttempt, setLastAttempt] = useState(null)
  const [liveTestAttempted, setLiveTestAttempted] = useState(false) // official Live Test only — no re-attempts once true
  const [userTier, setUserTier] = useState('paid')
  const [customTest, setCustomTest] = useState(null) // null = official live test; otherwise a daily test slice
  const [dailyAttemptedIds, setDailyAttemptedIds] = useState(new Set())
  const [calendarFilter, setCalendarFilter] = useState('all')

  const openSeries = (id) => { setActiveSeriesId(id); setScreen('series') }
  const openCalendar = (filter = 'all') => { setCalendarFilter(filter); setScreen('calendar') }
  const goHome = () => setScreen('home')
  // A daily test is a one-section slice of the same question bank, run through the
  // same exam engine (and the same anti-cheating shuffle) as the official live test.
  const handleDailyAttempt = (test) => {
    setCustomTest({ ...buildCustomTest({ mode:'subject', selectedSectionIds:[test.sectionId], testName: test.fullName }), dailyTestId: test.id })
    setScreen('exampretest')
  }
  const isLiveNow = getLifecyclePhase(LIVE_TEST) === 'live'
  const dailyLiveNow = DAILY_TESTS.some(t => t.liveNow && !t.attempted && !dailyAttemptedIds.has(t.id))

  const handleRegisterClick = (test) => setActiveModal({ type:'confirm', test })
  const handleConfirm = () => {
    setRegisteredIds(prev => new Set([...prev, activeModal.test.id]))
    setReminders({ oneDay:false, oneHour:false })
    setActiveModal({ type:'success', test: activeModal.test })
  }
  const toggleReminder = (key) => setReminders(prev => ({ ...prev, [key]: !prev[key] }))

  if (screen === 'exampretest' || screen === 'exam') {
    return (
      <div className="phone-wrapper" style={{ width:'100%', height:'100%' }}>
        <div className="phone">
          {screen === 'exampretest' ? (
            <ExamPreTest
              onBack={() => { setCustomTest(null); goHome() }}
              onStart={(mode) => { setExamInterfaceMode(mode); setScreen('exam') }}
              meta={customTest?.meta}
              sectionCount={customTest ? customTest.sections.length : 5}
              sectionMinutes={18}
              totalMarks={customTest?.meta.totalMarks}
              showWebPrompt={!customTest}
            />
          ) : (
            <ExamScreen
              interfaceMode={examInterfaceMode}
              onExit={() => { setCustomTest(null); setScreen('home') }}
              onFinish={(results) => {
                setLastAttempt(results)
                if (!customTest) setLiveTestAttempted(true)
                else if (customTest.dailyTestId) setDailyAttemptedIds(prev => new Set([...prev, customTest.dailyTestId]))
              }}
              customQuestions={customTest?.questions}
              customSections={customTest?.sections}
              customMeta={customTest?.meta}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="phone-wrapper" style={{ width:'100%', height:'100%' }}>
      <div className="phone">
        <StatusBar />

        <div style={{ padding:'8px 20px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg, ${P}, #8B82E0)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:14 }}>A</div>
            <span style={{ fontSize:17, fontWeight:700, color:T1 }}>Tests</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'inline-flex', background:BG2, borderRadius:20, padding:2, gap:2 }}>
              {[{ id:'free', label:'Free' }, { id:'paid', label:'Paid' }].map(o => {
                const active = userTier === o.id
                return (
                  <button key={o.id} onClick={() => setUserTier(o.id)} style={{
                    padding:'4px 10px', borderRadius:16, fontSize:10.5, fontWeight:active?700:500,
                    background: active ? P : 'transparent', color: active ? 'white' : T3, border:'none', cursor:'pointer',
                  }}>{o.label}</button>
                )
              })}
            </div>
            <button onClick={() => openCalendar('all')} title="Test Calendar" style={{ position:'relative', background:'none', border:'none', color:T2, display:'flex', cursor:'pointer', padding:4 }}>
              <CalendarIcon size={20} color={T2} />
            </button>
            <button style={{ position:'relative', background:'none', border:'none', color:T2, display:'flex', cursor:'pointer', padding:4 }}>
              <BellIcon />
            </button>
          </div>
        </div>

        {screen === 'home' && (
          <div style={{ flexShrink:0, borderBottom:`1px solid ${BD}` }}>
            <div className="scroll" style={{ display:'flex', overflowX:'auto', padding:'0 4px' }}>
              {CATEGORIES.map(cat => {
                // Instagram-Live-style urgency: any tab with a test running right now
                // carries the red blinking dot — scoped to Daily/Mini/Live tests.
                const hasLiveDot = (cat === 'Live Test' && isLiveNow) || (cat === 'Daily Test' && dailyLiveNow)
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:5, padding:'10px 14px', fontSize:13, fontWeight:activeCategory===cat?700:500, color:activeCategory===cat?P:T2, background:'none', border:'none', borderBottom:`2px solid ${activeCategory===cat?P:'transparent'}`, cursor:'pointer', whiteSpace:'nowrap' }}>
                    {cat}
                    {hasLiveDot && (
                      <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF3B30', display:'inline-block', boxShadow:'0 0 0 2px rgba(255,59,48,0.35)', animation:'livePulse 1.4s ease-in-out infinite' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="scroll" style={{ flex:1 }}>
          {screen === 'series' ? (
            <SeriesDetail seriesId={activeSeriesId} userTier={userTier} registeredIds={registeredIds} onRegisterClick={handleRegisterClick} onOpenCalendar={openCalendar} onBack={goHome} />
          ) : screen === 'calendar' ? (
            <TestCalendar userTier={userTier} registeredIds={registeredIds} onRegisterClick={handleRegisterClick} initialFilter={calendarFilter} onBack={goHome} />
          ) : activeCategory === 'Live Test' ? (
            <LiveTestHome
              registeredIds={registeredIds}
              onRegisterClick={handleRegisterClick}
              onJoined={() => setScreen('exampretest')}
              liveTestAttempted={liveTestAttempted}
              onOpenSeries={openSeries}
              onOpenCalendar={() => openCalendar('all')}
              lastAttempt={lastAttempt}
              userTier={userTier}
            />
          ) : activeCategory === 'Daily Test' ? (
            <DailyTests dailyAttemptedIds={dailyAttemptedIds} onAttempt={handleDailyAttempt} />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60%', color:T3, gap:10 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
              <div style={{ fontSize:14, fontWeight:600, color:T2 }}>{activeCategory}</div>
              <div style={{ fontSize:12, color:T3, textAlign:'center', maxWidth:200, lineHeight:1.5 }}>This prototype is scoped to Live Test — {activeCategory} isn't built here.</div>
            </div>
          )}
        </div>

        <div style={{ flexShrink:0, background:'white', borderTop:`1px solid ${BD}`, display:'flex', paddingBottom:'env(safe-area-inset-bottom)' }}>
          {NAV_TABS.map(t => {
            const active = t.id === 'tests'
            return (
              <button key={t.id} onClick={() => { if (t.id !== 'tests') { setScreen('home'); setActiveCategory('Live Test') } }}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 0 10px', background:'none', border:'none', color:active ? P : T3, cursor:'pointer' }}>
                {t.icon}
                <span style={{ fontSize:10, fontWeight:active ? 600 : 400 }}>{t.label}</span>
              </button>
            )
          })}
        </div>

        {activeModal?.type === 'confirm' && (
          <div className="popup-overlay">
            <div className="popup">
              <div style={{ width:44, height:44, borderRadius:12, background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <BellIcon size={22} />
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:T1, marginBottom:8 }}>Confirm Registration</div>
              <div style={{ fontSize:13, color:T2, lineHeight:1.6, marginBottom:20 }}>
                Register for <span style={{ fontWeight:600, color:T1 }}>{activeModal.test.fullName}</span>? You'll be notified as soon as this test goes live.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setActiveModal(null)} style={{ flex:1, padding:'11px', borderRadius:10, background:'transparent', color:T2, border:`1px solid ${BD}`, fontSize:14, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button onClick={handleConfirm} style={{ flex:1, padding:'11px', borderRadius:10, background:P, color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Confirm</button>
              </div>
            </div>
          </div>
        )}

        {activeModal?.type === 'success' && (
          <div className="popup-overlay" style={{ overflow:'hidden' }}>
            {CONFETTI.map((c, i) => (
              <div key={i} style={{ position:'absolute', top:0, left:c.left, width:c.w, height:c.h, borderRadius:c.round?'50%':2, background:c.color, animation:`confettiFall ${c.dur}s ${c.delay}s ease-in both`, zIndex:0, pointerEvents:'none' }} />
            ))}
            <div className="popup" style={{ textAlign:'center', position:'relative', zIndex:1 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'#EAF3DE', border:'3px solid #97C459', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', animation:'checkPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
              </div>
              <div style={{ fontSize:26, fontWeight:800, color:P, marginBottom:4, animation:'hooraySlide 0.4s 0.25s ease-out forwards', opacity:0 }}>Hooray! 🎉</div>
              <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:10 }}>You're Registered!</div>
              <div style={{ fontSize:13, color:T2, lineHeight:1.6, marginBottom:18 }}>
                We'll notify you as soon as <span style={{ fontWeight:600, color:T1 }}>{activeModal.test.fullName}</span> goes live. Good luck!
              </div>

              {/* Reminder opt-in, captured right at the moment of commitment — the point
                  students are most likely to actually follow through on it. */}
              <div style={{ textAlign:'left', marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T3, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>Remind me</div>
                <div style={{ display:'flex', gap:8 }}>
                  {[{ key:'oneDay', label:'🔔 1 day before' }, { key:'oneHour', label:'🔔 1 hour before' }].map(r => (
                    <button key={r.key} onClick={() => toggleReminder(r.key)} style={{
                      flex:1, padding:'9px 6px', borderRadius:10, fontSize:11.5, fontWeight:600, cursor:'pointer',
                      background: reminders[r.key] ? '#EAF3DE' : '#F5F5FB',
                      color: reminders[r.key] ? '#3B6D11' : T2,
                      border: `1.5px solid ${reminders[r.key] ? '#97C459' : BD}`,
                    }}>{r.label}</button>
                  ))}
                </div>
              </div>

              <button onClick={() => downloadIcsForTest(activeModal.test)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'11px', borderRadius:10, background:'white', color:P, border:`1.5px solid #AFA9EC`, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
                📅 Add to calendar
              </button>
              <button onClick={() => setActiveModal(null)} style={{ width:'100%', padding:'13px', borderRadius:12, background:P, color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Got it</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
