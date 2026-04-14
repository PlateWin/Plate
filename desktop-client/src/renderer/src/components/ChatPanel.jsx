import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function ChatPanel({ channelName, messages, onSend, wsStatus, currentUser, onCrystalize }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  return (
    <motion.div className="flex flex-col flex-1 h-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}>

      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between shrink-0 relative z-10"
           style={{ background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] opacity-70" style={{ color: '#00D1FF' }}>
            {channelName.startsWith('dm-') ? '@' : '#'}
          </span>
          <span className="text-[15px] font-semibold tracking-wide text-white">
            {channelName.startsWith('dm-') ? channelName.slice(3) : channelName}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1"
             style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-1.5 h-1.5 rounded-full"
               style={{ background: wsStatus === 'live' ? '#34d399' : 'rgba(255,255,255,0.3)', boxShadow: wsStatus === 'live' ? '0 0 8px #34d399' : 'none' }} />
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-70 text-white">
            {wsStatus === 'live' ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3">
        {messages.length === 0 && (
          <div className="flex items-center gap-2 py-8 justify-center">
            <span className="font-mono text-[11px]" style={{ color: 'var(--x-text-20)' }}>
              No messages in #{channelName} yet. Say something!
            </span>
          </div>
        )}

        {messages.map(msg => (
          <motion.div key={msg.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="group"
          >
            {(msg.type === 'join' || msg.type === 'leave' || msg.type === 'system') ? (
              /* System messages */
              <div className="flex items-center gap-4 py-2 opacity-50">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-white">
                  {msg.text}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            ) : (
              /* Chat messages */
              <div className="flex items-start gap-4 py-3 px-4 -mx-2 transition-all duration-300 rounded-xl relative"
                   style={{
                     background: msg.sender === currentUser ? 'rgba(0, 209, 255, 0.03)' : 'transparent',
                   }}
                   onMouseEnter={e => { if (msg.sender !== currentUser) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                   onMouseLeave={e => { if (msg.sender !== currentUser) e.currentTarget.style.background = 'transparent' }}>

                {/* Left Active Glow bar for current user */}
                {msg.sender === currentUser && (
                   <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-[#00D1FF] shadow-[0_0_10px_#00D1FF]" />
                )}

                {/* Avatar Initial (Optional) */}
                {msg.sender !== currentUser && (
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-mono font-medium"
                       style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    {msg.sender.slice(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex flex-baseline items-center gap-2">
                    <span className="text-[13px] font-semibold tracking-wide"
                          style={{ color: msg.sender === currentUser ? '#00D1FF' : '#ffffff' }}>
                      {msg.sender}
                    </span>
                    <span className="font-mono text-[10px] opacity-40 font-light text-white">
                      {msg.time}
                    </span>
                  </div>
                  <span className="text-[14px] leading-relaxed break-words"
                        style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {msg.text}
                  </span>
                </div>

                {/* Crystalize Button on Hover */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => onCrystalize && onCrystalize(msg.text)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-[#00D1FF]/10 hover:border-[#00D1FF]/30 transition-all group/btn"
                    title="Crystalize this message"
                  >
                    <span className="text-[10px] font-mono tracking-wider text-white/50 group-hover/btn:text-[#00D1FF]">CRYSTALIZE</span>
                    <span className="text-[12px] group-hover/btn:scale-125 transition-transform">✨</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input Console */}
      <div className="px-6 pb-6 pt-2 relative z-10">
        <div className="flex items-center gap-3 px-4 py-3 relative group transition-all duration-300 rounded-[12px]"
             style={{ 
               background: 'rgba(255, 255, 255, 0.04)', 
               backdropFilter: 'blur(20px)',
               border: '1px solid rgba(255, 255, 255, 0.08)',
             }}>
          
          {/* Subtle glowing ring on focus/input */}
          <div className={`absolute inset-[-1px] rounded-[15px] pointer-events-none transition-opacity duration-500 ${input.trim() ? 'opacity-100' : 'opacity-0'}`}
               style={{ background: 'linear-gradient(45deg, rgba(0,209,255,0.4), rgba(192,132,252,0.4))', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', padding: '1px' }}></div>

          <span className="font-mono text-[13px] opacity-50 text-white font-medium">✨</span>
          <input type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Send message to #${channelName}...`}
            className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.3)] tracking-wide"
            style={{ caretColor: '#00D1FF' }}
          />
          <button onClick={send}
            className="px-3.5 py-1.5 text-[11px] font-mono font-medium rounded-lg transition-all duration-300"
            style={{
              background: input.trim() ? 'rgba(0, 209, 255, 0.2)' : 'rgba(255,255,255,0.05)',
              color: input.trim() ? '#00D1FF' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${input.trim() ? 'rgba(0, 209, 255, 0.4)' : 'transparent'}`,
              boxShadow: input.trim() ? '0 0 15px rgba(0,209,255,0.2)' : 'none'
            }}>
            SEND
          </button>
        </div>
      </div>
    </motion.div>
  )
}
