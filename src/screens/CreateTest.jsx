import { useState } from 'react'
import { SECTIONS } from '../exam/examData'
import { P, PD, G, GL, GB, T1, T2, T3, BD, BG2 } from '../data'
import { ChevronLeft } from '../icons'

const QUESTIONS_PER_SECTION = 20
const MINUTES_PER_SECTION = 18

export default function CreateTest({ onBack, onCreate }) {
  const [mode, setMode] = useState('subject_wise') // 'full_mock' | 'subject_wise' — the toggle from the backend ticket
  const [selectedIds, setSelectedIds] = useState([])
  const [testName, setTestName] = useState('')

  const isFullMock = mode === 'full_mock'
  const toggleSection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selectedCount = isFullMock ? SECTIONS.length : selectedIds.length
  const totalQuestions = selectedCount * QUESTIONS_PER_SECTION
  const totalMinutes = selectedCount * MINUTES_PER_SECTION
  const canCreate = isFullMock || selectedIds.length > 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 16px 12px', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:T1, padding:0, flexShrink:0 }}>
          <ChevronLeft />
        </button>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:T1 }}>Create Your Own Test</div>
          <div style={{ fontSize:11, color:T3, marginTop:1 }}>Build a custom practice test from the question bank</div>
        </div>
      </div>

      <div className="scroll" style={{ flex:1, padding:'18px 16px 24px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:8 }}>Test type</div>
        <div style={{ display:'flex', background:BG2, borderRadius:12, padding:4, gap:4, marginBottom:8 }}>
          {[
            { id:'subject_wise', label:'Subject-wise', sub:'Pick your own subjects' },
            { id:'full_mock',    label:'Full Mock',     sub:'All subjects, exam-style' },
          ].map(opt => {
            const isAct = mode === opt.id
            return (
              <button key={opt.id} onClick={() => setMode(opt.id)} style={{
                flex:1, padding:'11px 8px', borderRadius:9, border:'none', cursor:'pointer',
                background: isAct ? `linear-gradient(135deg, ${P}, ${PD})` : 'transparent',
                boxShadow: isAct ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}>
                <div style={{ fontSize:13, fontWeight:700, color: isAct ? 'white' : T1 }}>{opt.label}</div>
                <div style={{ fontSize:10, color: isAct ? 'rgba(255,255,255,0.75)' : T3, marginTop:1 }}>{opt.sub}</div>
              </button>
            )
          })}
        </div>
        <div style={{ fontSize:11, color:T3, lineHeight:1.6, marginBottom:22 }}>
          {isFullMock
            ? 'Every subject, one sitting — the same structure as an official full-length mock.'
            : "Choose only the subjects you want to drill. Your test is built from just those."}
        </div>

        {!isFullMock && (
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:10 }}>Choose subjects</div>
            {SECTIONS.map(sec => {
              const checked = selectedIds.includes(sec.id)
              return (
                <button key={sec.id} onClick={() => toggleSection(sec.id)} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, marginBottom:8,
                  background: checked ? '#EEEDFE' : 'white', border:`1.5px solid ${checked ? P : BD}`, cursor:'pointer', textAlign:'left',
                }}>
                  <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, background: checked ? P : 'white', border:`1.5px solid ${checked ? P : BD}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T1 }}>{sec.fullName}</div>
                    <div style={{ fontSize:11, color:T3, marginTop:1 }}>{QUESTIONS_PER_SECTION} questions · {MINUTES_PER_SECTION} min</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ borderTop:`1px solid ${BD}`, paddingTop:18, marginBottom:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T1, marginBottom:8 }}>Name your test <span style={{ fontWeight:400, color:T3 }}>(optional)</span></div>
          <input
            value={testName}
            onChange={e => setTestName(e.target.value)}
            placeholder={isFullMock ? 'My Full Mock Test' : 'My Subject-wise Test'}
            style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${BD}`, fontSize:13, color:T1, background:'white' }}
          />
        </div>

        <div style={{ background: canCreate ? GL : BG2, border:`1px solid ${canCreate ? GB : BD}`, borderRadius:12, padding:'13px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color: canCreate ? G : T3, textTransform:'uppercase', letterSpacing:0.3, marginBottom:6 }}>Your test</div>
          <div style={{ fontSize:12.5, color: canCreate ? T1 : T3 }}>
            {canCreate
              ? `${selectedCount} subject${selectedCount === 1 ? '' : 's'} · ${totalQuestions} questions · ${totalMinutes} min · ${totalQuestions} Marks`
              : 'Select at least one subject to see a preview'}
          </div>
        </div>
      </div>

      <div style={{ flexShrink:0, padding:'12px 16px 20px', borderTop:`1px solid ${BD}` }}>
        <button
          disabled={!canCreate}
          onClick={() => canCreate && onCreate({ mode, selectedSectionIds: selectedIds, testName })}
          style={{ width:'100%', padding:'14px', borderRadius:12, background: canCreate ? P : BG2, color: canCreate ? 'white' : T3, border:'none', fontSize:14, fontWeight:700, cursor: canCreate ? 'pointer' : 'default' }}>
          Create & Start Test
        </button>
      </div>
    </div>
  )
}
