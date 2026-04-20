import React, { useState } from 'react'
import { Hash, Gem, Search, Plus, Activity, Database, Trash2, Brain } from 'lucide-react'

export default function Sidebar({
  activeChannel,
  onChannelSelect,
  onlineUsers = [],
  currentUser,
  crystals = [],
  activeCrystal,
  onCrystalSelect,
  onCreateCrystal,
  onDeleteCrystal,
  activeMode,
  onModeChange
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const safeCrystals = Array.isArray(crystals) ? crystals : []
  const validCrystals = safeCrystals.filter((c) => c && c.slug)
  const displayCrystals = validCrystals.filter((c) => (c.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase()))

  const channels = ['general', 'dev-core', 'design', 'ai-brain']

  const renderCrystalList = () => {
    if (displayCrystals.length === 0) {
      return (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center opacity-40">
          <Gem size={24} className="mb-3 opacity-30" />
          <p className="text-[11px] font-mono leading-relaxed text-white/35">
            {safeCrystals.length > 0 ? 'NO MATCHING DATA' : 'ARCHIVE EMPTY'}
            <br />
            CRYSTALIZE FROM FLOW
          </p>
        </div>
      )
    }

    return displayCrystals.map((crystal) => {
      const active = activeCrystal === crystal.slug
      return (
        <div
          key={crystal.slug}
          className={`w-full px-3.5 py-3 flex items-center gap-2.5 relative transition-all duration-300 rounded-2xl group border ${
            active
              ? 'bg-[#c084fc]/10 text-white border-[#c084fc]/18'
              : 'text-white/45 border-transparent hover:text-white/82 hover:bg-white/[0.04]'
          }`}
        >
          <button
            type="button"
            onClick={() => onCrystalSelect(crystal.slug)}
            className="absolute inset-0 rounded-2xl"
            aria-label={`Open ${crystal.title || 'Untitled'} crystal`}
          />
          {active && <div className="absolute left-0 w-[2px] h-5 bg-[#C084FC] rounded-full" />}
          <Gem size={13} className={active ? 'text-[#C084FC]' : 'text-white/30 group-hover:text-white/55'} />
          <span className="text-[13px] font-medium truncate tracking-[0.01em] flex-1 pr-2 relative z-10">{crystal.title || 'Untitled'}</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDeleteCrystal?.(crystal.slug)
            }}
            className="w-7 h-7 rounded-full border border-transparent text-white/20 hover:text-rose-200 hover:border-rose-400/20 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shrink-0 relative z-10"
            title="Delete crystal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    })
  }

  return (
    <aside className="glass-panel w-[250px] h-full flex flex-col shrink-0 select-none relative z-10 overflow-hidden">
      <div className="px-4 pt-5 pb-3 relative">
        <div className="px-1 mb-3">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/22 font-mono">Navigation Core</div>
          <div className="text-sm text-white/72 mt-1">Workspace Modes</div>
        </div>

        <div className="p-1 rounded-[18px] border border-white/6 bg-white/[0.025] flex gap-1.5">
          <button
            onClick={() => onModeChange('flow')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[10px] font-bold tracking-[0.14em] transition-all duration-300 ${
              activeMode === 'flow'
                ? 'bg-[#38BDF8]/10 text-white border border-[#38BDF8]/18'
                : 'text-white/22 border border-transparent hover:text-white/50 hover:bg-white/[0.03]'
            }`}
          >
            <Activity size={14} className={activeMode === 'flow' ? 'text-[#38BDF8]' : 'opacity-50'} />
            FLOW
          </button>
          <button
            onClick={() => onModeChange('crystals')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[10px] font-bold tracking-[0.14em] transition-all duration-300 ${
              activeMode === 'crystals'
                ? 'bg-[#C084FC]/10 text-[#f3e8ff] border border-[#C084FC]/18'
                : 'text-white/22 border border-transparent hover:text-white/50 hover:bg-white/[0.03]'
            }`}
          >
            <Database size={14} className={activeMode === 'crystals' ? 'text-[#C084FC]' : 'opacity-50'} />
            CRYSTALS
          </button>
          <button
            onClick={() => onModeChange('memories')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[10px] font-bold tracking-[0.14em] transition-all duration-300 ${
              activeMode === 'memories'
                ? 'bg-cyan-400/[0.12] text-cyan-100 border border-cyan-400/18'
                : 'text-white/22 border border-transparent hover:text-white/50 hover:bg-white/[0.03]'
            }`}
          >
            <Brain size={14} className={activeMode === 'memories' ? 'text-cyan-200' : 'opacity-50'} />
            MEMORY
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeMode === 'flow' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 pt-3">
              <div className="px-2 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/26 tracking-[0.24em] uppercase">Channels</span>
                <Hash size={11} className="text-white/18" />
              </div>

              <div className="space-y-1">
                {channels.map((channel) => {
                  const active = activeChannel === channel
                  return (
                    <button
                      key={channel}
                      onClick={() => onChannelSelect(channel)}
                      className={`w-full text-left px-3.5 py-3 flex items-center gap-2.5 relative transition-all duration-300 rounded-2xl group border ${
                        active
                          ? 'bg-[#38BDF8]/10 text-white border-[#38BDF8]/18'
                          : 'text-white/45 border-transparent hover:text-white/82 hover:bg-white/[0.04]'
                      }`}
                    >
                      {active && <div className="absolute left-0 w-[2px] h-5 bg-[#38BDF8] rounded-full" />}
                      <span className={`text-lg leading-none ${active ? 'text-[#38BDF8]' : 'text-white/12 group-hover:text-white/30'}`}>#</span>
                      <span className="text-[13px] font-medium tracking-tight truncate">{channel}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="px-4 pt-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-1 mb-3 flex items-center justify-between">
                <span className="text-[9px] font-bold text-white/20 tracking-[0.32em] uppercase">Synchronized</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/6 border border-emerald-400/12">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <span className="text-[9px] text-emerald-200/65 font-bold uppercase">{onlineUsers.length}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {onlineUsers.map((user) => {
                  const isMe = user === currentUser
                  return (
                    <div key={user} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-transparent hover:border-white/6 hover:bg-white/[0.04] transition-all group">
                      <div className="w-8 h-8 rounded-[12px] bg-gradient-to-br from-[#38BDF8] to-[#818CF8] flex items-center justify-center text-[11px] font-bold text-white shadow-sm ring-1 ring-white/10 group-hover:ring-[#38BDF8]/40 transition-all">
                        {user[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] text-white/62 font-medium truncate group-hover:text-white/90 transition-colors tracking-tight">
                          {user.toLowerCase()}
                        </span>
                        {isMe && <span className="text-[9px] text-[#38BDF8]/48 font-mono uppercase tracking-[0.12em] mt-0.5">Primary Agent</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : activeMode === 'crystals' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#C084FC] transition-colors" size={12} />
                <input
                  type="text"
                  placeholder="Scan archive..."
                  className="w-full bg-white/[0.025] border border-white/6 rounded-2xl py-2.5 pl-9 pr-3 text-[12px] text-white placeholder:text-white/14 focus:outline-none focus:border-[#C084FC]/25 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-5 mb-3 flex items-center justify-between">
                <span className="text-[9px] font-bold text-white/20 tracking-[0.38em] uppercase">Core Archive</span>
                <button
                  onClick={onCreateCrystal}
                  className="w-7 h-7 rounded-full border border-white/6 bg-white/[0.025] flex items-center justify-center text-white/25 hover:text-[#C084FC] hover:border-[#C084FC]/18 hover:bg-[#C084FC]/8 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="px-2 space-y-1">
                {renderCrystalList()}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden px-4 py-5">
            <div className="rounded-[24px] border border-cyan-400/10 bg-cyan-400/[0.04] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/70 font-mono mb-2">Memory Loop</div>
              <div className="text-sm text-white/80 leading-6">
                Open the vault to curate your long-term facts and style memory across all crystals.
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-white/45 leading-6">
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-4 py-4">
                Recall boosts memory importance when a fragment keeps helping.
              </div>
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-4 py-4">
                Duplicate facts now merge into stronger memories instead of flooding the archive.
              </div>
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-4 py-4">
                You can inspect, tune, and delete memories from the main workspace.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 mt-auto border-t border-white/[0.04]">
        <div className="flex items-center gap-3 p-3.5 rounded-[22px] bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.04] transition-all group">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-white/10 to-white/[0.04] flex items-center justify-center text-[12px] font-bold text-white/70 shadow-inner border border-white/6 group-hover:border-white/18 transition-all">
            {currentUser?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-white/90 truncate tracking-tight">{currentUser?.toLowerCase()}</div>
            <div className="text-[9px] text-white/22 tracking-[0.22em] uppercase font-mono mt-0.5">Authorized Node</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
