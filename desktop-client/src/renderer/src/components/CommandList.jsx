import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Sparkles, AlignLeft, List, Scissors, Languages, Zap, Palette, FileText } from 'lucide-react'

const CommandList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }
      if (event.key === 'ArrowDown' || event.key === 'Tab') {
        downHandler()
        return true
      }
      if (event.key === 'Enter') {
        enterHandler()
        return true
      }
      return false
    },
  }))

  return (
    <div className="glass-panel overflow-hidden py-1.5 min-w-[200px] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
      {props.items.length > 0 ? (
        <div className="flex flex-col">
          <div className="px-3 py-1 text-[10px] font-mono text-white/30 uppercase tracking-widest">
            AI Creation Tools
          </div>
          {props.items.map((item, index) => (
            <button
              key={index}
              className={`flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 ${
                index === selectedIndex ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
              onClick={() => selectItem(index)}
            >
              <div className={`p-1.5 rounded-lg ${index === selectedIndex ? 'bg-white/10 text-white' : 'bg-white/5'}`}>
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium">{item.title}</span>
                <span className="text-[10px] opacity-50">{item.description}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-3 py-2 text-sm text-white/40 italic">No commands found</div>
      )}
    </div>
  )
})

export default CommandList
