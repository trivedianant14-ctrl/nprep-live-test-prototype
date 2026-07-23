import { T1, T2 } from '../data'

export default function StatusBar() {
  return (
    <div style={{ padding:'12px 20px 4px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
      <span style={{ fontSize:13, fontWeight:600, color:T1 }}>9:41</span>
      <div style={{ display:'flex', gap:6, alignItems:'center', color:T2 }}>
        <svg width="16" height="11" viewBox="0 0 30 20" fill="currentColor"><rect x="0" y="8" width="4" height="12" rx="1" opacity="0.4"/><rect x="7" y="5" width="4" height="15" rx="1" opacity="0.6"/><rect x="14" y="2" width="4" height="18" rx="1" opacity="0.8"/><rect x="21" y="0" width="4" height="20" rx="1"/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor"/><rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.4"/><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill="currentColor"/></svg>
      </div>
    </div>
  )
}
