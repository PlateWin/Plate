import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WikiSuggestionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const item = props.items[selectedIndex];
        if (item) {
          props.command({ id: item.slug, label: item.title });
        }
        return true;
      }
      return false;
    },
  }));

  if (!props.items || props.items.length === 0) {
    return (
      <div className="glass-panel p-2 text-xs text-gray-500 italic bg-[#0a0a0a]/90 backdrop-blur-md border-[#333] shadow-2xl">
        未找到匹配的结晶...
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col py-1 overflow-hidden bg-[#0a0a0a]/95 backdrop-blur-md border-white/10 shadow-2xl rounded-xl w-64">
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-mono border-b border-white/5 mb-1">
        Link to Crystal
      </div>
      <div className="max-h-48 overflow-y-auto custom-scrollbar px-1">
        {props.items.map((item, index) => (
          <button
            key={item.slug}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors duration-150 ${
              index === selectedIndex ? 'bg-[#00D1FF]/15 text-[#00D1FF]' : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
            onClick={() => props.command({ id: item.slug, label: item.title })}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="opacity-50 text-xs">[[</span>
            <span className="truncate flex-1 font-medium">{item.title}</span>
            <span className="opacity-50 text-xs">]]</span>
          </button>
        ))}
      </div>
    </div>
  );
});

WikiSuggestionList.displayName = 'WikiSuggestionList';

export default WikiSuggestionList;
