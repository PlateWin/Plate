import React, { useState } from 'react'

export default function LoginScreen({ onLogin, serverOnline }) {
  const [name, setName] = useState('')

  const submit = () => {
    if (name.trim().length >= 2) onLogin(name.trim())
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-[340px] p-6" style={{ background: 'var(--x-depth-2)', border: '1px solid var(--x-line-dim)', borderRadius: '10px' }}>

        {/* X Logo */}
        <div className="flex items-center justify-center mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M4 4L11 11" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M20 4L13 11" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M4 20L11 13" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M20 20L13 13" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill="#a5b4fc" />
          </svg>
        </div>

        <h1 className="text-center text-[15px] font-semibold mb-1" style={{ color: 'var(--x-text-100)' }}>
          Welcome to FlowCrystal
        </h1>
        <p className="text-center text-[11px] mb-5" style={{ color: 'var(--x-text-40)' }}>
          Enter your name to start communicating
        </p>

        {/* Server status */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <div className="w-[5px] h-[5px] rounded-full"
               style={{ background: serverOnline ? 'var(--x-success)' : 'var(--x-danger)' }} />
          <span className="font-mono text-[9px]" style={{ color: 'var(--x-text-20)' }}>
            {serverOnline ? 'CORE:ONLINE' : 'CORE:OFFLINE — start backend first'}
          </span>
        </div>

        {/* Name input */}
        <div className="flex items-center gap-2 px-3 py-2 mb-3"
             style={{ background: 'var(--x-depth-3)', border: '1px solid var(--x-line-subtle)', borderRadius: '6px' }}>
          <span className="font-mono text-[10px]" style={{ color: 'var(--x-text-20)' }}>@</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="your name"
            autoFocus
            maxLength={20}
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: 'var(--x-text-100)', caretColor: 'var(--x-accent)' }}
          />
        </div>

        {/* Login button */}
        <button onClick={submit}
          disabled={name.trim().length < 2 || !serverOnline}
          className="w-full py-2 text-[12px] font-mono font-medium transition-colors duration-100"
          style={{
            borderRadius: '6px',
            background: name.trim().length >= 2 && serverOnline ? 'var(--x-accent)' : 'var(--x-depth-4)',
            color: name.trim().length >= 2 && serverOnline ? '#fff' : 'var(--x-text-20)',
            border: `1px solid ${name.trim().length >= 2 && serverOnline ? 'var(--x-accent-dim)' : 'var(--x-line-dim)'}`,
            cursor: name.trim().length >= 2 && serverOnline ? 'pointer' : 'not-allowed',
          }}>
          CONNECT TO PLATE
        </button>
      </div>
    </div>
  )
}
