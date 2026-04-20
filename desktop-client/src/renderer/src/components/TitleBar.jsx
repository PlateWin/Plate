import React from 'react'

function XLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L11 11" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 4L13 11" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M4 20L11 13" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 20L13 13" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill="#a5b4fc" />
    </svg>
  )
}

export default function TitleBar({ serverStatus }) {
  const statusConfig = {
    connected: { color: 'var(--x-success)', label: 'ONLINE' },
    live: { color: 'var(--x-success)', label: 'LIVE' },
    connecting: { color: 'var(--x-warning)', label: 'SYNC' },
    reconnecting: { color: 'var(--x-warning)', label: 'RECONN' },
    offline: { color: 'var(--x-danger)', label: 'OFFLINE' },
    error: { color: 'var(--x-danger)', label: 'ERROR' }
  }

  const st = statusConfig[serverStatus] || statusConfig.offline

  return (
    <div
      className="titlebar-drag flex items-center justify-between h-12 px-4 select-none relative"
      style={{
        background: 'linear-gradient(180deg, rgba(12,12,17,0.96), rgba(10,10,14,0.88))',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
      }}
    >

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[12px] flex items-center justify-center border border-white/8 bg-white/[0.03]">
          <XLogo />
        </div>

        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-semibold tracking-[0.28em]" style={{ color: 'var(--x-text-40)' }}>
            FLOWCRYSTAL
          </span>
          <span className="text-[9px] font-mono tracking-[0.16em] mt-1" style={{ color: 'rgba(255,255,255,0.22)' }}>
            DREAM FLOW WORKSPACE
          </span>
        </div>

        <div className="w-px h-5 mx-1 bg-white/6" />

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/6 bg-white/[0.025]">
          <div className="w-[6px] h-[6px] rounded-full" style={{ background: st.color }} />
          <span className="font-mono text-[9px] tracking-[0.22em]" style={{ color: 'var(--x-text-40)' }}>
            {st.label}
          </span>
        </div>
      </div>

      <div className="titlebar-no-drag flex items-center gap-1">
        {[
          { action: 'minimize', icon: <rect y="5" width="10" height="1" fill="currentColor" /> },
          { action: 'maximize', icon: <rect x="0.5" y="0.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none" /> },
          { action: 'close', icon: <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" /> }
        ].map(({ action, icon }) => (
          <button
            key={action}
            onClick={() => window.plateAPI?.[`window${action.charAt(0).toUpperCase() + action.slice(1)}`]?.()}
            className="w-8 h-8 flex items-center justify-center transition-all duration-150 rounded-[10px] border border-transparent"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = action === 'close' ? 'rgba(127,29,29,0.65)' : 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = action === 'close' ? 'rgba(252,165,165,0.18)' : 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = action === 'close' ? '#fecaca' : 'rgba(255,255,255,0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.25)'
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">{icon}</svg>
          </button>
        ))}
      </div>
    </div>
  )
}
