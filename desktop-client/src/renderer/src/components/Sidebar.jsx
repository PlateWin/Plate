import React, { useState } from 'react'
import { Hash, Gem, Search, Plus, Activity, Database } from 'lucide-react'

export default function Sidebar({ activeChannel, onChannelSelect, onlineUsers = [], currentUser, crystals = [], activeCrystal, onCrystalSelect, onCreateCrystal, activeMode, onModeChange }) {
  const [searchQuery, setSearchQuery] = useState('')

  // Crystal List Rendering logic with extreme safety
  const safeCrystals = Array.isArray(crystals) ? crystals : [];
  const validCrystals = safeCrystals.filter(c => c && c.slug);
  const displayCrystals = validCrystals.filter(c => 
    (c.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  console.log(`[Sidebar] State Check: crystals=${safeCrystals.length}, valid=${validCrystals.length}, display=${displayCrystals.length}`);

  let crystalsListContent;
  if (displayCrystals.length > 0) {
    crystalsListContent = displayCrystals.map(cry => {
      const active = activeCrystal === cry.slug
      return (
        <button key={cry.slug} onClick={() => onCrystalSelect(cry.slug)}
          className={`w-full text-left px-3 py-2 flex items-center gap-2 relative transition-all duration-300 rounded-lg group ${
            active ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {active && (
            <div className="absolute left-0 w-[2px] h-4 bg-[#C084FC] shadow-[0_0_8px_#C084FC] rounded-full" />
          )}
          <Gem size={12} className={`opacity-60 ${active ? 'text-[#C084FC]' : ''}`} />
          <span className="text-[13px] font-medium truncate tracking-wide">{cry.title || 'Untitled'}</span>
        </button>
      )
    })
  } else {
    crystalsListContent = (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center opacity-30">
        <Gem size={24} className="mb-3 opacity-20" />
        <p className="text-[11px] font-mono leading-relaxed">
          {safeCrystals.length > 0 ? "NO MATCHING DATA" : "DATABASE EMPTY"}
          <br/>CRYSTALIZE FROM FLOW
        </p>
      </div>
    )
  }

  return (
    <aside className="glass-panel w-[230px] h-full flex flex-col shrink-0 select-none relative z-10 shadow-xl overflow-hidden">
      {/* Mode Switcher */}
      <div className="px-4 pt-6 pb-2 flex gap-1">
        <button onClick={() => onModeChange('flow')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold tracking-widest transition-all duration-300 ${
            activeMode === 'flow' ? 'bg-white/5 text-white shadow-inner' : 'text-white/20 hover:text-white/40'
          }`}
        >
          <Activity size={14} className={activeMode === 'flow' ? 'text-[#38BDF8]' : 'opacity-40'} />
          FLOW
        </button>
        <button onClick={() => onModeChange('crystals')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold tracking-widest transition-all duration-300 ${
            activeMode === 'crystals' ? 'bg-[#C084FC]/10 text-[#C084FC]' : 'text-white/20 hover:text-white/40'
          }`}
        >
          <Database size={14} className={activeMode === 'crystals' ? 'text-[#C084FC]' : 'opacity-40'} />
          CRYSTALS
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeMode === 'flow' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Channels */}
            <div className="px-3 pt-4 mb-2">
              <div className="px-2 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">Channels</span>
                <Hash size={10} className="text-white/20" />
              </div>
              <div className="space-y-0.5">
                {['general', 'dev-core', 'design', 'ai-brain'].map(ch => (
                  <button key={ch} onClick={() => onChannelSelect(ch)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-all duration-200 rounded-lg ${
                      activeChannel === ch ? 'bg-white/5 text-white shadow-sm' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className={`text-lg leading-none ${activeChannel === ch ? 'text-[#38BDF8]' : 'text-white/20'}`}>#</span>
                    <span className="text-[13px] font-medium tracking-tight">{ch}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Online Status */}
            <div className="px-3 pt-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-2 mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">Synchronized</span>
                <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-green-500 font-bold uppercase">{onlineUsers.length}</span>
                </div>
              </div>
              <div className="space-y-1">
                {onlineUsers.map(user => {
                  const isMe = user === currentUser;
                  return (
                    <div key={user} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#818CF8] flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10">
                        {user[0].toUpperCase()}
                      </div>
                      <span className="text-[13px] text-white/70 font-medium truncate">
                        {user}{isMe ? ' (you)' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Search */}
             <div className="px-4 py-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#C084FC] transition-colors" size={12} />
                <input 
                  type="text" 
                  placeholder="Search knowledge..."
                  className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2 pl-9 pr-3 text-[12px] text-white placeholder:text-white/10 focus:outline-none focus:border-[#C084FC]/30 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Crystal List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-5 mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">Database</span>
                <button onClick={onCreateCrystal} className="text-white/20 hover:text-[#C084FC] transition-colors"><Plus size={14} /></button>
              </div>

              <div className="px-2 space-y-0.5">
                {crystalsListContent}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Card */}
      <div className="p-3 mt-auto border-t border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
            {currentUser?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-white truncate lowercase">{currentUser}</div>
            <div className="text-[9px] text-white/30 tracking-widest uppercase font-mono">Authorized</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
