import React from 'react'

/* ── SVG X-Logo: four intersecting plates ── */
function XLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L11 11" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 4L13 11" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M4 20L11 13" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 20L13 13" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" fill="#a5b4fc" />
    </svg>
  )
}

export default function TitleBar({ serverStatus }) {
  const statusConfig = {
    connected:    { color: 'var(--x-success)', label: 'ONLINE' },
    live:         { color: 'var(--x-success)', label: 'LIVE' },
    connecting:   { color: 'var(--x-warning)', label: 'SYNC' },
    reconnecting: { color: 'var(--x-warning)', label: 'RECONN' },
    offline:      { color: 'var(--x-danger)',  label: 'OFFLINE' },
    error:        { color: 'var(--x-danger)',  label: 'ERROR' },
  }

  const st = statusConfig[serverStatus] || statusConfig.offline

  return (
    <div className="titlebar-drag flex items-center justify-between h-10 px-4 select-none"
         style={{ background: 'var(--x-depth-1)', borderBottom: '1px solid var(--x-line-dim)' }}>

      {/* Left: Brand */}
      <div className="flex items-center gap-2.5">
        <XLogo />
        <span className="text-[11px] font-semibold tracking-[0.2em]"
              style={{ color: 'var(--x-text-40)' }}>
          PLATE
        </span>

        {/* Divider */}
        <div className="w-px h-3.5 mx-1" style={{ background: 'var(--x-line-subtle)' }} />

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <div className="w-[5px] h-[5px] rounded-full" style={{ background: st.color }} />
          <span className="font-mono text-[9px] tracking-wider" style={{ color: 'var(--x-text-20)' }}>
            {st.label}
          </span>
        </div>
      </div>

      {/* Right: Window Controls */}
      <div className="titlebar-no-drag flex items-center gap-px">
        {[
          { action: 'minimize', icon: <rect y="5" width="10" height="1" fill="currentColor" /> },
          { action: 'maximize', icon: <rect x="0.5" y="0.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none" /> },
          { action: 'close', icon: <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" /> },
        ].map(({ action, icon }) => (
          <button
            key={action}
            onClick={() => window.plateAPI?.[`window${action.charAt(0).toUpperCase() + action.slice(1)}`]?.()}
            className="w-8 h-8 flex items-center justify-center transition-colors duration-100"
            style={{ color: 'var(--x-text-20)', borderRadius: '6px' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = action === 'close' ? '#7f1d1d' : 'var(--x-depth-4)'
              e.currentTarget.style.color = action === 'close' ? '#fca5a5' : 'var(--x-text-60)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--x-text-20)'
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">{icon}</svg>
          </button>
        ))}
      </div>
    </div>
  )
}
