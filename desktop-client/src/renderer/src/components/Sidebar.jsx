import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Gem, Search, Plus, Users, MessageSquare } from 'lucide-react'

const channels = [
  { id: 'general',  label: 'general' },
  { id: 'dev-core', label: 'dev-core' },
  { id: 'design',   label: 'design' },
  { id: 'ai-brain', label: 'ai-brain' },
]

export default function Sidebar({ activeChannel, onChannelSelect, onlineUsers = [], currentUser, crystals = [], activeCrystal, onCrystalSelect, onCreateCrystal, activeMode, onModeChange }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCrystals = (crystals || []).filter(c => 
    (c.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="glass-panel w-[230px] h-full flex flex-col shrink-0 select-none relative z-10 shadow-xl overflow-hidden">
      
      {/* Mode Switcher */}
      <div className="p-3">
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
          <button 
            onClick={() => onModeChange('flow')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-mono tracking-wider transition-all duration-300 ${
              activeMode === 'flow' ? 'bg-[#00D1FF]/20 text-[#00D1FF] shadow-lg' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <MessageSquare size={13} />
            FLOW
          </button>
          <button 
            onClick={() => onModeChange('crystals')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-mono tracking-wider transition-all duration-300 ${
              activeMode === 'crystals' ? 'bg-[#C084FC]/20 text-[#C084FC] shadow-lg' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Gem size={13} />
            CRYSTALS
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeMode === 'flow' ? (
            <motion.div 
              key="flow" 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Channels List */}
              <div className="pt-2 pb-1 px-3">
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase px-1.5 opacity-40">Communication</span>
              </div>
              <div className="px-2 space-y-0.5">
                {channels.map(ch => {
                  const active = activeChannel === ch.id
                  return (
                    <button key={ch.id} onClick={() => onChannelSelect(ch.id)}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 relative transition-all duration-300 rounded-lg group ${
                        active ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {active && (
                        <motion.div layoutId="chActive" className="absolute left-0 w-[2px] h-4 bg-[#00D1FF] shadow-[0_0_8px_#00D1FF] rounded-full" />
                      )}
                      <Hash size={12} className="opacity-60" />
                      <span className="text-[13px] font-medium tracking-wide">{ch.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* DMs / Online Users */}
              <div className="pt-6 pb-1 px-3 flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase px-1.5 opacity-40">Presence</span>
                <span className="text-[10px] bg-[#34d399]/20 text-[#34d399] px-1.5 py-0.5 rounded font-mono">{onlineUsers.length}</span>
              </div>
              <div className="px-2 space-y-0.5">
                {onlineUsers.map(user => {
                  const isMe = user === currentUser
                  const dmId = `dm-${user}`
                  const active = activeChannel === dmId
                  return (
                    <button key={user} onClick={() => !isMe && onChannelSelect(dmId)}
                      className={`w-full text-left px-2 py-1.5 flex items-center gap-3 relative transition-all duration-300 rounded-lg ${
                        active ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-mono">
                          {user.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#34d399] border-2 border-[#0a0a0a] rounded-full shadow-[0_0_5px_#34d399]" />
                      </div>
                      <span className="text-[12px] truncate">{user}{isMe ? ' (you)' : ''}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="crystals" 
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Search Crystals */}
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                  <Search size={12} className="text-white/30" />
                  <input 
                    type="text" 
                    placeholder="Search knowledge..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-[12px] text-white w-full placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="pt-2 pb-1 px-3 flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase px-1.5 opacity-40">Database</span>
                <button 
                  onClick={onCreateCrystal}
                  className="p-1 hover:bg-[#C084FC]/20 rounded-md transition-colors text-[#C084FC]"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="px-2 space-y-0.5">
                {filteredCrystals.length > 0 ? (
                  filteredCrystals.map(cry => {
                    const active = activeCrystal === cry.slug
                    return (
                      <button key={cry.slug} onClick={() => onCrystalSelect(cry.slug)}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 relative transition-all duration-300 rounded-lg group ${
                          active ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {active && (
                          <motion.div layoutId="cryActive" className="absolute left-0 w-[2px] h-4 bg-[#C084FC] shadow-[0_0_8px_#C084FC] rounded-full" />
                        )}
                        <Gem size={12} className={`opacity-60 ${active ? 'text-[#C084FC]' : ''}`} />
                        <span className="text-[13px] font-medium truncate tracking-wide">{cry.title || 'Untitled'}</span>
                      </button>
                    )
                  })
                ) : (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center opacity-30">
                    <Gem size={24} className="mb-3 opacity-20" />
                    <p className="text-[11px] font-mono leading-relaxed">NO CRYSTALS FOUND<br/>CRYSTALIZE FROM FLOW</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Status Card */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full bg-[#00D1FF]/10 border border-[#00D1FF]/20 flex items-center justify-center text-[#00D1FF] font-mono text-xs font-bold">
            {currentUser?.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white truncate">{currentUser}</div>
            <div className="text-[10px] text-[#00D1FF] font-mono opacity-50">Authorized</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
