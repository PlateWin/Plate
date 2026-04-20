import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Brain, Search, Trash2, ArrowUpRight, Sparkles, SlidersHorizontal } from 'lucide-react'

const categoryOptions = [
  { value: 'all', label: 'All Memory' },
  { value: 'fact', label: 'Facts' },
  { value: 'style', label: 'Style' }
]

const importanceLabels = ['Dormant', 'Faint', 'Active', 'Core', 'Anchor']

export default function MemoryVault({ currentUser, onNavigateToCrystal }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [pendingId, setPendingId] = useState(null)

  const loadMemories = useCallback(async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (category !== 'all') params.set('category', category)
      params.set('limit', '180')

      const res = await fetch(`http://localhost:8080/api/v1/memories?${params.toString()}`, {
        headers: { 'X-User-Name': currentUser }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load memories')
      setMemories(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      console.error('[MemoryVault] Load error:', err)
      setMemories([])
    } finally {
      setLoading(false)
    }
  }, [category, currentUser, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMemories()
    }, 240)
    return () => clearTimeout(timer)
  }, [loadMemories])

  const summary = useMemo(() => {
    const facts = memories.filter((item) => item.category === 'fact').length
    const styles = memories.filter((item) => item.category === 'style').length
    const anchors = memories.filter((item) => item.importance >= 4).length
    return { facts, styles, anchors }
  }, [memories])

  const handleImportanceChange = async (memoryId, nextImportance) => {
    setPendingId(memoryId)
    try {
      const res = await fetch(`http://localhost:8080/api/v1/memories/${memoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser
        },
        body: JSON.stringify({ importance: nextImportance })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update memory')
      setMemories((prev) => prev.map((item) => (item.id === memoryId ? { ...item, importance: nextImportance } : item)))
    } catch (err) {
      console.error('[MemoryVault] Update error:', err)
    } finally {
      setPendingId(null)
    }
  }

  const handleDelete = async (memoryId) => {
    setPendingId(memoryId)
    try {
      const res = await fetch(`http://localhost:8080/api/v1/memories/${memoryId}`, {
        method: 'DELETE',
        headers: { 'X-User-Name': currentUser }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete memory')
      setMemories((prev) => prev.filter((item) => item.id !== memoryId))
    } catch (err) {
      console.error('[MemoryVault] Delete error:', err)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <div className="h-16 px-6 flex items-center justify-between shrink-0 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl border border-cyan-400/12 bg-cyan-400/[0.06] flex items-center justify-center text-cyan-200">
            <Brain size={16} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/28 font-mono">Phase 4</div>
            <div className="text-[15px] font-semibold tracking-tight text-white">Memory Vault</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/12 bg-emerald-400/[0.06] text-[10px] uppercase tracking-[0.18em] text-emerald-100/80 font-mono">
          <Sparkles size={12} />
          Closed Loop Online
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <section className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/28 font-mono mb-2">Fact Fragments</div>
                <div className="text-2xl font-semibold text-white">{summary.facts}</div>
              </div>
              <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/28 font-mono mb-2">Style Prints</div>
                <div className="text-2xl font-semibold text-white">{summary.styles}</div>
              </div>
              <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/28 font-mono mb-2">Anchor Memory</div>
                <div className="text-2xl font-semibold text-white">{summary.anchors}</div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.06] bg-[#0d1015] p-4 space-y-4">
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-xl">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search memory content, entity, or source crystal..."
                    className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/22"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-white/45">
                    <SlidersHorizontal size={14} />
                    <span className="text-[11px] uppercase tracking-[0.18em] font-mono">Filter</span>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                    {categoryOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCategory(option.value)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-mono uppercase tracking-[0.16em] transition-colors ${
                          category === option.value
                            ? 'bg-cyan-400/[0.14] text-cyan-100 border border-cyan-400/18'
                            : 'text-white/35 hover:text-white/70'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-sm text-white/35">
                  Mapping your personal memory archive...
                </div>
              ) : memories.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-sm text-white/35">
                  No memory matched this filter yet. Save or edit more crystals to feed the archive.
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map((item) => (
                    <article key={item.id} className="rounded-[24px] border border-white/[0.06] bg-white/[0.025] px-5 py-4">
                      <div className="flex flex-col xl:flex-row xl:items-start gap-4 xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-mono border ${
                              item.category === 'style'
                                ? 'text-fuchsia-200 border-fuchsia-400/18 bg-fuchsia-400/[0.08]'
                                : 'text-cyan-100 border-cyan-400/18 bg-cyan-400/[0.08]'
                            }`}>
                              {item.category}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-white/24">
                              importance {item.importance}
                            </span>
                            {item.entity && (
                              <span className="text-[11px] text-white/45 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1">
                                {item.entity}
                              </span>
                            )}
                          </div>

                          <div className="text-[15px] leading-7 text-white/82">{item.content}</div>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-white/28">
                            <span>Source: {item.sourceTitle || 'Detached memory'}</span>
                            {item.updatedAt && <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 xl:w-[220px] shrink-0">
                          <select
                            value={item.importance}
                            disabled={pendingId === item.id}
                            onChange={(e) => handleImportanceChange(item.id, Number(e.target.value))}
                            className="rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/18"
                          >
                            {[1, 2, 3, 4, 5].map((level) => (
                              <option key={level} value={level} className="bg-[#0d1015] text-white">
                                {level} · {importanceLabels[level - 1]}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => item.sourceSlug && onNavigateToCrystal?.(item.sourceSlug)}
                              disabled={!item.sourceSlug}
                              className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-sm text-white/72 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                            >
                              <ArrowUpRight size={14} />
                              Open Source
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={pendingId === item.id}
                              className="w-12 h-12 rounded-2xl border border-rose-400/16 bg-rose-400/[0.06] text-rose-100/80 hover:bg-rose-400/[0.12] disabled:opacity-40 transition-colors flex items-center justify-center"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/[0.06] bg-[#0d1015] p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/70 font-mono mb-2">System State</div>
              <div className="text-lg text-white font-semibold mb-3">Memory Loop Closed</div>
              <div className="text-sm text-white/50 leading-7">
                Crystals now feed a personal memory archive, recall updates importance over time, duplicates merge instead of endlessly piling up, and you can curate the archive here.
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.06] bg-[#0d1015] p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/28 font-mono mb-2">What This Solves</div>
              <div className="space-y-3 text-sm text-white/55 leading-7">
                <div>Less repetition: repeated facts merge into stronger memories instead of noisy duplicates.</div>
                <div>More relevance: recalled memories automatically gain weight when they keep helping.</div>
                <div>Human control: you can remove bad memories or pin important ones by raising their importance.</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
